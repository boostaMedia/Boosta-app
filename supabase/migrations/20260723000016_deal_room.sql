-- ============================================================================
-- Migration: deal_room
-- Chat-embedded payment requests ("Deal Room"). Extends the existing
-- conversations/messages tables rather than duplicating them; adds
-- commission configuration, payment requests, and an append-only payment
-- event ledger.
--
-- Money handling: payment_requests stores amounts in bigint fils (1 KWD =
-- 1000 fils) to avoid floating-point drift. Every other money column in this
-- schema (payments.amount, services.base_price, ...) stays numeric(10,3) —
-- this bigint convention is scoped to payment_requests only.
--
-- Commission model note: Boosta has a single flat annual provider access fee
-- (see provider_packages), not a dual free/paid listing tier. So unlike an
-- earlier draft of this feature, there is no "0%-commission subscription
-- track" here — every payment request is charged the resolved commission
-- rate (provider override > category override > global > 20% default),
-- configurable by admins via commission_rates.
-- ============================================================================

-- --------------------------------------------------------------------------
-- Enums
-- --------------------------------------------------------------------------
create type public.payment_request_status as enum
  ('draft', 'sent', 'paid', 'expired', 'cancelled', 'refunded');

-- --------------------------------------------------------------------------
-- Commission configuration.
-- --------------------------------------------------------------------------
create table public.commission_rates (
  id          uuid primary key default gen_random_uuid(),
  scope       text not null check (scope in ('global', 'provider', 'category')),
  scope_id    uuid,                        -- null for the global scope
  rate_bps    integer not null check (rate_bps between 0 and 10000), -- basis points; 2000 = 20%
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  created_by  uuid references public.users (id) on delete set null,
  constraint commission_rates_scope_id_ck check (
    (scope = 'global' and scope_id is null) or
    (scope <> 'global' and scope_id is not null)
  )
);
-- Only one active rate per scope/scope_id at a time. NULLS NOT DISTINCT is
-- required here: scope_id is NULL for the global scope, and a plain unique
-- index never treats two NULLs as duplicates — without this, nothing would
-- stop two "active" global rows from coexisting.
create unique index commission_rates_active_scope_idx
  on public.commission_rates (scope, scope_id) nulls not distinct where active;

comment on table public.commission_rates is
  'Admin-configurable commission rate overrides. Most specific active row wins: provider > category > global.';

-- --------------------------------------------------------------------------
-- Payment requests — issued by a provider inside a conversation, paid by the
-- customer via a hosted PSP page. No card data is ever stored here.
-- --------------------------------------------------------------------------
create sequence public.payment_request_reference_seq start 1001;

create table public.payment_requests (
  id               uuid primary key default gen_random_uuid(),
  reference        text not null unique
                     default ('PR-' || nextval('public.payment_request_reference_seq')::text),
  conversation_id  uuid not null references public.conversations (id) on delete cascade,
  provider_id      uuid not null references public.providers (id) on delete cascade,
  customer_id      uuid not null references public.users (id) on delete cascade,
  service_id       uuid references public.services (id) on delete set null,

  title            text not null,
  note             text,
  delivery_text    text,

  amount_fils      bigint not null check (amount_fils > 0),   -- gross, in fils
  fee_rate_bps     integer not null check (fee_rate_bps between 0 and 10000), -- frozen at creation
  fee_fils         bigint not null check (fee_fils >= 0),      -- frozen: (amount_fils * fee_rate_bps) / 10000
  net_fils         bigint not null check (net_fils >= 0),      -- amount_fils - fee_fils
  currency         text not null default 'KWD',

  status           public.payment_request_status not null default 'draft',
  expires_at       timestamptz not null,

  -- PSP fields (no card data, ever).
  psp              text,
  psp_invoice_id   text,
  psp_payment_url  text,
  psp_txn_id       text,
  paid_method      public.payment_method,
  paid_at          timestamptz,
  receipt_ref      text,

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  constraint payment_requests_net_ck check (net_fils = amount_fils - fee_fils)
);
alter sequence public.payment_request_reference_seq owned by public.payment_requests.reference;

create index payment_requests_conversation_id_idx on public.payment_requests (conversation_id, created_at desc);
create index payment_requests_provider_id_idx on public.payment_requests (provider_id, status);
create index payment_requests_customer_id_idx on public.payment_requests (customer_id);
create unique index payment_requests_psp_invoice_id_idx
  on public.payment_requests (psp_invoice_id) where psp_invoice_id is not null;

