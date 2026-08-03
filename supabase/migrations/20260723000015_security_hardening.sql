-- ============================================================================
-- Security hardening — resolves Supabase database-linter advisories.
--
--   1. Pin `search_path` on the three functions that were still mutable
--      (set_updated_at, recalc_provider_rating, recalc_service_rating). A
--      fixed search_path prevents resolution hijacking, which matters most
--      for functions invoked by triggers on privileged paths.
--   2. Revoke EXECUTE from `anon`/`authenticated` on every trigger and
--      event-trigger function, plus the internal rating helpers. These are
--      only ever invoked by the trigger system (as the table owner), never
--      legitimately over the REST RPC surface, so revoking removes a
--      needless `/rest/v1/rpc/*` endpoint without affecting behaviour.
--
-- The identity helpers (is_admin, current_user_role, current_provider_id,
-- is_provider_owner) are intentionally left executable: they are referenced
-- inside RLS policies (so the querying role must be able to run them) and
-- only ever reflect the caller's own identity, so their RPC exposure is
-- benign.
-- ============================================================================

-- 1. Pin search_path on the remaining mutable functions. -------------------
alter function public.set_updated_at() set search_path = public, pg_temp;
alter function public.recalc_provider_rating(uuid) set search_path = public, pg_temp;
alter function public.recalc_service_rating(uuid) set search_path = public, pg_temp;

-- 2. Take trigger / internal functions off the public RPC surface. ---------
-- Postgres grants EXECUTE to PUBLIC by default, so we must revoke from PUBLIC
-- (not just anon/authenticated, which would otherwise inherit it) to actually
-- remove the /rest/v1/rpc/* endpoint.
revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.audit_trigger() from public, anon, authenticated;
revoke execute on function public.bump_conversation_last_message() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.log_order_status_change() from public, anon, authenticated;
revoke execute on function public.on_review_change() from public, anon, authenticated;
revoke execute on function public.recalc_provider_rating(uuid) from public, anon, authenticated;
revoke execute on function public.recalc_service_rating(uuid) from public, anon, authenticated;
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
