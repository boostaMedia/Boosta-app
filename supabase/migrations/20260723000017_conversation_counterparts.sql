-- ============================================================================
-- Migration: conversation_counterparts
-- Resolves the "other side" of a conversation for chat UI display.
--
-- `profiles` is RLS-locked to "own profile only" (see rls.sql), so a
-- provider cannot directly SELECT a customer's profile to show their name in
-- the chat header/list. Rather than loosening that RLS policy platform-wide,
-- this narrowly-scoped SECURITY DEFINER function resolves just the
-- counterparty's display fields, and only for conversations the caller is
-- already a participant of (same participant check as the conversations RLS
-- policy, enforced again here in the WHERE clause as defense in depth).
-- ============================================================================

create or replace function public.get_conversation_counterparts(p_conversation_ids uuid[] default null)
returns table (
  conversation_id    uuid,
  counterparty_kind  text, -- 'provider' | 'customer'
  display_name_en    text,
  display_name_ar    text,
  avatar_url         text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.id,
    case when c.customer_id = auth.uid() then 'provider' else 'customer' end,
    case when c.customer_id = auth.uid() then p.business_name_en else pr.full_name end,
    case when c.customer_id = auth.uid() then p.business_name_ar else pr.full_name end,
    case when c.customer_id = auth.uid() then p.logo_url else pr.avatar_url end
  from public.conversations c
  left join public.providers p on p.id = c.provider_id
  left join public.profiles pr on pr.user_id = c.customer_id
  where (c.customer_id = auth.uid() or public.is_provider_owner(c.provider_id) or public.is_admin())
    and (p_conversation_ids is null or c.id = any (p_conversation_ids));
$$;

revoke all on function public.get_conversation_counterparts(uuid[]) from public;
grant execute on function public.get_conversation_counterparts(uuid[]) to authenticated;
