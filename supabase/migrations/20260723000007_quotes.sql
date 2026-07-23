-- ============================================================================
-- Migration: quotes
-- Customer quote requests, their line items, and provider responses.
-- ============================================================================

create table public.quote_requests (
  id               uuid primary key default gen_random_uuid(),
  customer_id      uuid not null references public.users (id) on delete cascade,
  category_id      uuid not null references public.categories (id) on delete restrict,
  sub_category_id  uuid references public.sub_categories (id) on delete set null,
  city_id          uuid references public.cities (id) on delete set null,
  area_id          uuid references public.areas (id) on delete set null,
  title            text not null,
  description      text,
  budget_min       numeric(10, 3) check (budget_min >= 0),
  budget_max       numeric(10, 3) check (budget_max >= 0),
  currency         text not null default 'KWD',
  preferred_date   timestamptz,
  attachments      jsonb not null default '[]'::jsonb,
  status           public.quote_request_status not null default 'open',
  expires_at       timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz,
  constraint quote_requests_budget_ck check (
    budget_min is null or budget_max is null or budget_max >= budget_min
  )
);
create index quote_requests_customer_id_idx on public.quote_requests (customer_id);
create index quote_requests_category_id_idx on public.quote_requests (category_id);
create index quote_requests_status_idx on public.quote_requests (status) where deleted_at is null;

create table public.quote_items (
  id                uuid primary key default gen_random_uuid(),
  quote_request_id  uuid not null references public.quote_requests (id) on delete cascade,
  description       text not null,
  quantity          integer not null default 1 check (quantity > 0),
  unit              text,
  notes             text,
  sort_order        integer not null default 0,
  created_at        timestamptz not null default now()
);
create index quote_items_quote_request_id_idx on public.quote_items (quote_request_id);

create table public.provider_quotes (
  id                        uuid primary key default gen_random_uuid(),
  quote_request_id          uuid not null references public.quote_requests (id) on delete cascade,
  provider_id               uuid not null references public.providers (id) on delete cascade,
  service_id                uuid references public.services (id) on delete set null,
  amount                    numeric(10, 3) not null check (amount >= 0),
  currency                  text not null default 'KWD',
  message                   text,
  estimated_duration_minutes integer check (estimated_duration_minutes is null or estimated_duration_minutes > 0),
  valid_until               timestamptz,
  status                    public.provider_quote_status not null default 'submitted',
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  unique (quote_request_id, provider_id)
);
create index provider_quotes_quote_request_id_idx on public.provider_quotes (quote_request_id);
create index provider_quotes_provider_id_idx on public.provider_quotes (provider_id);
create index provider_quotes_status_idx on public.provider_quotes (status);

create trigger set_quote_requests_updated_at before update on public.quote_requests
  for each row execute function public.set_updated_at();
create trigger set_provider_quotes_updated_at before update on public.provider_quotes
  for each row execute function public.set_updated_at();
