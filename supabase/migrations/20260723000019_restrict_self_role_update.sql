-- ============================================================================
-- Migration: restrict_self_role_update
-- Closes a privilege-escalation gap: the existing "users update own" policy
-- only checked row ownership (id = auth.uid()), not which `role` value the
-- update writes. A signed-in user could therefore run
-- `update users set role = 'admin' where id = auth.uid()` directly and it
-- would pass RLS. This is surfaced now because the OAuth sign-up flow needs
-- to safely let a user pick "individual" vs "business" (customer vs
-- provider) on first login — that only becomes a safe self-service update
-- once self-updates can never reach 'admin'.
-- ============================================================================

drop policy "users update own" on public.users;

create policy "users update own" on public.users
  for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (
    public.is_admin()
    or (id = auth.uid() and role in ('customer', 'provider'))
  );
