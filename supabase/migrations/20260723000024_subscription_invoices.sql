-- ============================================================================
-- Migration: subscription_invoices
--
-- Ledger for the provider annual membership: one invoice per billing period.
-- Until an online payment gateway is connected, an admin records payments by
-- hand; recording a payment also starts (or extends) the provider's
-- subscription, in the same transaction. Writes only happen through the
-- SECURITY DEFINER functions below (each checks is_admin()), so the table
-- itself is read-only to clients.
--
-- Overdue is not a stored status: it's an invoice still 'due' past its
-- due_at, derived where it's read.
-- ============================================================================

create table if not exists public.subscription_invoices (
  id             uuid primary key default gen_random_uuid(),
  provider_id    uuid not null references public.providers (id) on delete cascade,
  package_id     uuid not null references public.provider_packages (id) on delete restrict,
  amount         numeric(10, 2) not null check (amount >= 0),
  currency       text not null default 'USD',
  status         text not null default 'due' check (status in ('due', 'paid', 'void')),
  due_at         timestamptz not null,
  paid_at        timestamptz,
  payment_method text,
  reference      text,
  note           text,
  recorded_by    uuid references public.users (id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists subscription_invoices_provider_id_idx on public.subscription_invoices (provider_id);
create index if not exists subscription_invoices_status_idx on public.subscription_invoices (status);
create index if not exists subscription_invoices_due_at_idx on public.subscription_invoices (due_at);
-- One open invoice per provider at a time.
create unique index if not exists subscription_invoices_one_due_idx
  on public.subscription_invoices (provider_id) where status = 'due';

drop trigger if exists set_subscription_invoices_updated_at on public.subscription_invoices;
create trigger set_subscription_invoices_updated_at before update on public.subscription_invoices
  for each row execute function public.set_updated_at();

alter table public.subscription_invoices enable row level security;

drop policy if exists "subscription_invoices read" on public.subscription_invoices;
create policy "subscription_invoices read" on public.subscription_invoices
  for select to authenticated
  using (public.is_provider_owner(provider_id) or public.is_admin());

-- New table: grant explicitly (see fix_missing_grants). Read only — no
-- client INSERT/UPDATE/DELETE; the functions below own all writes.
grant select on public.subscription_invoices to authenticated;

-- Open (or return the existing open) invoice for a provider's annual plan.
create or replace function public.issue_subscription_invoice(p_provider_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_pkg public.provider_packages;
begin
  if not public.is_admin() then
    raise exception 'admin only' using errcode = '42501';
  end if;

  select id into v_id from public.subscription_invoices
   where provider_id = p_provider_id and status = 'due';
  if found then
    return v_id;
  end if;

  select * into v_pkg from public.provider_packages
   where slug = 'annual-membership' and is_active;
  if not found then
    raise exception 'annual-membership package is not available';
  end if;

  insert into public.subscription_invoices (provider_id, package_id, amount, currency, due_at)
  values (p_provider_id, v_pkg.id, v_pkg.price, v_pkg.currency, now() + interval '14 days')
  returning id into v_id;
  return v_id;
end;
$$;

-- Mark an invoice paid and start or extend the provider's subscription.
create or replace function public.record_subscription_payment(
  p_invoice_id uuid,
  p_method text,
  p_reference text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inv public.subscription_invoices;
begin
  if not public.is_admin() then
    raise exception 'admin only' using errcode = '42501';
  end if;

  select * into v_inv from public.subscription_invoices where id = p_invoice_id for update;
  if not found then
    raise exception 'invoice not found';
  end if;
  if v_inv.status <> 'due' then
    raise exception 'invoice is not open';
  end if;

  update public.subscription_invoices
     set status = 'paid', paid_at = now(), payment_method = nullif(trim(p_method), ''),
         reference = nullif(trim(p_reference), ''), recorded_by = auth.uid()
   where id = p_invoice_id;

  if exists (
    select 1 from public.provider_subscriptions
     where provider_id = v_inv.provider_id and status in ('trialing', 'active', 'past_due')
  ) then
    update public.provider_subscriptions
       set status = 'active',
           current_period_end = greatest(current_period_end, now()) + interval '1 year'
     where provider_id = v_inv.provider_id and status in ('trialing', 'active', 'past_due');
  else
    insert into public.provider_subscriptions
      (provider_id, package_id, status, current_period_start, current_period_end)
    values (v_inv.provider_id, v_inv.package_id, 'active', now(), now() + interval '1 year');
  end if;
end;
$$;

create or replace function public.void_subscription_invoice(p_invoice_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'admin only' using errcode = '42501';
  end if;
  update public.subscription_invoices set status = 'void'
   where id = p_invoice_id and status = 'due';
end;
$$;

revoke all on function public.issue_subscription_invoice(uuid) from public, anon;
revoke all on function public.record_subscription_payment(uuid, text, text) from public, anon;
revoke all on function public.void_subscription_invoice(uuid) from public, anon;
grant execute on function public.issue_subscription_invoice(uuid) to authenticated;
grant execute on function public.record_subscription_payment(uuid, text, text) to authenticated;
grant execute on function public.void_subscription_invoice(uuid) to authenticated;
