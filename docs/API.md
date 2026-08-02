# Backend API

Boosta's backend is built as **layered, feature-based modules** exposed through
Next.js Route Handlers under `src/app/api`. Every module follows the same shape,
so adding a new one is mechanical.

## Layers

```
Route handler (src/app/api/<module>/route.ts)
  → authorization (requireApiRole)          ← who can call this
  → validation (parseBody / parseQuery)      ← is the input well-formed
  → service (src/features/<module>/service)  ← business rules, not-found
  → repository (…/repository)                ← data access (Supabase + RLS)
  → database (RLS enforces row access)       ← defense in depth
```

- **Route handlers** are thin: authorize → validate → call the service →
  format the response. They are wrapped by `route()` for centralized error
  handling.
- **Services** own business rules and not-found semantics and depend only on a
  **repository interface** — so they are unit-tested with a fake repository.
- **Repositories** are the only place that talks to Supabase. They map
  snake_case rows ↔ camelCase domain entities and translate Postgres errors
  (e.g. unique-violation → `ConflictError`).
- **Authorization is enforced twice**: at the route (`requireApiRole`) and by
  Postgres **RLS** for the caller's identity.

## Shared foundation (`src/lib/api`)

| Helper                                                       | Purpose                                                                       |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| `route(handler)`                                             | Wraps a handler; maps thrown `AppError`s → HTTP status + JSON, logs failures. |
| `jsonOk` / `jsonCreated` / `jsonNoContent` / `jsonPaginated` | Standard response envelopes.                                                  |
| `parseBody(req, schema)` / `parseQuery(params, schema)`      | Zod validation → `ValidationError` (422) with issues.                         |
| `paginationQuerySchema` / `rangeFor` / `paginate`            | Coerce/clamp `page`+`pageSize`, build ranges and envelopes.                   |
| `requireApiUser()` / `requireApiRole(...roles)`              | Throw `401` / `403` (from `@/features/auth`).                                 |

### Response shapes

```jsonc
// success
{ "data": { /* entity */ } }
// paginated
{ "data": [ /* … */ ], "meta": { "page": 1, "pageSize": 20, "total": 42, "totalPages": 3 } }
// error
{ "error": { "code": "NOT_FOUND", "message": "Category not found." } }
```

## Reference module: Categories

| Method & path                | Auth   | Description                                         |
| ---------------------------- | ------ | --------------------------------------------------- |
| `GET /api/categories`        | public | Paginated list; `?page&pageSize&activeOnly&search`. |
| `POST /api/categories`       | admin  | Create a category.                                  |
| `GET /api/categories/:id`    | public | Fetch one category.                                 |
| `PATCH /api/categories/:id`  | admin  | Update a category.                                  |
| `DELETE /api/categories/:id` | admin  | Soft-delete a category.                             |

Files: `src/features/categories/{schemas,types,repository,service,index}.ts`
with `service.test.ts`, and routes under `src/app/api/categories`.

## Provider-owned modules: Providers & Services

These demonstrate **owner-based** authorization (vs. Categories' admin-only).
Ownership is enforced by RLS — a write to a row the caller does not own resolves
to a 404 — plus resolving the caller's provider id before create.

| Method & path                     | Auth     | Description                                             |
| --------------------------------- | -------- | ------------------------------------------------------- |
| `GET /api/providers`              | public   | List providers (`?search&cityId&featured&status`).      |
| `POST /api/providers`             | user     | Create the caller's own provider profile.               |
| `GET /api/providers/:id`          | public   | Fetch a provider.                                       |
| `PATCH /api/providers/:id`        | owner    | Edit own profile (never status/featured/commission).    |
| `DELETE /api/providers/:id`       | owner    | Soft-delete.                                            |
| `PATCH /api/providers/:id/status` | admin    | Moderate status / featured / commission.                |
| `GET /api/services`               | public   | List services (`?categoryId&providerId&status&search`). |
| `POST /api/services`              | provider | Create a service owned by the caller's provider.        |
| `GET /api/services/:id`           | public   | Fetch a service.                                        |
| `PATCH /api/services/:id`         | owner    | Edit own service.                                       |
| `DELETE /api/services/:id`        | owner    | Soft-delete.                                            |

Owner vs. admin field separation is enforced in the providers service by
distinct `updateOwner` / `updateAdmin` methods.

## Adding a module

1. `schemas.ts` — row schema + create/update/list Zod schemas.
2. `types.ts` — domain entity + inferred input types.
3. `repository.ts` — `create<Module>Repository(supabase)` returning an interface.
4. `service.ts` — `create<Module>Service(repo)` with business rules.
5. `index.ts` — `get<Module>Service()` bound to the request's Supabase client.
6. `src/app/api/<module>/route.ts` (+ `[id]/route.ts`) — thin handlers.
7. `service.test.ts` — unit tests against a fake repository.

## Roadmap

Modules follow the roadmap: users, **providers** ✅, **categories** ✅,
**services** ✅, **offers** ✅, quotes, provider-quotes, orders,
**reviews** ✅, messages, **notifications** ✅, payments, subscriptions,
analytics, settings. Each reuses the pattern above.

Reviews additionally demonstrate a **two-actor** pattern: the customer owns the
review body (`PATCH /api/reviews/:id`) while the reviewed provider may only
append a reply (`POST /api/reviews/:id/reply`).
