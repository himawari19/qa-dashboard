# QA Hub: Next.js 16.2 Agent Rules

## Tech Stack
- **Framework**: Next.js 16.2 (App Router, Turbopack)
- **Styling**: Tailwind CSS v4 (configured in `app/globals.css`)
- **Icons**: `@phosphor-icons/react` (weight: `"bold"`)
- **Database**: SQLite (local) / Neon (prod) via `lib/db.ts`. Auto-isolation via `company` column.
- **Auth**: Simple env-based. Roles: `admin`, `lead`, `editor`, `viewer`.

## Key File Map
| File | Purpose |
|------|---------|
| `lib/db.ts` | Connection & Schema |
| `lib/data.ts` | CRUD Logic & **Activity Logging** |
| `lib/modules.ts` | Module configs & Zod schemas |
| `components/module-workspace.tsx` | Main CRUD UI & Role Handling |
| `app/[module]/page.tsx` | Dynamic Module Entry |

## Conventions & Rules
- **Activity Log**: MUST call `logActivity(company, type, id, action, summary)` in `lib/data.ts` for all CRUD.
- **Isolation**: All DB queries MUST include `company` filter unless `isAdmin` is true and company is empty.
- **Permissions**: Respect roles: `viewer` = read-only (lock status badges, hide buttons); `editor` = no delete.
- **Serialization**: DB results passed to Client Components MUST use `JSON.parse(JSON.stringify(data))`.
- **Breadcrumbs**: Use `PageShell` with standardized parents: `Documentation` (Sprints, Meetings), `System Settings` (Users, Team), `Test Management` (Plans, Suites).
- **Navigation**: Use `router.refresh()`, NOT `window.location.reload()`.
- **Imports**: Always check if `moduleConfigs` is imported in `app/[module]/page.tsx` before use.
- **Visuals**: Modern, premium UI. Use Tailwind classes. NO hardcoded hex (except CSS vars).

## Do NOT
- Add npm packages without checking `package.json`.
- Change DB schema without ensuring SQLite/Postgres compatibility.
- Reintroduce `/test-case-management` URLs; use `/test-cases`.
- Commit or push unless explicitly asked.

## Troubleshooting
- Run `npx tsc --noEmit` for types.
- Run `next build` to catch Turbopack issues early.
- Inspect `lib/modules.ts` first when adding/modifying fields.
