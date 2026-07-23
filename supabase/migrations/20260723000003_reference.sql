-- ============================================================================
-- Migration: reference & geo
-- Lookup tables: cities, areas, categories, sub_categories, settings.
-- ============================================================================

-- Cities (governorates / major cities in Kuwait & GCC).
create table public.cities (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,
  name_en     text not null,
  name_ar     text not null,
  is_active   boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Areas / districts belonging to a city.
create table public.areas (
  id          uuid primary key default gen_random_uuid(),
  city_id     uuid not null references public.cities (id) on delete cascade,
  name_en     text not null,
  name_ar     text not null,
  is_active   boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (city_id, name_en)
);
create index areas_city_id_idx on public.areas (city_id);

-- Top-level service categories.
create table public.categories (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique,
  name_en        text not null,
  name_ar        text not null,
  description_en text,
  description_ar text,
  icon           text,
  image_url      text,
  is_active      boolean not null default true,
  sort_order     integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz
);
create index categories_active_idx on public.categories (is_active) where deleted_at is null;

-- Sub-categories nested under a category.
create table public.sub_categories (
  id           uuid primary key default gen_random_uuid(),
  category_id  uuid not null references public.categories (id) on delete cascade,
  slug         text not null,
  name_en      text not null,
  name_ar      text not null,
  is_active    boolean not null default true,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz,
  unique (category_id, slug)
);
create index sub_categories_category_id_idx on public.sub_categories (category_id);

-- Key/value application settings (feature flags, tunables).
create table public.settings (
  id           uuid primary key default gen_random_uuid(),
  key          text not null unique,
  value        jsonb not null default '{}'::jsonb,
  description  text,
  is_public    boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- updated_at triggers.
create trigger set_cities_updated_at before update on public.cities
  for each row execute function public.set_updated_at();
create trigger set_areas_updated_at before update on public.areas
  for each row execute function public.set_updated_at();
create trigger set_categories_updated_at before update on public.categories
  for each row execute function public.set_updated_at();
create trigger set_sub_categories_updated_at before update on public.sub_categories
  for each row execute function public.set_updated_at();
create trigger set_settings_updated_at before update on public.settings
  for each row execute function public.set_updated_at();
