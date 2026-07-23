-- ============================================================================
-- Migration: engagement
-- Reviews (with rating aggregation), favorites, and notifications.
-- ============================================================================

create table public.reviews (
  id                  uuid primary key default gen_random_uuid(),
  order_id            uuid unique references public.orders (id) on delete set null,
  provider_id         uuid not null references public.providers (id) on delete cascade,
  service_id          uuid references public.services (id) on delete cascade,
  customer_id         uuid not null references public.users (id) on delete cascade,
  rating              integer not null check (rating between 1 and 5),
  title               text,
  comment             text,
  status              public.review_status not null default 'published',
  provider_reply      text,
  provider_replied_at timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  deleted_at          timestamptz
);
create index reviews_provider_id_idx on public.reviews (provider_id) where deleted_at is null;
create index reviews_service_id_idx on public.reviews (service_id);
create index reviews_customer_id_idx on public.reviews (customer_id);

create table public.favorites (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.users (id) on delete cascade,
  provider_id  uuid references public.providers (id) on delete cascade,
  service_id   uuid references public.services (id) on delete cascade,
  created_at   timestamptz not null default now(),
  -- Exactly one target per favorite.
  constraint favorites_target_ck check (
    (provider_id is not null and service_id is null)
    or (provider_id is null and service_id is not null)
  )
);
create unique index favorites_user_provider_idx
  on public.favorites (user_id, provider_id) where provider_id is not null;
create unique index favorites_user_service_idx
  on public.favorites (user_id, service_id) where service_id is not null;

create table public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users (id) on delete cascade,
  type        public.notification_type not null,
  channel     public.notification_channel not null default 'in_app',
  title_en    text not null,
  title_ar    text not null,
  body_en     text,
  body_ar     text,
  data        jsonb not null default '{}'::jsonb,
  is_read     boolean not null default false,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);
create index notifications_user_id_idx on public.notifications (user_id, created_at desc);
create index notifications_unread_idx on public.notifications (user_id) where is_read = false;

create trigger set_reviews_updated_at before update on public.reviews
  for each row execute function public.set_updated_at();

-- --------------------------------------------------------------------------
-- Maintain denormalized rating / reviews_count on providers and services
-- whenever a published review changes.
-- --------------------------------------------------------------------------
create or replace function public.recalc_provider_rating(p_provider_id uuid)
returns void
language sql
as $$
  update public.providers p
  set rating = coalesce(agg.avg_rating, 0),
      reviews_count = coalesce(agg.cnt, 0)
  from (
    select avg(rating)::numeric(3, 2) as avg_rating, count(*) as cnt
    from public.reviews
    where provider_id = p_provider_id
      and status = 'published'
      and deleted_at is null
  ) agg
  where p.id = p_provider_id;
$$;

create or replace function public.recalc_service_rating(p_service_id uuid)
returns void
language sql
as $$
  update public.services s
  set rating = coalesce(agg.avg_rating, 0),
      reviews_count = coalesce(agg.cnt, 0)
  from (
    select avg(rating)::numeric(3, 2) as avg_rating, count(*) as cnt
    from public.reviews
    where service_id = p_service_id
      and status = 'published'
      and deleted_at is null
  ) agg
  where s.id = p_service_id;
$$;

create or replace function public.on_review_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.recalc_provider_rating(old.provider_id);
    if old.service_id is not null then
      perform public.recalc_service_rating(old.service_id);
    end if;
    return old;
  end if;

  perform public.recalc_provider_rating(new.provider_id);
  if new.service_id is not null then
    perform public.recalc_service_rating(new.service_id);
  end if;
  -- If the review moved between providers/services, recalc the old ones too.
  if tg_op = 'UPDATE' then
    if old.provider_id is distinct from new.provider_id then
      perform public.recalc_provider_rating(old.provider_id);
    end if;
    if old.service_id is distinct from new.service_id and old.service_id is not null then
      perform public.recalc_service_rating(old.service_id);
    end if;
  end if;
  return new;
end;
$$;

create trigger on_review_change_aggregate
  after insert or update or delete on public.reviews
  for each row execute function public.on_review_change();