create trigger set_payment_requests_updated_at before update on public.payment_requests
  for each row execute function public.set_updated_at();

comment on column public.payment_requests.fee_rate_bps is
  'Frozen at creation from resolve_fee_rate_bps(). Later admin rate changes never retroactively alter issued requests.';

-- --------------------------------------------------------------------------
-- Payment events — append-only audit ledger. No update/delete path exists.
-- --------------------------------------------------------------------------
create table public.payment_events (
  id                  uuid primary key default gen_random_uuid(),
  payment_request_id  uuid not null references public.payment_requests (id) on delete cascade,
  event               text not null check (event in (
                         'created', 'link_generated', 'webhook_received', 'paid',
                         'expired', 'cancelled', 'refunded', 'webhook_rejected'
                       )),
  actor               text not null check (actor in ('provider', 'customer', 'system', 'psp', 'admin')),
  payload             jsonb,
  created_at          timestamptz not null default now()
);
create index payment_events_payment_request_id_idx
  on public.payment_events (payment_request_id, created_at desc);

-- --------------------------------------------------------------------------
-- Extend messages to carry payment-request cards alongside text/attachments.
-- --------------------------------------------------------------------------
alter table public.messages
  add column type text not null default 'text' check (type in ('text', 'payment_request', 'attachment', 'system')),
  add column payment_request_id uuid references public.payment_requests (id) on delete set null;

create index messages_payment_request_id_idx
  on public.messages (payment_request_id) where payment_request_id is not null;

alter table public.messages drop constraint messages_content_ck;
alter table public.messages add constraint messages_content_ck check (
  (type = 'payment_request' and payment_request_id is not null)
  or (body is not null and length(btrim(body)) > 0)
  or jsonb_array_length(attachments) > 0
);
alter table public.messages add constraint messages_pr_link_chk check (
  type = 'payment_request' or payment_request_id is null
);

-- --------------------------------------------------------------------------
-- Fee resolution — server-side only, called at payment-request creation.
-- --------------------------------------------------------------------------
create or replace function public.resolve_fee_rate_bps(p_provider_id uuid, p_category_id uuid default null)
returns integer
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_rate integer;
begin
  select rate_bps into v_rate
    from public.commission_rates
    where scope = 'provider' and scope_id = p_provider_id and active
    limit 1;
  if v_rate is not null then
    return v_rate;
  end if;

  if p_category_id is not null then
    select rate_bps into v_rate
      from public.commission_rates
      where scope = 'category' and scope_id = p_category_id and active
      limit 1;
    if v_rate is not null then
      return v_rate;
    end if;
  end if;

  select rate_bps into v_rate
    from public.commission_rates
    where scope = 'global' and scope_id is null and active
    limit 1;

  return coalesce(v_rate, 2000); -- safety default: 20%
end;
$$;

revoke all on function public.resolve_fee_rate_bps(uuid, uuid) from public;
grant execute on function public.resolve_fee_rate_bps(uuid, uuid) to authenticated;

-- --------------------------------------------------------------------------
-- Payment request writes — never direct table INSERT/UPDATE from a client.
-- These SECURITY DEFINER functions are the only write path; they run as the
-- table owner and so are unaffected by the RLS policies below.
-- --------------------------------------------------------------------------
create or replace function public.create_payment_request(
  p_conversation_id  uuid,
  p_title            text,
  p_amount_fils      bigint,
  p_delivery_text    text default null,
  p_note             text default null,
  p_valid_for_hours  integer default 48
)
returns public.payment_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_conversation  public.conversations;
  v_category_id   uuid;
  v_rate_bps      integer;
  v_fee_fils      bigint;
  v_net_fils      bigint;
  v_pr            public.payment_requests;
