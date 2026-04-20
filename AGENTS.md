<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project Rules

- Be concise. No filler, no long explanations unless asked.
- Check locally first. Verify with build, lint, or direct runtime checks before claiming done.
- Prefer code and terminal checks over assumptions.
- Keep changes aligned with existing app structure and UI patterns.
- Do not change database behavior casually. Any DB change must work with local SQLite and production Neon/Postgres.
- Do not commit or push unless explicitly requested.
- Before editing, inspect the affected file and related code paths.
- When a page or layout already has an established pattern, match it instead of introducing a new one.
