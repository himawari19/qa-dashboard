import { PageShell } from "@/components/page-shell";
import { authEnabled } from "@/lib/auth";

const dbMode = process.env.DATABASE_URL?.startsWith("postgres") ? "Neon/Postgres" : "SQLite local";
const dbHint = process.env.DATABASE_URL?.startsWith("postgres")
  ? "DATABASE_URL points to Neon/Postgres."
  : "DATABASE_URL is empty, so the app uses local SQLite.";

export default function SettingsPage() {
  return (
    <PageShell
      eyebrow="Settings"
      title="Environment Setup"
      description="No hardcode. Local uses SQLite automatically when DATABASE_URL is empty. Production uses Neon/Postgres when DATABASE_URL is set."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-sky-700">Database</p>
          <h3 className="mt-2 text-xl font-bold text-slate-900">{dbMode}</h3>
          <p className="mt-2 text-sm text-slate-500">{dbHint}</p>
          <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
            <p className="font-semibold text-slate-900">Local</p>
            <p>Leave `DATABASE_URL` empty.</p>
            <p className="mt-2 font-semibold text-slate-900">Production</p>
            <p>Set `DATABASE_URL` to your Neon connection string.</p>
          </div>
        </div>
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-sky-700">Login</p>
          <h3 className="mt-2 text-xl font-bold text-slate-900">{authEnabled() ? "Enabled" : "Disabled"}</h3>
          <p className="mt-2 text-sm text-slate-500">
            Use `AUTH_USERNAME`, `AUTH_PASSWORD`, and `AUTH_SECRET`. If any are missing, login is disabled.
          </p>
        </div>
      </div>
    </PageShell>
  );
}
