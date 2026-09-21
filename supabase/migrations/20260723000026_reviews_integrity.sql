-- ============================================================================
-- Migration: reviews_integrity
--
-- The reviews RLS policies only check who may touch a row, not what they
-- write. As they stood, any signed-in user could review a provider they never
-- booked (rating manipulation), a customer could write a "provider reply",
-- and a provider could rewrite a review's stars or publish state. These
-- triggers enforce the rules in the database:
--
--  * INSERT (non-admin): a review must be for the caller's own COMPLETED
--    order; provider and service come from that order and status starts
--    'published'. One review per order is already a unique constraint.
--  * UPDATE (non-admin): the customer may change rating/title/comment (and
--    soft-delete their own review); the provider may only set the reply.
--    Everything else — status, parties, order — is frozen.
--
-- Admins (moderation) and internal callers with no auth.uid() are exempt.
-- The denormalized rating/reviews_count triggers already recompute on every
-- change, so they stay correct.
-- ============================================================================

create or replace function public.enforce_review_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders;
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if new.order_id is null then
    raise exception 'a review must be for a completed booking' using errcode = '23514';
  end if;

  select * into v_order from public.orders
   where id = new.order_id and deleted_at is null;
  if not found or v_order.customer_id <> auth.uid() then
    raise exception 'you can only review your own bookings' using errcode = '42501';
  end if;
  if v_order.status <> 'completed' then
    raise exception 'you can review a booking once it is completed' using errcode = '23514';
  end if;

  new.customer_id         := auth.uid();
  new.provider_id         := v_order.provider_id;
  new.service_id          := v_order.service_id;
  new.status              := 'published';
  new.provider_reply      := null;
  new.provider_replied_at := null;
  return new;
end;
$$;

create or replace function public.enforce_review_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if new.order_id    is distinct from old.order_id
     or new.provider_id is distinct from old.provider_id
     or new.service_id  is distinct from old.service_id
     or new.customer_id is distinct from old.customer_id
     or new.status      is distinct from old.status then
    raise exception 'review parties, order and status cannot be changed' using errcode = '42501';
  end if;

  if old.customer_id = auth.uid() then
    -- The customer owns the words and the stars, never the provider's reply.
    if new.provider_reply is distinct from old.provider_reply
       or new.provider_replied_at is distinct from old.provider_replied_at then
      raise exception 'only the provider can reply to a review' using errcode = '42501';
    end if;
  elsif public.is_provider_owner(old.provider_id) then
    -- The provider may only add or edit their reply.
    if new.rating  is distinct from old.rating
       or new.title   is distinct from old.title
       or new.comment is distinct from old.comment
       or new.deleted_at is distinct from old.deleted_at then
      raise exception 'providers can only reply to a review' using errcode = '42501';
    end if;
  else
    raise exception 'not allowed to change this review' using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_review_insert on public.reviews;
create trigger enforce_review_insert before insert on public.reviews
  for each row execute function public.enforce_review_insert();

drop trigger if exists enforce_review_update on public.reviews;
create trigger enforce_review_update before update on public.reviews
  for each row execute function public.enforce_review_update();
