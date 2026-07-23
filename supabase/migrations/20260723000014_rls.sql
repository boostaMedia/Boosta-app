-- ============================================================================
-- Migration: Row Level Security
-- Enable RLS and define access policies for every public table.
--
-- Model: broad table-level GRANTs to anon/authenticated, with RLS enforcing
-- row visibility. `service_role` bypasses RLS for trusted server-side work.
-- ============================================================================

grant usage on schema public to anon, authenticated, service_role;
grant select on all tables in schema public to anon, authenticated;
grant insert, update, delete on all tables in schema public to authenticated;
grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to authenticated, service_role;
grant execute on all functions in schema public to anon, authenticated, service_role;

-- Enable RLS everywhere.
alter table public.cities                 enable row level security;
alter table public.areas                  enable row level security;
alter table public.categories             enable row level security;
alter table public.sub_categories         enable row level security;
alter table public.settings               enable row level security;
alter table public.users                  enable row level security;
alter table public.profiles               enable row level security;
alter table public.providers              enable row level security;
alter table public.provider_documents     enable row level security;
alter table public.provider_packages      enable row level security;
alter table public.provider_subscriptions enable row level security;
alter table public.services               enable row level security;
alter table public.service_images         enable row level security;
alter table public.offers                 enable row level security;
alter table public.quote_requests         enable row level security;
alter table public.quote_items            enable row level security;
alter table public.provider_quotes        enable row level security;
alter table public.orders                 enable row level security;
alter table public.order_status_history   enable row level security;
alter table public.conversations          enable row level security;
alter table public.messages               enable row level security;
alter table public.reviews                enable row level security;
alter table public.favorites              enable row level security;
alter table public.notifications          enable row level security;
alter table public.payments               enable row level security;
alter table public.transactions           enable row level security;
alter table public.coupons                enable row level security;
alter table public.audit_logs             enable row level security;

-- ---------------------------------------------------------------------------
-- Reference / lookup tables: public read of active rows, admin-managed writes.
-- ---------------------------------------------------------------------------
create policy "cities public read" on public.cities
  for select to anon, authenticated using (is_active or public.is_admin());
create policy "cities admin write" on public.cities
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "areas public read" on public.areas
  for select to anon, authenticated using (is_active or public.is_admin());
create policy "areas admin write" on public.areas
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "categories public read" on public.categories
  for select to anon, authenticated
  using ((is_active and deleted_at is null) or public.is_admin());
create policy "categories admin write" on public.categories
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "sub_categories public read" on public.sub_categories
  for select to anon, authenticated
  using ((is_active and deleted_at is null) or public.is_admin());
create policy "sub_categories admin write" on public.sub_categories
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "settings public read" on public.settings
  for select to anon, authenticated using (is_public or public.is_admin());
create policy "settings admin write" on public.settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Users & profiles.
-- ---------------------------------------------------------------------------
create policy "users read own" on public.users
  for select to authenticated using (id = auth.uid() or public.is_admin());
create policy "users update own" on public.users
  for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

create policy "profiles read own" on public.profiles
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "profiles insert own" on public.profiles
  for insert to authenticated with check (user_id = auth.uid());
create policy "profiles update own" on public.profiles
  for update to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- Providers & related.
-- ---------------------------------------------------------------------------
create policy "providers public read" on public.providers
  for select to anon, authenticated
  using (
    (status = 'verified' and deleted_at is null)
    or user_id = auth.uid()
    or public.is_admin()
  );
create policy "providers insert own" on public.providers
  for insert to authenticated with check (user_id = auth.uid());
create policy "providers update own" on public.providers
  for update to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());
create policy "providers admin delete" on public.providers
  for delete to authenticated using (public.is_admin());

create policy "provider_documents owner read" on public.provider_documents
  for select to authenticated
  using (public.is_provider_owner(provider_id) or public.is_admin());
create policy "provider_documents owner write" on public.provider_documents
  for all to authenticated
  using (public.is_provider_owner(provider_id) or public.is_admin())
  with check (public.is_provider_owner(provider_id) or public.is_admin());

create policy "provider_packages public read" on public.provider_packages
  for select to anon, authenticated using (is_active or public.is_admin());
create policy "provider_packages admin write" on public.provider_packages
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "provider_subscriptions owner read" on public.provider_subscriptions
  for select to authenticated
  using (public.is_provider_owner(provider_id) or public.is_admin());
