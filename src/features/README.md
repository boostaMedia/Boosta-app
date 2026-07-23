# Feature Modules

Boosta uses a **feature-based architecture**. Each business capability lives in
its own self-contained module under `src/features/<feature>` and exposes a
narrow public API through its `index.ts` barrel. Cross-feature imports should go
through that barrel, never deep into another feature's internals.

## Standard structure

```
src/features/<feature>/
├── components/     # Feature-specific React components (UI)
├── server/         # Server-only code: repositories, services, data access
├── schemas/        # Zod validation schemas (input/output contracts)
├── hooks/          # Client hooks
├── types.ts        # Feature-local domain types
├── constants.ts    # Feature-local constants
└── index.ts        # Public API barrel (the only entry point other code uses)
```

Not every feature needs every folder — add them as the feature grows.

## Layering rules (Clean Architecture)

- `components` may depend on `hooks`, `schemas`, and `types`.
- `server` may depend on `schemas` and `types`, never on `components`.
- Nothing outside a feature imports from its `server/` directly; go through a
  server action or route handler that the feature exposes.
- Shared, cross-cutting code lives in `src/lib`, `src/components/ui`, and
  `src/config` — not in a feature.

## Planned features

Aligned with the product roadmap: `auth`, `users`, `providers`, `categories`,
`services`, `offers`, `quotes`, `orders`, `reviews`, `messages`,
`notifications`, `payments`, `subscriptions`, `search`, `analytics`.

These are introduced in later phases; this directory is intentionally empty in
Phase 1 apart from this document.
