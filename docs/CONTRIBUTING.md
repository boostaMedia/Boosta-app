# Contributing

## Prerequisites

- Node.js — the version pinned in [`.nvmrc`](../.nvmrc) (`nvm use`).
- npm (bundled with Node).

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Branching

`main` is production-ready. Work happens on branches merged into `develop`, then
promoted to `main`. Per the roadmap, phase work uses a dedicated branch:

```
feature/phase-01-foundation
feature/phase-02-database
...
```

## Commits

Commits follow **Conventional Commits**, enforced by commitlint via a Husky
`commit-msg` hook:

```
<type>(<scope>): <subject>

feat(auth): add OTP verification endpoint
fix(i18n): correct Arabic plural rule for offers
chore(deps): bump next to 16.2.11
```

Allowed types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`,
`build`, `ci`, `chore`, `revert`. Keep commits **small and atomic**.

## Quality gates

A Husky `pre-commit` hook runs `lint-staged` (ESLint + Prettier on staged
files). Before opening a PR, ensure the full suite passes locally — this is the
same set CI runs:

```bash
npm run format:check
npm run lint
npm run typecheck
npm run build
```

## Definition of Done

- Code compiles; **zero** TypeScript and ESLint errors.
- Arabic (RTL) and English (LTR) both supported where UI is involved.
- Inputs validated; endpoints authorized (once those layers exist).
- Documentation updated.
- Changes committed in small, descriptive, atomic commits.
