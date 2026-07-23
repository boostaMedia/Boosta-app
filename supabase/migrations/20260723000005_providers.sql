-- ============================================================================
-- Migration: providers
-- Provider businesses, their verification documents, subscription packages,
-- and active subscriptions.
-- ============================================================================

create table public.providers (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null unique references public.users (id) on delete cascade,
  slug              text not null unique,
  business_name_en  text not null,
  business_name_ar  text not null,
  description_en    text,
  description_ar    text,
  logo_url          text,
  cover_url         text,
  status            public.provider_status not null default 'pending',
  is_featured       boolean not null default false,
  rating            numeric(3, 2) not null default 0 check (rating >= 0 and rating <= 5),
  reviews_count     integer not null default 0 check (reviews_count >= 0),
  city_id           uuid references public.cities (id) on delete set null,
  area_id           uuid references public.areas (id) on delete set null,
  commission_rate   numeric(5, 2) not null default 10.00 check (commission_rate >= 0 and commission_rate <= 100),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  deleted_at        timestamptz
);
create index providers_status_idx on public.providers (status) where deleted_at is null;
create index providers_city_id_idx on public.providers (city_id);
create index providers_featured_idx on public.providers (is_featured) where deleted_at is null;

create table public.provider_documents (
  id           uuid primary key default gen_random_uuid(),
  provider_id  uuid not null references public.providers (id) on delete cascade,
  type         public.document_type not null,
  file_url     text not null,
  status       public.document_status not null default 'pending',
  notes        text,
  reviewed_by  uuid references public.users (id) on delete set null,
  reviewed_at  timestamptz,
  expires_at   timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index provider_documents_provider_id_idx on public.provider_documents (provider_id);
create index provider_documents_status_idx on public.provider_documents (status);

-- Subscription plan definitions (catalog).
create table public.provider_packages (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique,
  name_en          text not null,
  name_ar          text not null,
  description_en   text,
  description_ar   text,
  price            numeric(10, 3) not null check (price >= 0),
  currency         text not null default 'KWD',
  billing_interval public.billing_interval not null default 'monthly',
  features         jsonb not null default '[]'::jsonb,
  max_services     integer,
  max_offers       integer,
  is_active        boolean not null default true,
  sort_order       integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table public.provider_subscriptions (
  id                   uuid primary key default gen_random_uuid(),
  provider_id          uuid not null references public.providers (id) on delete cascade,
  package_id           uuid not null references public.provider_packages (id) on delete restrict,
  status               public.subscription_status not null default 'trialing',
  started_at           timestamptz not null default now(),
  current_period_start timestamptz not null default now(),
  current_period_end   timestamptz not null,
  cancel_at            timestamptz,
  cancelled_at         timestamptz,
  auto_renew           boolean not null default true,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  constraint provider_subscriptions_period_ck check (current_period_end > current_period_start)
);
create index provider_subscriptions_provider_id_idx on public.provider_subscriptions (provider_id);
create index provider_subscriptions_status_idx on public.provider_subscriptions (status);
-- At most one active/trialing subscription per provider.
create unique index provider_subscriptions_one_live_idx
  on public.provider_subscriptions (provider_id)
  where status in ('trialing', 'active', 'past_due');

create trigger set_providers_updated_at before update on public.providers
  for each row execute function public.set_updated_at();
create trigger set_provider_documents_updated_at before update on public.provider_documents
  for each row execute function public.set_updated_at();
create trigger set_provider_packages_updated_at before update on public.provider_packages
  for each row execute function public.set_updated_at();
create trigger set_provider_subscriptions_updated_at before update on public.provider_subscriptions
  for each row execute function public.set_updated_at();

-- Helper: does the current user own the given provider?
create or replace function public.is_provider_owner(p_provider_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.providers
    where id = p_provider_id and user_id = auth.uid()
  );
$$;

-- Helper: the provider id owned by the current user (if any).
create or replace function public.current_provider_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.providers where user_id = auth.uid();
$$;
