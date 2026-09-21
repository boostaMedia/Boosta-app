-- ============================================================================
-- Migration: orders_integrity
--
-- The orders RLS policies only check *who* may touch a row, not *what* they
-- write. As they stood, a customer could POST an order with any price or
-- status ('completed', total 0), and either side could rewrite an order's
-- money fields or jump its status directly through the API, bypassing the
-- booking UI's rules. These triggers enforce the rules in the database, so
-- no client can get around them:
--
--  * INSERT (customers): must reference an active service of a verified
--    provider; provider, price, currency and status are taken from the
--    service, never from the request.
--  * UPDATE (customers / providers): money fields, parties and the order
--    number are frozen; status may only move along the allowed transitions
--    (mirrors src/features/orders/transitions.ts — keep them in sync).
--
-- Admins, and internal callers with no auth.uid() (SQL editor, service
-- role), are not restricted.
-- ============================================================================

create or replace function public.enforce_order_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_service public.services;
  v_provider public.providers;
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if new.service_id is null then
    raise exception 'an order must reference a service' using errcode = '23514';
  end if;

  select * into v_service from public.services
   where id = new.service_id and deleted_at is null;
  if not found or v_service.status <> 'active' then
    raise exception 'this service is not available for booking' using errcode = '23514';
  end if;

  select * into v_provider from public.providers
   where id = v_service.provider_id and deleted_at is null;
  if not found or v_provider.status <> 'verified' then
    raise exception 'this provider is not available for booking' using errcode = '23514';
  end if;

  new.customer_id       := auth.uid();
  new.provider_id       := v_service.provider_id;
  new.subtotal          := v_service.base_price;
  new.currency          := v_service.currency;
  new.discount_amount   := 0;
  new.tax_amount        := 0;
  new.commission_amount := 0;
  new.total_amount      := v_service.base_price;
  new.status            := 'pending';
  new.completed_at      := null;
  new.cancelled_at      := null;
  new.cancelled_reason  := null;
  return new;
end;
$$;

create or replace function public.enforce_order_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer boolean;
  v_allowed boolean;
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if new.customer_id       is distinct from old.customer_id
     or new.provider_id    is distinct from old.provider_id
     or new.service_id     is distinct from old.service_id
     or new.provider_quote_id is distinct from old.provider_quote_id
     or new.offer_id       is distinct from old.offer_id
     or new.order_number   is distinct from old.order_number
     or new.subtotal       is distinct from old.subtotal
     or new.discount_amount is distinct from old.discount_amount
     or new.tax_amount     is distinct from old.tax_amount
     or new.commission_amount is distinct from old.commission_amount
     or new.total_amount   is distinct from old.total_amount
     or new.currency       is distinct from old.currency then
    raise exception 'order parties, number and amounts cannot be changed' using errcode = '42501';
  end if;

  if new.status is not distinct from old.status then
    if new.completed_at is distinct from old.completed_at
       or new.cancelled_at is distinct from old.cancelled_at then
      raise exception 'completion and cancellation times follow the status' using errcode = '42501';
    end if;
    return new;
  end if;

  if old.customer_id = auth.uid() then
    v_customer := true;
  elsif public.is_provider_owner(old.provider_id) then
    v_customer := false;
  else
    raise exception 'not a party to this order' using errcode = '42501';
  end if;

  if v_customer then
    v_allowed := old.status in ('pending', 'confirmed') and new.status = 'cancelled';
  else
    v_allowed := (old.status = 'pending'     and new.status in ('confirmed', 'cancelled'))
              or (old.status = 'confirmed'   and new.status in ('in_progress', 'cancelled'))
              or (old.status = 'in_progress' and new.status = 'completed');
  end if;

  if not v_allowed then
    raise exception 'status change % -> % is not allowed', old.status, new.status
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_order_insert on public.orders;
create trigger enforce_order_insert before insert on public.orders
  for each row execute function public.enforce_order_insert();

drop trigger if exists enforce_order_update on public.orders;
create trigger enforce_order_update before update on public.orders
  for each row execute function public.enforce_order_update();
