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

Default local admin:

- Email: `admin@qa-daily.local`
- Password: `Lotus1919!`

Login uses `email + password` only.

## Notes

- Prod uses Neon/Postgres.
- Local uses SQLite unless `DATABASE_URL` is set.
- Do not push changes unless asked.
