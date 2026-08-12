-- ============================================================================
-- Migration: fix_missing_grants
--
-- Root cause: tables created via this session's migration tooling do NOT
-- inherit the project's baseline `ALTER DEFAULT PRIVILEGES` (which is what
-- silently grants SELECT/INSERT/UPDATE/DELETE to anon/authenticated on every
-- table created through the original schema migrations, e.g. `categories`).
-- Confirmed via information_schema.role_table_grants: every table created in
-- this session (commission_rates, payment_requests, payment_events,
-- business_listings, business_listing_images) had only REFERENCES/TRIGGER/
-- TRUNCATE for anon/authenticated — no SELECT, even where RLS policies
-- explicitly granted read access to those roles. RLS is a *second* gate on
-- top of the base GRANT, not a replacement for it — without the GRANT, the
-- request never even reaches RLS evaluation (hence "permission denied for
-- table X", not an empty result set).
--
-- Fix: grant exactly what each table's existing RLS policies already assume,
-- role for role. Any future migration that creates a new table needs the
-- same explicit GRANT statements — don't assume they come for free.
-- ============================================================================

-- commission_rates: admin-only via RLS (using is_admin()), but the grant
-- must exist for authenticated so RLS gets a chance to filter at all.
grant select, insert, update, delete on public.commission_rates to authenticated;

-- payment_requests: participants can SELECT their own rows (RLS-filtered).
-- Writes intentionally stay off the grant list — they only ever happen
-- through the SECURITY DEFINER functions (create_payment_request,
-- cancel_payment_request, ...), which run as the table owner and bypass
-- grants/RLS entirely. Granting INSERT/UPDATE/DELETE here would just be an
-- unused door back to direct writes.
grant select on public.payment_requests to authenticated;

-- payment_events: admin-only read (RLS), no client writes at all — same
-- SECURITY DEFINER-only write path as payment_requests.
grant select on public.payment_events to authenticated;

-- business_listings / business_listing_images: public read of active rows
-- (anon + authenticated), provider manages their own (authenticated only).
grant select on public.business_listings to anon, authenticated;
grant insert, update, delete on public.business_listings to authenticated;

grant select on public.business_listing_images to anon, authenticated;
grant insert, update, delete on public.business_listing_images to authenticated;