create policy "provider_subscriptions owner write" on public.provider_subscriptions
  for all to authenticated
  using (public.is_provider_owner(provider_id) or public.is_admin())
  with check (public.is_provider_owner(provider_id) or public.is_admin());

-- ---------------------------------------------------------------------------
-- Catalog: services, images, offers.
-- ---------------------------------------------------------------------------
create policy "services public read" on public.services
  for select to anon, authenticated
  using (
    (status = 'active' and deleted_at is null)
    or public.is_provider_owner(provider_id)
    or public.is_admin()
  );
create policy "services owner write" on public.services
  for all to authenticated
  using (public.is_provider_owner(provider_id) or public.is_admin())
  with check (public.is_provider_owner(provider_id) or public.is_admin());

create policy "service_images read" on public.service_images
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.services s
      where s.id = service_id
        and ((s.status = 'active' and s.deleted_at is null)
             or public.is_provider_owner(s.provider_id)
             or public.is_admin())
    )
  );
create policy "service_images owner write" on public.service_images
  for all to authenticated
  using (
    exists (
      select 1 from public.services s
      where s.id = service_id
        and (public.is_provider_owner(s.provider_id) or public.is_admin())
    )
  )
  with check (
    exists (
      select 1 from public.services s
      where s.id = service_id
        and (public.is_provider_owner(s.provider_id) or public.is_admin())
    )
  );

create policy "offers public read" on public.offers
  for select to anon, authenticated
  using (
    (status = 'active' and deleted_at is null)
    or public.is_provider_owner(provider_id)
    or public.is_admin()
  );
create policy "offers owner write" on public.offers
  for all to authenticated
  using (public.is_provider_owner(provider_id) or public.is_admin())
  with check (public.is_provider_owner(provider_id) or public.is_admin());

-- ---------------------------------------------------------------------------
-- Quotes.
-- ---------------------------------------------------------------------------
create policy "quote_requests read" on public.quote_requests
  for select to authenticated
  using (
    customer_id = auth.uid()
    or (public.current_user_role() = 'provider' and status = 'open')
    or public.is_admin()
  );
create policy "quote_requests insert own" on public.quote_requests
  for insert to authenticated with check (customer_id = auth.uid());
create policy "quote_requests owner write" on public.quote_requests
  for update to authenticated
  using (customer_id = auth.uid() or public.is_admin())
  with check (customer_id = auth.uid() or public.is_admin());
create policy "quote_requests owner delete" on public.quote_requests
  for delete to authenticated using (customer_id = auth.uid() or public.is_admin());

create policy "quote_items read" on public.quote_items
  for select to authenticated
  using (
    exists (
      select 1 from public.quote_requests q
      where q.id = quote_request_id
        and (q.customer_id = auth.uid()
             or (public.current_user_role() = 'provider' and q.status = 'open')
             or public.is_admin())
    )
  );
create policy "quote_items owner write" on public.quote_items
  for all to authenticated
  using (
    exists (
      select 1 from public.quote_requests q
      where q.id = quote_request_id
        and (q.customer_id = auth.uid() or public.is_admin())
    )
  )
  with check (
    exists (
      select 1 from public.quote_requests q
      where q.id = quote_request_id
        and (q.customer_id = auth.uid() or public.is_admin())
    )
  );

create policy "provider_quotes read" on public.provider_quotes
  for select to authenticated
  using (
    public.is_provider_owner(provider_id)
    or exists (
      select 1 from public.quote_requests q
      where q.id = quote_request_id and q.customer_id = auth.uid()
    )
    or public.is_admin()
  );
create policy "provider_quotes owner insert" on public.provider_quotes
  for insert to authenticated with check (public.is_provider_owner(provider_id));
create policy "provider_quotes owner write" on public.provider_quotes
  for update to authenticated
  using (public.is_provider_owner(provider_id) or public.is_admin())
  with check (public.is_provider_owner(provider_id) or public.is_admin());
create policy "provider_quotes owner delete" on public.provider_quotes
  for delete to authenticated
  using (public.is_provider_owner(provider_id) or public.is_admin());

-- ---------------------------------------------------------------------------
-- Orders.
-- ---------------------------------------------------------------------------
create policy "orders read participants" on public.orders
  for select to authenticated
  using (
    customer_id = auth.uid()
    or public.is_provider_owner(provider_id)
    or public.is_admin()
  );
