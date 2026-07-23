-- ============================================================================
-- Migration: users & profiles
-- Application user records (1:1 with auth.users) plus extended profiles, and
-- the RBAC helper functions used throughout the RLS policies.
-- ============================================================================

-- Application-level user record. `id` mirrors auth.users(id).
create table public.users (
  id             uuid primary key references auth.users (id) on delete cascade,
  email          text unique,
  phone          text unique,
  role           public.user_role not null default 'customer',
  status         public.user_status not null default 'active',
  is_verified    boolean not null default false,
  last_sign_in_at timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz
);
create index users_role_idx on public.users (role) where deleted_at is null;
create index users_status_idx on public.users (status);

-- Extended, display-oriented profile (1:1 with users).
create table public.profiles (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null unique references public.users (id) on delete cascade,
  full_name      text,
  display_name   text,
  avatar_url     text,
  bio            text,
  gender         text check (gender in ('male', 'female', 'unspecified')),
  date_of_birth  date,
  locale         text not null default 'ar' check (locale in ('ar', 'en')),
  city_id        uuid references public.cities (id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index profiles_city_id_idx on public.profiles (city_id);

create trigger set_users_updated_at before update on public.users
  for each row execute function public.set_updated_at();
create trigger set_profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- --------------------------------------------------------------------------
-- Auth integration: provision a public.users + profiles row for every new
-- auth.users entry.
-- --------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, phone, role)
  values (
    new.id,
    new.email,
    new.phone,
    coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'customer')
  )
  on conflict (id) do nothing;

  insert into public.profiles (user_id, full_name, locale)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    coalesce(new.raw_user_meta_data ->> 'locale', 'ar')
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- --------------------------------------------------------------------------
-- RBAC helpers (used by RLS policies). SECURITY DEFINER so they can read
-- public.users regardless of the caller's own row-level permissions.
-- --------------------------------------------------------------------------
create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.users where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role = 'admin' and deleted_at is null
  );
$$;
