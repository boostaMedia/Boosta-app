# Architecture

Boosta is built for scale, security, and long-term maintainability. This
document describes the principles and structure that every contribution must
follow.

## Guiding principles

- **Feature-based architecture** — code is organized by business capability
  (`src/features/*`), not by technical type.
- **Clean Architecture / SOLID** — dependencies point inward: UI → application
  → domain. Server-only code never imports UI.
- **Domain-Driven Design (where practical)** — features model real domain
  concepts (providers, quotes, orders, …).
- **Server-first** — prefer React Server Components; add `"use client"` only
  when interactivity requires it.
- **Secure & type-safe by default** — every input is validated (Zod), every
  environment variable is validated (`src/lib/env.ts`), and every data access
  is type-safe.
- **Arabic-first, RTL-first** — the primary market is Kuwait/GCC; English is a
  first-class secondary locale.

## Layers

| Layer                | Location                             | Responsibility                         |
| -------------------- | ------------------------------------ | -------------------------------------- |
| Presentation         | `src/app`, `src/components`          | Routing, rendering, UI composition     |
| Feature modules      | `src/features/<feature>`             | Business capabilities (self-contained) |
| Cross-cutting        | `src/lib`, `src/config`, `src/types` | Shared infrastructure & contracts      |
| Internationalization | `src/i18n`, `src/proxy.ts`           | Locale routing, messages, direction    |

## Shared infrastructure (`src/lib`)

- **`env.ts`** — validated, type-safe environment access. Never read
  `process.env` directly in feature code.
- **`logger.ts`** — dependency-free structured logger (Node/Edge/browser safe).
  JSON output in production, pretty in development, silent in tests.
- **`errors.ts`** — the `AppError` hierarchy. Operational errors carry a stable
  `code` + HTTP `status`; anything else is a bug and surfaces as a 500.
- **`constants.ts`** — application-wide constants (market defaults, roles,
  pagination).
- **`utils.ts`** — the `cn()` class-name helper (clsx + tailwind-merge).

## Feature module contract

See [`src/features/README.md`](../src/features/README.md). In short: each
feature exposes a single public barrel (`index.ts`); other code never reaches
into another feature's internals.

## Internationalization

- `src/i18n/routing.ts` — supported locales, default, direction, labels.
- `src/i18n/request.ts` — per-request locale resolution and message loading.
- `src/i18n/navigation.ts` — locale-aware `Link`/`router` helpers.
- `src/proxy.ts` — negotiates locale and redirects (Next.js proxy convention).

Locale is a route segment (`/[locale]/…`), enabling static rendering per
locale via `generateStaticParams` + `setRequestLocale`.

## Roadmap (phased delivery)

1. **Foundation** (this phase) — architecture & tooling.
2. Database (PostgreSQL / Supabase, RLS).
3. Authentication (email/phone/OTP, RBAC).
4. Backend API modules.
5. Admin portal.
6. Customer app.
7. Provider dashboard.
8. Marketplace engine.
9. Payments.
10. Notifications.
11. AI features.
12. Production hardening.

Each phase must build cleanly with zero TypeScript and ESLint errors before the
next begins.
