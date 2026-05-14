# QA Daily

## Local Setup

1. Copy `.env.example` to `.env`.
2. Set `AUTH_SECRET`.
3. Leave `DATABASE_URL` empty for SQLite local.
4. Seed local data:

```bash
pnpm db:seed:local
```

5. Start dev server:

```bash
pnpm dev
```

## Quality Checks

Run these before opening a PR or preparing a release build:

```bash
pnpm test
pnpm precheck
```

`pnpm precheck` now runs:

- `pnpm lint`
- `npx tsc --noEmit`
- `next build`

For the same checks used in GitHub Actions:

```bash
pnpm ci:check
```

## Local Login

Use the local seed output for the default admin login.

Login uses `email + password` only.
If `node seed.mjs` errors with `EBUSY`, stop the dev server first because `prisma/dev.db` is locked.

## Notes

- Prod uses Neon/Postgres.
- Local uses SQLite unless `DATABASE_URL` is set.
- Maintenance routes are disabled by default. Explicit env flags are required to enable `sql-run` or `reset-db` outside tests.
- `AUTH_SECRET` must be non-empty; whitespace-only values are treated as invalid.
- Do not push changes unless asked.
