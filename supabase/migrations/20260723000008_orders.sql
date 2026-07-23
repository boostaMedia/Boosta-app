-- ============================================================================
-- Migration: orders
-- Orders and their immutable status-history trail.
-- ============================================================================

-- Human-friendly, sequential order numbers (e.g. BM-00000042).
create sequence public.order_number_seq;

create table public.orders (
  id                uuid primary key default gen_random_uuid(),
  order_number      text not null unique
                      default ('BM-' || lpad(nextval('public.order_number_seq')::text, 8, '0')),
  customer_id       uuid not null references public.users (id) on delete restrict,
  provider_id       uuid not null references public.providers (id) on delete restrict,
  service_id        uuid references public.services (id) on delete set null,
  provider_quote_id uuid references public.provider_quotes (id) on delete set null,
  offer_id          uuid references public.offers (id) on delete set null,
  status            public.order_status not null default 'pending',
  subtotal          numeric(10, 3) not null default 0 check (subtotal >= 0),
  discount_amount   numeric(10, 3) not null default 0 check (discount_amount >= 0),
  tax_amount        numeric(10, 3) not null default 0 check (tax_amount >= 0),
  commission_amount numeric(10, 3) not null default 0 check (commission_amount >= 0),
  total_amount      numeric(10, 3) not null default 0 check (total_amount >= 0),
  currency          text not null default 'KWD',
  scheduled_at      timestamptz,
  city_id           uuid references public.cities (id) on delete set null,
  area_id           uuid references public.areas (id) on delete set null,
  address           text,
  notes             text,
  cancelled_reason  text,
  completed_at      timestamptz,
  cancelled_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  deleted_at        timestamptz
);
create index orders_customer_id_idx on public.orders (customer_id);
create index orders_provider_id_idx on public.orders (provider_id);
create index orders_status_idx on public.orders (status) where deleted_at is null;
create index orders_created_at_idx on public.orders (created_at desc);

create table public.order_status_history (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders (id) on delete cascade,
  from_status public.order_status,
  to_status   public.order_status not null,
  changed_by  uuid references public.users (id) on delete set null,
  note        text,
  created_at  timestamptz not null default now()
);
create index order_status_history_order_id_idx on public.order_status_history (order_id);

create trigger set_orders_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

-- Record a status-history row whenever an order's status changes (and on
-- initial insert), so the trail is maintained automatically.
create or replace function public.log_order_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.order_status_history (order_id, from_status, to_status, changed_by)
    values (new.id, null, new.status, auth.uid());
  elsif tg_op = 'UPDATE' and new.status is distinct from old.status then
    insert into public.order_status_history (order_id, from_status, to_status, changed_by)
    values (new.id, old.status, new.status, auth.uid());
  end if;
  return new;
end;
$$;

create trigger log_order_status_insert
  after insert on public.orders
  for each row execute function public.log_order_status_change();
create trigger log_order_status_update
  after update on public.orders
  for each row execute function public.log_order_status_change();