create policy "orders insert own" on public.orders
  for insert to authenticated with check (customer_id = auth.uid());
create policy "orders update participants" on public.orders
  for update to authenticated
  using (
    customer_id = auth.uid()
    or public.is_provider_owner(provider_id)
    or public.is_admin()
  )
  with check (
    customer_id = auth.uid()
    or public.is_provider_owner(provider_id)
    or public.is_admin()
  );

create policy "order_status_history read" on public.order_status_history
  for select to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and (o.customer_id = auth.uid()
             or public.is_provider_owner(o.provider_id)
             or public.is_admin())
    )
  );

-- ---------------------------------------------------------------------------
-- Messaging.
-- ---------------------------------------------------------------------------
create policy "conversations read participants" on public.conversations
  for select to authenticated
  using (
    customer_id = auth.uid()
    or public.is_provider_owner(provider_id)
    or public.is_admin()
  );
create policy "conversations insert participant" on public.conversations
  for insert to authenticated
  with check (customer_id = auth.uid() or public.is_provider_owner(provider_id));
create policy "conversations update participants" on public.conversations
  for update to authenticated
  using (
    customer_id = auth.uid()
    or public.is_provider_owner(provider_id)
    or public.is_admin()
  )
  with check (
    customer_id = auth.uid()
    or public.is_provider_owner(provider_id)
    or public.is_admin()
  );

create policy "messages read participants" on public.messages
  for select to authenticated
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.customer_id = auth.uid()
             or public.is_provider_owner(c.provider_id)
             or public.is_admin())
    )
  );
create policy "messages insert own" on public.messages
  for insert to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.customer_id = auth.uid() or public.is_provider_owner(c.provider_id))
    )
  );
create policy "messages update participants" on public.messages
  for update to authenticated
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.customer_id = auth.uid()
             or public.is_provider_owner(c.provider_id)
             or public.is_admin())
    )
  )
  with check (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.customer_id = auth.uid()
             or public.is_provider_owner(c.provider_id)
             or public.is_admin())
    )
  );

-- ---------------------------------------------------------------------------
-- Engagement: reviews, favorites, notifications.
-- ---------------------------------------------------------------------------
create policy "reviews public read" on public.reviews
  for select to anon, authenticated
  using (
    (status = 'published' and deleted_at is null)
    or customer_id = auth.uid()
    or public.is_provider_owner(provider_id)
    or public.is_admin()
  );
create policy "reviews insert own" on public.reviews
  for insert to authenticated with check (customer_id = auth.uid());
create policy "reviews update" on public.reviews
  for update to authenticated
  using (
    customer_id = auth.uid()
    or public.is_provider_owner(provider_id)
    or public.is_admin()
  )
  with check (
    customer_id = auth.uid()
    or public.is_provider_owner(provider_id)
    or public.is_admin()
  );
create policy "reviews delete own" on public.reviews
  for delete to authenticated
  using (customer_id = auth.uid() or public.is_admin());

create policy "favorites owner all" on public.favorites
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "notifications owner read" on public.notifications
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "notifications owner update" on public.notifications
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
create policy "notifications admin insert" on public.notifications
  for insert to authenticated with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Billing: payments, transactions, coupons.
-- ---------------------------------------------------------------------------
create policy "payments read participants" on public.payments
  for select to authenticated
  using (
    user_id = auth.uid()
    or (provider_id is not null and public.is_provider_owner(provider_id))
    or public.is_admin()
  );
create policy "payments admin write" on public.payments
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "transactions read own" on public.transactions
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "transactions admin write" on public.transactions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "coupons read" on public.coupons
  for select to anon, authenticated
  using (
    (status = 'active' and deleted_at is null)
    or (provider_id is not null and public.is_provider_owner(provider_id))
    or public.is_admin()
  );
create policy "coupons owner write" on public.coupons
  for all to authenticated
  using (
    (provider_id is not null and public.is_provider_owner(provider_id))
    or public.is_admin()
  )
  with check (
    (provider_id is not null and public.is_provider_owner(provider_id))
    or public.is_admin()
  );

-- ---------------------------------------------------------------------------
-- Audit logs: admin read only (writes come from SECURITY DEFINER triggers).
-- ---------------------------------------------------------------------------
create policy "audit_logs admin read" on public.audit_logs
  for select to authenticated using (public.is_admin());
