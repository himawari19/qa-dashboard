<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Tech Stack

- **Framework**: Next.js 16.2 (App Router, Turbopack) — `app/` directory
- **Styling**: Tailwind CSS v4 — no `tailwind.config.ts`, configured via `app/globals.css` with `@theme inline` and `@variant dark`
- **Icons**: `@phosphor-icons/react` — use weight `"bold"` for UI icons
- **Database**: SQLite (local via `node:sqlite`) or Neon/Postgres (production). Auto-detected via `DATABASE_URL`. Schema + queries in `lib/db.ts`
- **Dark mode**: Class-based (`.dark` on `<html>`). Toggle in `components/app-wrapper.tsx`. CSS vars defined in `app/globals.css`
- **Auth**: Simple username/password via `AUTH_USERNAME` / `AUTH_PASSWORD` env vars. Middleware in `proxy.ts`

## Key File Map

| File | Purpose |
|------|---------|
| `lib/db.ts` | DB connection, schema, query helpers |
| `lib/data.ts` | All data access functions (getModuleRows, createModuleRecord, etc.) |
| `lib/modules.ts` | Module configs, Zod schemas, field/column definitions for all modules |
| `components/module-workspace.tsx` | Generic CRUD workspace used by all module pages |
| `components/page-shell.tsx` | Standard page wrapper with header/eyebrow/actions |
| `components/sidebar.tsx` | Navigation sidebar with collapsible + dark mode |
| `components/app-wrapper.tsx` | Root layout wrapper — sidebar, header, dark mode toggle, keyboard shortcuts |
| `components/badge.tsx` | Status/priority/severity colored badges |
| `app/[module]/page.tsx` | Dynamic route for all module pages (bugs, tasks, etc.) |
| `app/api/items/[module]/route.ts` | Generic CRUD API for all modules |
| `app/api/dashboard/route.ts` | Dashboard data aggregation |
| `scripts/seed-saucedemo.ts` | Local seed script — run with `npx tsx scripts/seed-saucedemo.ts` |

## Conventions

- **All pages** use `PageShell` component for consistent layout
- **DB results passed to client components** must be serialized: `JSON.parse(JSON.stringify(data))`
- **Module data** flows through `lib/modules.ts` config → `lib/data.ts` functions → `app/api/items/[module]/route.ts`
- **New module** = add to `ModuleKey` type + `moduleConfigs` + `createModuleRecord` + `updateModuleRecord` in `lib/data.ts`
- **Dark mode classes**: always add `dark:` variants when adding light-mode bg/text/border classes
- **Colors**: use Tailwind classes, not hardcoded hex. Exception: CSS vars in `globals.css`
- **Routing refresh**: use `router.refresh()` not `window.location.reload()`
- **Toast**: `toast(message, "success" | "error" | "info")` from `@/components/ui/toast`

## File Roles (jangan keliru)

| File/Folder | Dibaca oleh | Fungsi |
|-------------|-------------|--------|
| `CLAUDE.md` | Claude (otomatis) | Entry point — hanya berisi `@AGENTS.md` |
| `AGENTS.md` | Claude (otomatis) | **Aturan utama** — ini yang harus diikuti |
| `.claude/settings.local.json` | Claude Code CLI | Permission allow/deny, hooks — bukan aturan coding |
| `.vscode/settings.json` | VS Code | Editor config — Claude tidak baca ini |
| `.claude/memory/` (user-level) | Claude (manual) | Long-term memory antar sesi |

## Do NOT

- Add npm packages without checking `package.json` first
- Change DB schema casually — must work with both SQLite and Postgres
- Use `window.location.reload()` — use `router.refresh()` instead
- Hardcode colors inline — use Tailwind classes or CSS vars
- Skip `JSON.parse(JSON.stringify())` when passing DB data to client components
- Commit or push unless explicitly asked
- Use `any` type unless absolutely necessary

## Project Rules

- Be concise. No filler, no long explanations unless asked.
- Check locally first. Verify with build or getDiagnostics before claiming done.
- Prefer code and terminal checks over assumptions.
- Keep changes aligned with existing app structure and UI patterns.
- Before editing, inspect the affected file and related code paths.
- When a page or layout already has an established pattern, match it instead of introducing a new one.
- Public record routes must use permanent DB-backed tokens, not raw numeric IDs.
- Do not reintroduce user-facing `/test-case-management` URLs; use `/test-cases` and token-based detail routes.
