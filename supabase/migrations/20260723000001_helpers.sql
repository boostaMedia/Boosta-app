-- ============================================================================
-- Migration: helpers
-- Generic, table-independent helper functions used across the schema.
-- ============================================================================

-- Keep an `updated_at` column in sync on every UPDATE.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

comment on function public.set_updated_at() is
  'Trigger function: sets updated_at to now() before each UPDATE.';
