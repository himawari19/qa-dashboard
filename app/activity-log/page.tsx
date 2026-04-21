import Link from "next/link";
import { getRecentActivity } from "@/lib/data";
import { formatDate } from "@/lib/utils";
import { EmptyState } from "@/components/skeleton";
import { PageShell } from "@/components/page-shell";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ action?: string }>;

export default async function ActivityLogPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const params = searchParams ? await searchParams : {};
  const action = params.action?.trim() || "";
  let activity: Array<Record<string, unknown>> = [];
  try {
    activity = (await getRecentActivity(50)) as Array<Record<string, unknown>>;
  } catch (error) {
    console.error("Failed to load activity log:", error);
  }
  const filtered = action ? activity.filter((item) => String(item.action ?? "") === action) : activity;
  const actions = ["create", "update", "status", "bulk_update", "delete"];

  return (
    <PageShell
      eyebrow="Activity Log"
      title="Recent Changes"
      description="Track create, update, status, bulk, and delete actions across modules."
      controls={
        <div className="flex flex-wrap gap-2">
          <Link href="/activity-log" className={`rounded-full border px-4 py-2 text-xs font-bold ${!action ? "border-sky-600 bg-sky-600 text-white" : "border-slate-200 bg-white text-slate-600"}`}>All</Link>
          {actions.map((item) => (
            <Link
              key={item}
              href={`/activity-log?action=${item}`}
              className={`rounded-full border px-4 py-2 text-xs font-bold capitalize ${action === item ? "border-sky-600 bg-sky-600 text-white" : "border-slate-200 bg-white text-slate-600"}`}
            >
              {item.replace("_", " ")}
            </Link>
          ))}
        </div>
      }
      actions={
          <Link href="/" className="inline-flex h-11 items-center rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">
            Back to dashboard
          </Link>
      }
    >
      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-2 gap-4 border-b border-slate-200 bg-slate-50 px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 md:grid-cols-4">
          <span>Action</span>
          <span>Entity</span>
          <span>Summary</span>
          <span>Time</span>
        </div>
        <div className="divide-y divide-slate-100">
          {filtered.map((item) => (
            <div key={String(item.id)} className="grid grid-cols-1 gap-2 px-6 py-4 text-sm md:grid-cols-4">
              <span className="font-bold text-slate-900">{String(item.action ?? "")}</span>
              <span className="text-slate-600">{String(item.entityType ?? "")} {String(item.entityId ?? "")}</span>
              <span className="text-slate-500">{String(item.summary ?? "")}</span>
              <span className="text-slate-400">{formatDate(String(item.createdAt ?? ""))}</span>
            </div>
          ))}
          {filtered.length === 0 && (
            <EmptyState
              title="No Activity"
              description="Changes will appear here after create, update, or delete actions."
            />
          )}
        </div>
      </div>
    </PageShell>
  );
}
