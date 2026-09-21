-- ============================================================================
-- Migration: countries
--
-- Adds Gulf + Egypt country/currency support. Providers and users each get
-- an optional home country; services keep pricing in the provider's local
-- currency (already supported via services.currency, previously always
-- defaulted to KWD). The provider annual membership fee is charged in USD
-- across every country so its real value stays the same regardless of the
-- provider's local currency — replaces the ad-hoc "300 KWD" figure that used
-- to live only in the contract text.
-- ============================================================================

create table if not exists public.countries (
  id                  uuid primary key default gen_random_uuid(),
  code                text not null unique,
  name_en             text not null,
  name_ar             text not null,
  currency_code       text not null,
  currency_symbol_en  text not null,
  currency_symbol_ar  text not null,
  is_active           boolean not null default true,
  sort_order          integer not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

drop trigger if exists set_countries_updated_at on public.countries;
create trigger set_countries_updated_at before update on public.countries
  for each row execute function public.set_updated_at();

insert into public.countries
  (code, name_en, name_ar, currency_code, currency_symbol_en, currency_symbol_ar, sort_order)
values
  ('KW', 'Kuwait',               'الكويت',    'KWD', 'KWD', 'د.ك', 1),
  ('SA', 'Saudi Arabia',         'السعودية',  'SAR', 'SAR', 'ر.س', 2),
  ('AE', 'United Arab Emirates', 'الإمارات',  'AED', 'AED', 'د.إ', 3),
  ('QA', 'Qatar',                'قطر',       'QAR', 'QAR', 'ر.ق', 4),
  ('BH', 'Bahrain',              'البحرين',   'BHD', 'BHD', 'د.ب', 5),
  ('OM', 'Oman',                 'عُمان',     'OMR', 'OMR', 'ر.ع', 6),
  ('EG', 'Egypt',                'مصر',       'EGP', 'EGP', 'ج.م', 7)
on conflict (code) do nothing;

-- Cities/providers each get an optional country; customers get one via their
-- profile (mirroring how profiles.city_id already models customer location,
-- rather than putting it on the bare users account row). Nullable rather
-- than NOT NULL: existing rows are backfilled to Kuwait below, but the
-- column isn't required at the DB level so app-level validation (not a
-- migration) governs when it must be set (e.g. provider registration).
alter table public.cities    add column if not exists country_id uuid references public.countries(id);
alter table public.providers add column if not exists country_id uuid references public.countries(id);
alter table public.profiles  add column if not exists country_id uuid references public.countries(id);

update public.cities    set country_id = (select id from public.countries where code = 'KW') where country_id is null;
update public.providers set country_id = (select id from public.countries where code = 'KW') where country_id is null;

create index if not exists cities_country_id_idx    on public.cities(country_id);
create index if not exists providers_country_id_idx on public.providers(country_id);
create index if not exists profiles_country_id_idx  on public.profiles(country_id);

alter table public.countries enable row level security;

drop policy if exists "countries public read" on public.countries;
create policy "countries public read" on public.countries
  for select to anon, authenticated using (is_active or public.is_admin());
drop policy if exists "countries admin write" on public.countries;
create policy "countries admin write" on public.countries
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- countries is a brand-new table created via this session's tooling, which
-- (per the fix_missing_grants migration) does NOT inherit baseline default
-- privileges — grant explicitly, matching what the RLS policies above assume.
grant select on public.countries to anon, authenticated;
grant insert, update, delete on public.countries to authenticated;

-- Real annual provider membership plan, USD-denominated so its value is the
-- same for a provider in any of the countries above. Registration/contract
-- flows should read this row instead of hardcoding a price.
insert into public.provider_packages
  (slug, name_en, name_ar, description_en, description_ar, price, currency, billing_interval, is_active, sort_order)
values (
  'annual-membership',
  'Annual Provider Membership',
  'اشتراك المزوّد السنوي',
  'Yearly Boosta provider access, billed once a year in USD regardless of your country.',
  'اشتراك سنوي للانضمام كمزوّد خدمة على Boosta، يُحتسب مرة واحدة بالدولار الأمريكي بغض النظر عن دولتك.',
  975,
  'USD',
  'yearly',
  true,
  1
)
on conflict (slug) do nothing;

-- The catalog already had a 300 KWD 'annual' plan from before the USD
-- decision. Retire it so only the USD plan is offered; the row stays for
-- any subscription that already references it.
update public.provider_packages
   set is_active = false
 where slug = 'annual';
