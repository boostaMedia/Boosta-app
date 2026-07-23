-- ============================================================================
-- Migration: catalog
-- Services offered by providers, their images, and promotional offers.
-- ============================================================================

create table public.services (
  id               uuid primary key default gen_random_uuid(),
  provider_id      uuid not null references public.providers (id) on delete cascade,
  category_id      uuid not null references public.categories (id) on delete restrict,
  sub_category_id  uuid references public.sub_categories (id) on delete set null,
  slug             text not null,
  title_en         text not null,
  title_ar         text not null,
  description_en   text,
  description_ar   text,
  base_price       numeric(10, 3) not null default 0 check (base_price >= 0),
  currency         text not null default 'KWD',
  price_type       public.price_type not null default 'fixed',
  duration_minutes integer check (duration_minutes is null or duration_minutes > 0),
  status           public.service_status not null default 'draft',
  is_featured      boolean not null default false,
  rating           numeric(3, 2) not null default 0 check (rating >= 0 and rating <= 5),
  reviews_count    integer not null default 0 check (reviews_count >= 0),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz,
  unique (provider_id, slug)
);
create index services_provider_id_idx on public.services (provider_id);
create index services_category_id_idx on public.services (category_id);
create index services_sub_category_id_idx on public.services (sub_category_id);
create index services_status_idx on public.services (status) where deleted_at is null;
create index services_featured_idx on public.services (is_featured) where deleted_at is null;

create table public.service_images (
  id          uuid primary key default gen_random_uuid(),
  service_id  uuid not null references public.services (id) on delete cascade,
  url         text not null,
  alt_en      text,
  alt_ar      text,
  is_primary  boolean not null default false,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);
create index service_images_service_id_idx on public.service_images (service_id);
-- Exactly one primary image per service.
create unique index service_images_one_primary_idx
  on public.service_images (service_id) where is_primary;

create table public.offers (
  id               uuid primary key default gen_random_uuid(),
  provider_id      uuid not null references public.providers (id) on delete cascade,
  service_id       uuid references public.services (id) on delete cascade,
  title_en         text not null,
  title_ar         text not null,
  description_en   text,
  description_ar   text,
  discount_type    public.discount_type not null,
  discount_value   numeric(10, 3) not null check (discount_value >= 0),
  original_price   numeric(10, 3) check (original_price >= 0),
  final_price      numeric(10, 3) check (final_price >= 0),
  currency         text not null default 'KWD',
  starts_at        timestamptz not null default now(),
  ends_at          timestamptz,
  status           public.offer_status not null default 'draft',
  max_redemptions  integer check (max_redemptions is null or max_redemptions > 0),
  redemptions_count integer not null default 0 check (redemptions_count >= 0),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz,
  constraint offers_window_ck check (ends_at is null or ends_at > starts_at),
  constraint offers_percentage_ck check (
    discount_type <> 'percentage' or discount_value <= 100
  )
);
create index offers_provider_id_idx on public.offers (provider_id);
create index offers_service_id_idx on public.offers (service_id);
create index offers_status_idx on public.offers (status) where deleted_at is null;

create trigger set_services_updated_at before update on public.services
  for each row execute function public.set_updated_at();
create trigger set_offers_updated_at before update on public.offers
  for each row execute function public.set_updated_at();
