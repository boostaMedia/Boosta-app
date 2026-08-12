-- ============================================================================
-- Migration: provider_contract
-- Tracks the provider agreement a business accepts when requesting to join.
-- Payment collection (the 300 KWD/year fee) is deliberately NOT modeled here
-- yet — it's deferred until a real payment gateway is wired. `providers`
-- already carries the trust gate this needs: `status` stays 'pending' after
-- this request until an admin flips it to 'verified'.
-- ============================================================================

alter table public.providers
  add column contract_accepted_at timestamptz,
  add column contract_version text,
  add column contract_signed_name text;

comment on column public.providers.contract_accepted_at is
  'When the provider accepted the provider agreement, set server-side (never client-supplied) at registration.';
comment on column public.providers.contract_version is
  'Which version of the provider agreement text was accepted — see src/features/providers/contract.ts.';