begin
  if p_amount_fils is null or p_amount_fils <= 0 then
    raise exception 'amount_fils must be positive';
  end if;
  if p_valid_for_hours is null or p_valid_for_hours <= 0 then
    raise exception 'valid_for_hours must be positive';
  end if;
  if p_title is null or length(btrim(p_title)) = 0 then
    raise exception 'title is required';
  end if;

  select * into v_conversation from public.conversations where id = p_conversation_id;
  if v_conversation.id is null then
    raise exception 'conversation not found';
  end if;
  if not public.is_provider_owner(v_conversation.provider_id) then
    raise exception 'only the provider on this conversation can issue a payment request';
  end if;
  if v_conversation.status <> 'open' then
    raise exception 'conversation is not open';
  end if;

  if v_conversation.service_id is not null then
    select category_id into v_category_id
      from public.services where id = v_conversation.service_id;
  end if;

  v_rate_bps := public.resolve_fee_rate_bps(v_conversation.provider_id, v_category_id);
  v_fee_fils := (p_amount_fils * v_rate_bps) / 10000; -- truncating division, in the provider's favour
  v_net_fils := p_amount_fils - v_fee_fils;

  insert into public.payment_requests (
    conversation_id, provider_id, customer_id, service_id,
    title, note, delivery_text,
    amount_fils, fee_rate_bps, fee_fils, net_fils, currency,
    status, expires_at
  ) values (
    p_conversation_id, v_conversation.provider_id, v_conversation.customer_id, v_conversation.service_id,
    btrim(p_title), p_note, p_delivery_text,
    p_amount_fils, v_rate_bps, v_fee_fils, v_net_fils, 'KWD',
    'sent', now() + make_interval(hours => p_valid_for_hours)
  )
  returning * into v_pr;

  insert into public.messages (conversation_id, sender_id, type, payment_request_id)
  values (p_conversation_id, auth.uid(), 'payment_request', v_pr.id);

  insert into public.payment_events (payment_request_id, event, actor, payload)
  values (
    v_pr.id, 'created', 'provider',
    jsonb_build_object('amount_fils', p_amount_fils, 'fee_rate_bps', v_rate_bps)
  );

  return v_pr;
end;
$$;

revoke all on function public.create_payment_request(uuid, text, bigint, text, text, integer) from public;
grant execute on function public.create_payment_request(uuid, text, bigint, text, text, integer) to authenticated;

create or replace function public.cancel_payment_request(p_id uuid)
returns public.payment_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pr public.payment_requests;
begin
  select * into v_pr from public.payment_requests where id = p_id;
  if v_pr.id is null then
    raise exception 'payment request not found';
  end if;
  if not public.is_provider_owner(v_pr.provider_id) then
    raise exception 'only the issuing provider can cancel this payment request';
  end if;
  if v_pr.status <> 'sent' then
    raise exception 'only a sent payment request can be cancelled';
  end if;

  update public.payment_requests
    set status = 'cancelled'
    where id = p_id
    returning * into v_pr;

  insert into public.payment_events (payment_request_id, event, actor)
  values (p_id, 'cancelled', 'provider');

  insert into public.messages (conversation_id, sender_id, type, body)
  values (v_pr.conversation_id, auth.uid(), 'system', 'Payment request cancelled.');

  return v_pr;
end;
$$;

revoke all on function public.cancel_payment_request(uuid) from public;
grant execute on function public.cancel_payment_request(uuid) to authenticated;

-- Lazy expiry: flips stale 'sent' requests to 'expired' on demand (called
-- opportunistically from the read path). A scheduled pg_cron sweep can be
-- added later without changing this function's contract.
create or replace function public.expire_stale_payment_requests()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  with expired as (
    update public.payment_requests
      set status = 'expired'
      where status = 'sent' and expires_at < now()
      returning id
  )
  insert into public.payment_events (payment_request_id, event, actor)
  select id, 'expired', 'system' from expired;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.expire_stale_payment_requests() from public;
grant execute on function public.expire_stale_payment_requests() to authenticated;

-- --------------------------------------------------------------------------
-- Row-level security.
-- --------------------------------------------------------------------------
alter table public.commission_rates  enable row level security;
alter table public.payment_requests  enable row level security;
alter table public.payment_events    enable row level security;

create policy "commission_rates admin only" on public.commission_rates
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Participants can read their own payment requests. This exposes fee_fils/
-- net_fils at the row level — the API layer's role-based serializer (not
-- RLS) is what keeps those fields off the wire for the customer. See the
-- deal-room feature module.
create policy "payment_requests read participants" on public.payment_requests
  for select to authenticated
  using (
    customer_id = auth.uid()
    or public.is_provider_owner(provider_id)
    or public.is_admin()
  );

create policy "payment_events admin read" on public.payment_events
  for select to authenticated
  using (public.is_admin());

-- Defense in depth: even though no INSERT/UPDATE policy exists above (so RLS
-- already denies these), explicitly revoke the underlying grants too. All
-- writes go through the SECURITY DEFINER functions above, or the service
-- role (webhook handler, future admin refund action).
revoke insert, update, delete on public.payment_requests from authenticated;
revoke insert, update, delete on public.payment_events from authenticated;
