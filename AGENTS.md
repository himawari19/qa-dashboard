# QA Hub — Agent Rules

## Stack
Next.js 16.2 (App Router, Turbopack) · Tailwind v4 · `@phosphor-icons/react` (bold) · SQLite (dev) / Neon Postgres (prod) via `lib/db.ts` · Roles: superadmin admin fe be fullstack qa pm ai

## Key Files
- `lib/db.ts` — DB connection, schema, `isPostgres` flag
- `lib/auth.ts` / `lib/auth-core.ts` — Session, login, role checks
- `lib/roles.ts` — Role helpers, labels, options
- `lib/data.ts` — CRUD + activity logging
- `lib/data-helpers.ts` — `getAccessScope`, `logActivity`
- `lib/modules.ts` — Module configs & Zod schemas (check first when adding fields)
- `components/module-workspace.tsx` — Main CRUD UI
- `components/responsive-container.tsx` — Safe Recharts wrapper
- `app/[module]/page.tsx` — Dynamic module entry

## SQL (CRITICAL)
- **Always double-quote camelCase columns** — Postgres lowercases unquoted identifiers.
- Must-quote: `createdAt` `updatedAt` `deletedAt` `startDate` `endDate` `sprintId` `testPlanId` `testSuiteId` `publicToken` `suggestedDev` `totalCases` `bugType` `relatedItems` `relatedFeature` `lastRunAt` `automationResult` `typeCase` `preCondition` `caseName` `testStep` `expectedResult` `actualResult` `actionItems` `entityType` `entityId`
- Branch date logic with `isPostgres` (no `julianday` on Postgres).
- Guard empty text dates with `COALESCE(col, '') != ''`.
- `IN (...)` — return early on empty arrays.
- `toPostgresQuery()` converts `?`→`$n` but does NOT quote columns.
- UNION params: count `?` per branch, duplicate params accordingly.
- Schema changes: create tables → add columns → create indexes.

## Rules
1. All queries MUST filter by `company` (unless superadmin with empty company).
2. All CRUD MUST call `logActivity(company, type, id, action, summary)`.
3. DB results → client: `JSON.parse(JSON.stringify(data))`.
4. Navigation: `router.refresh()`, never `window.location.reload()`.
5. Charts: use `responsive-container.tsx` wrapper.
6. UI: Tailwind only, no hardcoded hex. Modern/premium look.
7. Icons: `@phosphor-icons/react` weight `"bold"`.
8. Breadcrumbs: `PageShell` with parents — Documentation (Sprints, Meetings), System Settings (Users, Team), Test Management (Plans, Suites).
9. All mutating API routes MUST validate session before processing.
10. Input validation: use Zod schemas from `lib/modules.ts`.
11. SQL: parameterized queries only — no string interpolation.
12. Dates: store ISO 8601, display with `date-fns`, server = UTC.
13. API success: `{ data }` — API error: `{ error: string }` + proper status code.
14. Code & comments in English.
15. Bump `package.json` version before deploy/push.

## Do NOT
- Add packages without checking `package.json`.
- Change schema without SQLite/Postgres compat.
- Use `/test-case-management` — it's `/test-cases`.
- Commit/push unless asked.
- Generate `.md` spec files — implement directly.
- Run tests or modify test files unless asked.

## Checks
```
npx tsc --noEmit
pnpm precheck
```
