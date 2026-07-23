-- ============================================================================
-- Migration: audit
-- A generic append-only audit trail attached to sensitive tables.
-- ============================================================================

create table public.audit_logs (
  id          uuid primary key default gen_random_uuid(),
  table_name  text not null,
  record_id   uuid,
  action      text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  actor_id    uuid,
  old_data    jsonb,
  new_data    jsonb,
  created_at  timestamptz not null default now()
);
create index audit_logs_table_record_idx on public.audit_logs (table_name, record_id);
create index audit_logs_actor_idx on public.audit_logs (actor_id);
create index audit_logs_created_at_idx on public.audit_logs (created_at desc);

-- Generic audit trigger. Assumes the audited table has a uuid `id` column.
create or replace function public.audit_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old jsonb;
  v_new jsonb;
  v_record_id uuid;
begin
  if tg_op = 'DELETE' then
    v_old := to_jsonb(old);
    v_record_id := old.id;
  elsif tg_op = 'UPDATE' then
    v_old := to_jsonb(old);
    v_new := to_jsonb(new);
    v_record_id := new.id;
  else
    v_new := to_jsonb(new);
    v_record_id := new.id;
  end if;

  insert into public.audit_logs (table_name, record_id, action, actor_id, old_data, new_data)
  values (tg_table_name, v_record_id, tg_op, auth.uid(), v_old, v_new);

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

-- Attach the audit trigger to sensitive / high-value tables.
create trigger audit_users
  after insert or update or delete on public.users
  for each row execute function public.audit_trigger();
create trigger audit_providers
  after insert or update or delete on public.providers
  for each row execute function public.audit_trigger();
create trigger audit_provider_documents
  after insert or update or delete on public.provider_documents
  for each row execute function public.audit_trigger();
create trigger audit_provider_subscriptions
  after insert or update or delete on public.provider_subscriptions
  for each row execute function public.audit_trigger();
create trigger audit_services
  after insert or update or delete on public.services
  for each row execute function public.audit_trigger();
create trigger audit_offers
  after insert or update or delete on public.offers
  for each row execute function public.audit_trigger();
create trigger audit_orders
  after insert or update or delete on public.orders
  for each row execute function public.audit_trigger();
create trigger audit_payments
  after insert or update or delete on public.payments
  for each row execute function public.audit_trigger();
create trigger audit_transactions
  after insert or update or delete on public.transactions
  for each row execute function public.audit_trigger();
create trigger audit_coupons
  after insert or update or delete on public.coupons
  for each row execute function public.audit_trigger();
