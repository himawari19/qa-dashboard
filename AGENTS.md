# QA Hub — Agent Rules

## Stack
Next.js 16.2 (App Router, Turbopack) · Tailwind CSS v4 (`app/globals.css`) · `@phosphor-icons/react` (weight `"bold"`) · SQLite (dev) / Neon Postgres (prod) via `lib/db.ts` · Roles: `admin` `lead` `editor` `viewer`

## Key Files
| File | Purpose |
|------|---------|
| `lib/db.ts` | DB connection, schema, `isPostgres` flag |
| `lib/data.ts` | CRUD + **Activity Logging** |
| `lib/data-helpers.ts` | `getAccessScope`, `logActivity`, helpers |
| `lib/modules.ts` | Module configs & Zod schemas |
| `components/module-workspace.tsx` | Main CRUD UI & role handling |
| `app/[module]/page.tsx` | Dynamic module entry |
| `**/*.test.ts[x]` | Vitest suites (mock-based, no token needed) |

## SQL Rules (CRITICAL — prod uses Postgres)
**Always double-quote camelCase columns.** Postgres lowercases unquoted identifiers → "column not found" in prod.

```sql
-- WRONG               RIGHT
createdAt              "createdAt"
suggestedDev = ?       "suggestedDev" = ?
DATE(updatedAt)        DATE("updatedAt")
testPlanId IN (...)    "testPlanId" IN (...)
ORDER BY startDate     ORDER BY "startDate"
```

**Must-quote columns:** `createdAt` `updatedAt` `deletedAt` `startDate` `endDate` `sprintId` `testPlanId` `testSuiteId` `publicToken` `suggestedDev` `totalCases` `bugType` `relatedItems` `relatedFeature` `lastRunAt` `automationResult` `typeCase` `preCondition` `caseName` `testStep` `expectedResult` `actualResult` `actionItems` `entityType` `entityId`

**SQLite-only:** `julianday()` breaks on Postgres. Branch using `isPostgres` from `lib/db.ts`:
```ts
const dayExpr = isPostgres
  ? `(CURRENT_DATE - "updatedAt"::date)`
  : `CAST(julianday('now') - julianday("updatedAt") AS INTEGER)`;
```

**Text dates in prod:** For legacy text date cols (`startDate`, `endDate`, `date`), avoid raw `DATE(col)` on possibly empty values. Guard with `COALESCE(col, '') != ''` and compare ISO strings when possible.

**Bulk writes:** Any `IN (...)` write path must return early on empty arrays before building SQL.

**Schema init:** When changing `lib/db.ts`, create tables first, then apply missing columns, then create indexes. Existing PG tables may lag behind current schema.

**`toPostgresQuery()`** auto-converts `DATE('now',...)` and `?`→`$n` but does NOT quote columns.

**UNION params:** count `?` per branch — e.g. two branches with `andCompany` needs `[...cp, ...cp]`.

## Conventions
- **Activity Log**: MUST call `logActivity(company, type, id, action, summary)` in `lib/data.ts` for all CRUD.
- **Isolation**: All DB queries MUST include `company` filter unless `isAdmin` is true and company is empty.
- **Permissions**: `viewer` = read-only (lock status badges, hide buttons); `editor` = no delete.
- **Serialization**: DB results → Client Components MUST use `JSON.parse(JSON.stringify(data))`.
- **Breadcrumbs**: Use `PageShell` with standardized parents: `Documentation` (Sprints, Meetings), `System Settings` (Users, Team), `Test Management` (Plans, Suites).
- **Navigation**: `router.refresh()`, NOT `window.location.reload()`.
- **Imports**: Always check if `moduleConfigs` is imported in `app/[module]/page.tsx` before use.
- **Visuals**: Modern, premium UI. Tailwind classes only. NO hardcoded hex (except CSS vars).
- **Versioning**: `package.json` version is source of truth. Current: `0.2.0`.

## Do NOT
- Add npm packages without checking `package.json`.
- Change DB schema without ensuring SQLite/Postgres compatibility.
- Reintroduce `/test-case-management` URLs; use `/test-cases`.
- Commit or push unless explicitly asked.

## Checks
```
pnpm test          # mock-based, no live creds
npx tsc --noEmit   # type check
next build         # catch Turbopack issues
```
Inspect `lib/modules.ts` first when adding/modifying fields.
