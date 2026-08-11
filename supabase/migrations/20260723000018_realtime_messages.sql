-- ============================================================================
-- Migration: realtime_messages
-- Enables Postgres Changes broadcasts for the messages table (chat core).
-- The `supabase_realtime` publication starts empty on a new project — tables
-- must be added explicitly for postgres_changes subscriptions to fire.
--
-- Scoped to `messages` only for now. `payment_requests` is intentionally NOT
-- added here: its RLS policy exposes fee_fils/net_fils at the row level (the
-- role-based serializer, not RLS, is what hides those from the customer in
-- the normal app path — see the deal_room migration). Subscribing it to
-- Realtime would let a technically savvy client read those fields directly
-- off the websocket for their own rows. That's a decision to make
-- deliberately when the payment-card UI is actually built, not a side effect
-- of this migration.
-- ============================================================================

alter publication supabase_realtime add table public.messages;
