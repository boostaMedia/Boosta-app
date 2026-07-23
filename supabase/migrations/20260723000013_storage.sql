-- ============================================================================
-- Migration: storage buckets
-- Storage buckets and their access policies.
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 5242880, array['image/png', 'image/jpeg', 'image/webp']),
  ('provider-logos', 'provider-logos', true, 5242880, array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']),
  ('provider-covers', 'provider-covers', true, 10485760, array['image/png', 'image/jpeg', 'image/webp']),
  ('service-images', 'service-images', true, 10485760, array['image/png', 'image/jpeg', 'image/webp']),
  ('provider-documents', 'provider-documents', false, 10485760, array['image/png', 'image/jpeg', 'application/pdf']),
  ('message-attachments', 'message-attachments', false, 10485760, array['image/png', 'image/jpeg', 'image/webp', 'application/pdf']),
  ('quote-attachments', 'quote-attachments', false, 10485760, array['image/png', 'image/jpeg', 'image/webp', 'application/pdf'])
on conflict (id) do nothing;

-- --------------------------------------------------------------------------
-- Storage object policies. Public buckets are world-readable; writes are
-- limited to authenticated users writing into their own `<uid>/…` folder.
-- --------------------------------------------------------------------------

-- Public read for public buckets.
create policy "Public read for public buckets"
  on storage.objects for select
  to public
  using (
    bucket_id in ('avatars', 'provider-logos', 'provider-covers', 'service-images')
  );

-- Authenticated users manage files under their own top-level folder.
create policy "Users manage own folder"
  on storage.objects for all
  to authenticated
  using (auth.uid()::text = (storage.foldername(name))[1])
  with check (auth.uid()::text = (storage.foldername(name))[1]);

-- Owners can read their own private files; admins can read everything.
create policy "Read own private files"
  on storage.objects for select
  to authenticated
  using (
    auth.uid()::text = (storage.foldername(name))[1]
    or public.is_admin()
  );
