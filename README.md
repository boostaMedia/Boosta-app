# Boosta

Boosta is a production-grade, multi-vendor **service marketplace** for Kuwait
and the GCC. Mobile-first, **Arabic (RTL) first** with full English support,
secure by default, and built on an enterprise, feature-based architecture.

> **Status:** Phase 1 — Foundation. This repository currently contains the
> production architecture and developer tooling. Business features land in
> later phases (see the roadmap).

## Tech stack

| Concern        | Choice                                               |
| -------------- | ---------------------------------------------------- |
| Framework      | Next.js 16 (App Router, React 19, Server Components) |
| Language       | TypeScript (strict)                                  |
| Styling        | Tailwind CSS v4                                      |
| UI components  | shadcn/ui (Base UI primitives)                       |
| i18n           | next-intl (Arabic + English, RTL/LTR)                |
| Theming        | next-themes (light / dark / system)                  |
| Env validation | @t3-oss/env-nextjs + Zod                             |
| Tooling        | ESLint · Prettier · Husky · commitlint · lint-staged |
| CI             | GitHub Actions                                       |

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Create your local env file
cp .env.example .env.local

# 3. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You will be redirected to
the default locale (`/ar`). English is available at `/en`.

## Scripts

| Script                 | Description                    |
| ---------------------- | ------------------------------ |
| `npm run dev`          | Start the development server   |
| `npm run build`        | Production build               |
| `npm run start`        | Serve the production build     |
| `npm run lint`         | Run ESLint                     |
| `npm run lint:fix`     | Run ESLint with autofix        |
| `npm run typecheck`    | Type-check with `tsc --noEmit` |
| `npm run format`       | Format all files with Prettier |
| `npm run format:check` | Verify formatting (used in CI) |

## Project structure

```
src/
├── app/
│   └── [locale]/        # Locale-scoped routes (App Router)
├── components/
│   ├── ui/              # shadcn/ui primitives
│   ├── providers/       # App-wide context providers (theme, …)
│   ├── theme/           # Theme toggle
│   └── i18n/            # Locale switcher
├── config/              # Static app/site configuration
├── features/            # Feature modules (see features/README.md)
├── i18n/                # next-intl routing, request config, messages
├── lib/                 # Cross-cutting: env, logger, errors, constants, utils
├── types/               # Shared types
└── proxy.ts             # Locale negotiation (Next.js proxy convention)
```

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the architectural
principles and [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md) for the workflow.

## Internationalization & RTL

- Default locale is **Arabic (`ar`)**, rendered right-to-left.
- English (`en`) is fully supported, left-to-right.
- The `<html>` `lang`/`dir` attributes and font stack switch automatically.
- Translations live in `src/i18n/messages/{ar,en}.json`.

## License

Proprietary — © Boosta Media.
