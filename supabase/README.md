# Boosta Database

PostgreSQL schema for the Boosta marketplace, managed as version-controlled
Supabase migrations. **28 tables**, full **Row Level Security** (66 policies),
triggers, a generic audit trail, storage buckets, and seed data.

## Layout

```
supabase/
├── config.toml            # Supabase project config
├── seed.sql               # Idempotent reference/seed data (no auth-dependent rows)
└── migrations/            # Ordered, immutable SQL migrations
    ├── ..._helpers.sql        # set_updated_at()
    ├── ..._enums.sql          # domain enum types
    ├── ..._reference.sql      # cities, areas, categories, sub_categories, settings
    ├── ..._users.sql          # users, profiles, auth trigger, RBAC helpers
    ├── ..._providers.sql      # providers, documents, packages, subscriptions
    ├── ..._catalog.sql        # services, service_images, offers
    ├── ..._quotes.sql         # quote_requests, quote_items, provider_quotes
    ├── ..._orders.sql         # orders (+ status history trigger)
    ├── ..._messaging.sql      # conversations, messages
    ├── ..._engagement.sql     # reviews (+ rating aggregation), favorites, notifications
    ├── ..._billing.sql        # payments, transactions, coupons
    ├── ..._audit.sql          # audit_logs + generic audit trigger
    ├── ..._storage.sql        # storage buckets + object policies
    └── ..._rls.sql            # grants + RLS enable + all policies
```

## Conventions

- **UUID primary keys** (`gen_random_uuid()`), `timestamptz` everywhere.
- `created_at` / `updated_at` on mutable tables; `updated_at` maintained by the
  `set_updated_at()` trigger.
- **Soft deletes** via a nullable `deleted_at` on business tables; partial
  indexes and RLS predicates exclude deleted rows.
- Foreign keys use deliberate `on delete` actions (`cascade` for owned children,
  `restrict` for financially significant links, `set null` for optional refs).
- Bilingual content columns are suffixed `_en` / `_ar`.

## Applying the migrations

These are authored locally and verified against Postgres 17 (via PGlite). To
apply them to a real database:

### Option A — Link an existing/new Supabase project

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npm run db:push          # applies migrations
# seed runs automatically on `db:reset`; to seed a linked db, run seed.sql manually
```

### Option B — Local stack (requires Docker)

```bash
npm run db:start         # starts local Supabase (Postgres, Auth, Storage, …)
npm run db:reset         # applies migrations + seed.sql
npm run db:types         # regenerates src/types/database.types.ts
```

## Generating TypeScript types

After the schema is applied to a local or linked project:

```bash
npm run db:types
```

This writes fully-typed row/insert/update types to
`src/types/database.types.ts` for use with the Supabase client in later phases.

## Security model

Table-level `GRANT`s expose tables to the `anon` / `authenticated` roles, and
**RLS enforces row visibility**. `service_role` bypasses RLS for trusted
server-side work. RBAC is centralized in helper functions
(`is_admin()`, `current_user_role()`, `is_provider_owner()`,
`current_provider_id()`) so policies stay readable and consistent.
