-- ============================================================================
-- Migration: billing
-- Payments, ledger transactions, and coupons.
-- ============================================================================

create table public.payments (
  id                uuid primary key default gen_random_uuid(),
  order_id          uuid not null references public.orders (id) on delete cascade,
  user_id           uuid not null references public.users (id) on delete restrict,
  provider_id       uuid references public.providers (id) on delete set null,
  method            public.payment_method not null,
  status            public.payment_status not null default 'pending',
  amount            numeric(10, 3) not null check (amount >= 0),
  currency          text not null default 'KWD',
  gateway           text not null default 'myfatoorah',
  gateway_reference text,
  gateway_payload   jsonb not null default '{}'::jsonb,
  refunded_amount   numeric(10, 3) not null default 0 check (refunded_amount >= 0),
  paid_at           timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint payments_refund_ck check (refunded_amount <= amount)
);
create index payments_order_id_idx on public.payments (order_id);
create index payments_user_id_idx on public.payments (user_id);
create index payments_status_idx on public.payments (status);

-- Double-entry-friendly ledger of value movements.
create table public.transactions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references public.users (id) on delete set null,
  order_id      uuid references public.orders (id) on delete set null,
  payment_id    uuid references public.payments (id) on delete set null,
  type          public.transaction_type not null,
  status        public.transaction_status not null default 'pending',
  amount        numeric(10, 3) not null,
  currency      text not null default 'KWD',
  balance_after numeric(10, 3),
  reference     text,
  metadata      jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index transactions_user_id_idx on public.transactions (user_id, created_at desc);
create index transactions_order_id_idx on public.transactions (order_id);
create index transactions_type_idx on public.transactions (type);

create table public.coupons (
  id                uuid primary key default gen_random_uuid(),
  code              text not null unique,
  provider_id       uuid references public.providers (id) on delete cascade,
  type              public.discount_type not null,
  value             numeric(10, 3) not null check (value >= 0),
  max_discount      numeric(10, 3) check (max_discount >= 0),
  min_order_amount  numeric(10, 3) check (min_order_amount >= 0),
  usage_limit       integer check (usage_limit is null or usage_limit > 0),
  usage_count       integer not null default 0 check (usage_count >= 0),
  per_user_limit    integer check (per_user_limit is null or per_user_limit > 0),
  starts_at         timestamptz not null default now(),
  ends_at           timestamptz,
  status            public.coupon_status not null default 'active',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  deleted_at        timestamptz,
  constraint coupons_window_ck check (ends_at is null or ends_at > starts_at),
  constraint coupons_percentage_ck check (type <> 'percentage' or value <= 100)
);
create index coupons_status_idx on public.coupons (status) where deleted_at is null;
create index coupons_provider_id_idx on public.coupons (provider_id);

create trigger set_payments_updated_at before update on public.payments
  for each row execute function public.set_updated_at();
create trigger set_transactions_updated_at before update on public.transactions
  for each row execute function public.set_updated_at();
create trigger set_coupons_updated_at before update on public.coupons
  for each row execute function public.set_updated_at();
