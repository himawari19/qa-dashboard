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

## Local Login

Use the local seed output for the default admin login.

Login uses `email + password` only.
If `node seed.mjs` errors with `EBUSY`, stop the dev server first because `prisma/dev.db` is locked.

## Notes

- Prod uses Neon/Postgres.
- Local uses SQLite unless `DATABASE_URL` is set.
- Do not push changes unless asked.
