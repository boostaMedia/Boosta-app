-- ============================================================================
-- Seed data for Boosta (reference / lookup data only).
--
-- Idempotent: every insert uses ON CONFLICT so re-running is safe. No rows
-- that depend on auth.users are seeded here (users are created via sign-up).
-- ============================================================================

-- --------------------------------------------------------------------------
-- Cities — the six governorates of Kuwait.
-- --------------------------------------------------------------------------
insert into public.cities (code, name_en, name_ar, sort_order) values
  ('KW-CAP', 'Capital', 'العاصمة', 1),
  ('KW-HAW', 'Hawalli', 'حولي', 2),
  ('KW-FAR', 'Farwaniya', 'الفروانية', 3),
  ('KW-AHM', 'Ahmadi', 'الأحمدي', 4),
  ('KW-JAH', 'Jahra', 'الجهراء', 5),
  ('KW-MUB', 'Mubarak Al-Kabeer', 'مبارك الكبير', 6)
on conflict (code) do nothing;

-- --------------------------------------------------------------------------
-- Areas — a representative sample per governorate.
-- --------------------------------------------------------------------------
insert into public.areas (city_id, name_en, name_ar, sort_order)
select c.id, a.name_en, a.name_ar, a.sort_order
from (values
  ('KW-CAP', 'Kuwait City', 'مدينة الكويت', 1),
  ('KW-CAP', 'Sharq', 'شرق', 2),
  ('KW-CAP', 'Dasman', 'دسمان', 3),
  ('KW-HAW', 'Salmiya', 'السالمية', 1),
  ('KW-HAW', 'Jabriya', 'الجابرية', 2),
  ('KW-HAW', 'Hawalli', 'حولي', 3),
  ('KW-FAR', 'Farwaniya', 'الفروانية', 1),
  ('KW-FAR', 'Khaitan', 'خيطان', 2),
  ('KW-AHM', 'Fahaheel', 'الفحيحيل', 1),
  ('KW-AHM', 'Mangaf', 'المنقف', 2),
  ('KW-JAH', 'Jahra', 'الجهراء', 1),
  ('KW-MUB', 'Abu Al Hasaniya', 'أبو الحصانية', 1)
) as a(city_code, name_en, name_ar, sort_order)
join public.cities c on c.code = a.city_code
on conflict (city_id, name_en) do nothing;

-- --------------------------------------------------------------------------
-- Categories.
-- --------------------------------------------------------------------------
insert into public.categories (slug, name_en, name_ar, icon, sort_order) values
  ('home-services', 'Home Services', 'خدمات منزلية', 'home', 1),
  ('cleaning', 'Cleaning', 'تنظيف', 'sparkles', 2),
  ('maintenance', 'Maintenance & Repair', 'صيانة وإصلاح', 'wrench', 3),
  ('beauty-wellness', 'Beauty & Wellness', 'الجمال والعناية', 'heart', 4),
  ('events-catering', 'Events & Catering', 'المناسبات والضيافة', 'party-popper', 5),
  ('automotive', 'Automotive', 'خدمات السيارات', 'car', 6),
  ('education', 'Education & Tutoring', 'التعليم والدروس', 'graduation-cap', 7),
  ('business-services', 'Business Services', 'خدمات الأعمال', 'briefcase', 8),
  ('moving-delivery', 'Moving & Delivery', 'النقل والتوصيل', 'truck', 9)
on conflict (slug) do nothing;

-- --------------------------------------------------------------------------
-- Sub-categories (sample under a few categories).
-- --------------------------------------------------------------------------
insert into public.sub_categories (category_id, slug, name_en, name_ar, sort_order)
select c.id, s.slug, s.name_en, s.name_ar, s.sort_order
from (values
  ('cleaning', 'home-deep-cleaning', 'Home Deep Cleaning', 'تنظيف عميق للمنزل', 1),
  ('cleaning', 'sofa-carpet-cleaning', 'Sofa & Carpet Cleaning', 'تنظيف الكنب والسجاد', 2),
  ('cleaning', 'ac-cleaning', 'AC Cleaning', 'تنظيف المكيفات', 3),
  ('maintenance', 'plumbing', 'Plumbing', 'سباكة', 1),
  ('maintenance', 'electrical', 'Electrical', 'كهرباء', 2),
  ('maintenance', 'ac-repair', 'AC Repair', 'إصلاح المكيفات', 3),
  ('beauty-wellness', 'home-salon', 'Home Salon', 'صالون منزلي', 1),
  ('beauty-wellness', 'spa-massage', 'Spa & Massage', 'سبا ومساج', 2),
  ('events-catering', 'catering', 'Catering', 'ضيافة', 1),
  ('events-catering', 'photography', 'Photography', 'تصوير', 2),
  ('automotive', 'car-wash', 'Car Wash', 'غسيل السيارات', 1),
  ('education', 'private-tutoring', 'Private Tutoring', 'دروس خصوصية', 1)
) as s(category_slug, slug, name_en, name_ar, sort_order)
join public.categories c on c.slug = s.category_slug
on conflict (category_id, slug) do nothing;

-- --------------------------------------------------------------------------
-- Settings.
-- --------------------------------------------------------------------------
insert into public.settings (key, value, description, is_public) values
  ('default_currency', '"KWD"'::jsonb, 'Default platform currency.', true),
  ('default_commission_rate', '10'::jsonb, 'Default provider commission percentage.', false),
  ('support_email', '"support@boosta.app"'::jsonb, 'Customer support email.', true),
  ('support_phone', '"+96500000000"'::jsonb, 'Customer support phone.', true),
  ('min_order_amount', '1'::jsonb, 'Minimum order amount in KWD.', true),
  ('maintenance_mode', 'false'::jsonb, 'When true, the app is in maintenance mode.', true)
on conflict (key) do nothing;

-- --------------------------------------------------------------------------
-- Provider subscription packages.
-- --------------------------------------------------------------------------
insert into public.provider_packages
  (slug, name_en, name_ar, description_en, description_ar, price, billing_interval, features, max_services, max_offers, sort_order)
values
  ('basic', 'Basic', 'أساسي', 'Get started on Boosta.', 'ابدأ على بوستا.',
   0, 'monthly', '["Up to 5 services", "Basic profile"]'::jsonb, 5, 2, 1),
  ('pro', 'Pro', 'احترافي', 'For growing businesses.', 'للأعمال المتنامية.',
   9.900, 'monthly', '["Up to 25 services", "Featured listings", "Priority support"]'::jsonb, 25, 10, 2),
  ('elite', 'Elite', 'النخبة', 'Maximum reach and tools.', 'أقصى انتشار وأدوات.',
   24.900, 'monthly', '["Unlimited services", "Top placement", "Analytics", "Dedicated support"]'::jsonb, null, null, 3)
on conflict (slug) do nothing;

-- --------------------------------------------------------------------------
-- Sample platform coupon.
-- --------------------------------------------------------------------------
insert into public.coupons (code, type, value, min_order_amount, usage_limit, per_user_limit)
values ('WELCOME10', 'percentage', 10, 5, 1000, 1)
on conflict (code) do nothing;
