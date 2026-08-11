-- ============================================================================
-- Migration: business_listings
-- "Projects for Sale" — complete businesses/projects a provider is selling,
-- distinct from the services catalog (which is "book this recurring
-- service"). A listing here is a one-off sale: the business/project itself.
-- ============================================================================

create type public.business_listing_status as enum
  ('draft', 'active', 'under_offer', 'sold', 'inactive');

create table public.business_listings (
  id                uuid primary key default gen_random_uuid(),
  provider_id       uuid not null references public.providers (id) on delete cascade,
  slug              text not null,

  title_en          text not null,
  title_ar          text not null,
  description_en    text,
  description_ar    text,
  industry_en       text,
  industry_ar       text,

  asking_price      numeric(12, 3) not null check (asking_price >= 0),
  currency          text not null default 'KWD',
  monthly_revenue   numeric(12, 3) check (monthly_revenue is null or monthly_revenue >= 0),
  established_year  integer check (established_year is null or established_year between 1900 and 2100),

  city_id           uuid references public.cities (id) on delete set null,
  status            public.business_listing_status not null default 'draft',
  is_featured       boolean not null default false,
  views_count       integer not null default 0,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  deleted_at        timestamptz,

  unique (provider_id, slug)
);
create index business_listings_provider_id_idx on public.business_listings (provider_id);
create index business_listings_status_idx on public.business_listings (status) where deleted_at is null;
create index business_listings_featured_idx on public.business_listings (is_featured) where deleted_at is null;
create index business_listings_city_id_idx on public.business_listings (city_id);

create table public.business_listing_images (
  id          uuid primary key default gen_random_uuid(),
  listing_id  uuid not null references public.business_listings (id) on delete cascade,
  url         text not null,
  alt_en      text,
  alt_ar      text,
  is_primary  boolean not null default false,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);
create index business_listing_images_listing_id_idx on public.business_listing_images (listing_id);
create unique index business_listing_images_one_primary_idx
  on public.business_listing_images (listing_id) where is_primary;

create trigger set_business_listings_updated_at before update on public.business_listings
  for each row execute function public.set_updated_at();

-- --------------------------------------------------------------------------
-- Row-level security. Mirrors the services table's pattern: public read of
-- active rows, provider owns their own listings (any status), admin full.
-- --------------------------------------------------------------------------
alter table public.business_listings enable row level security;
alter table public.business_listing_images enable row level security;

create policy "business_listings public read" on public.business_listings
  for select to anon, authenticated
  using (
    (status = 'active' and deleted_at is null)
    or public.is_provider_owner(provider_id)
    or public.is_admin()
  );

create policy "business_listings provider write" on public.business_listings
  for all to authenticated
  using (public.is_provider_owner(provider_id) or public.is_admin())
  with check (public.is_provider_owner(provider_id) or public.is_admin());

create policy "business_listing_images public read" on public.business_listing_images
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.business_listings l
      where l.id = listing_id
        and ((l.status = 'active' and l.deleted_at is null)
             or public.is_provider_owner(l.provider_id)
             or public.is_admin())
    )
  );

create policy "business_listing_images provider write" on public.business_listing_images
  for all to authenticated
  using (
    exists (
      select 1 from public.business_listings l
      where l.id = listing_id
        and (public.is_provider_owner(l.provider_id) or public.is_admin())
    )
  )
  with check (
    exists (
      select 1 from public.business_listings l
      where l.id = listing_id
        and (public.is_provider_owner(l.provider_id) or public.is_admin())
    )
  );
