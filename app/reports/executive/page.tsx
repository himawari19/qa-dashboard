import { getExecutiveData, getQualityTrend } from "@/lib/data";
import {
  ShieldCheck,
  TrendUp,
  TrendDown,
  Minus,
  WarningCircle,
  CheckCircle,
  XCircle,
  Printer,
  Clock,
} from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";
import { PageShell } from "@/components/page-shell";
import { PrintButton } from "@/components/print-button";

export const dynamic = "force-dynamic";

type ExecutiveMetric = {
  label: string;
  value: string | number;
  trend: "up" | "down" | "stable";
  status: "success" | "warning" | "danger";
};

type ReleaseItem = { code: string; title: string; severity?: string };

export default async function ExecutiveSummaryPage() {
  let data: {
    metrics: ExecutiveMetric[];
    releaseNotes: { completedTasks: ReleaseItem[]; fixedBugs: ReleaseItem[] };
    summary: { health: string; message: string };
  } = {
    metrics: [],
    releaseNotes: { completedTasks: [], fixedBugs: [] },
    summary: { health: "N/A", message: "No data available." },
  };
  let trend: Array<{ label: string; bugs: number; fixed: number }> = [];

  try {
    data = JSON.parse(JSON.stringify(await getExecutiveData()));
  } catch (error) {
    console.error("Failed to load executive data:", error);
  }

  try {
    trend = JSON.parse(JSON.stringify(await getQualityTrend()));
  } catch (error) {
    console.error("Failed to load quality trend:", error);
  }

  const metrics = Array.isArray(data.metrics) ? data.metrics : [];
  const completedTasks = Array.isArray(data.releaseNotes?.completedTasks)
    ? data.releaseNotes.completedTasks
    : [];
  const fixedBugs = Array.isArray(data.releaseNotes?.fixedBugs)
    ? data.releaseNotes.fixedBugs
    : [];
  const summary = data.summary ?? { health: "N/A", message: "No data available." };
  const finalStatus = summary.health === "Healthy" ? "GO" : "CAUTION";

  return (
    <PageShell
      eyebrow="Strategic Insight"
      title="Executive Quality Summary"
      description="Compact health view for quality, delivery, and recent outcomes."
      actions={
        <PrintButton />
      }
      className="print:bg-white"
    >
      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.length > 0 ? (
          metrics.map((metric) => (
            <div key={metric.label} className="group relative overflow-hidden rounded-[32px] border border-white bg-white p-8 shadow-sm transition-all hover:shadow-xl print:border-slate-100 print:shadow-none">
              <div className={cn(
                "absolute -right-4 -top-4 h-24 w-24 rounded-full opacity-5 transition-transform group-hover:scale-150",
                metric.status === "success" ? "bg-emerald-500" :
                metric.status === "danger" ? "bg-rose-500" : "bg-amber-500"
              )} />
              <div className="mb-4 flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{metric.label}</p>
                {metric.trend === "up" ? <TrendUp size={18} className="text-emerald-500" /> :
                 metric.trend === "down" ? <TrendDown size={18} className="text-rose-500" /> :
                 <Minus size={18} className="text-slate-400" />}
              </div>
              <p className="text-4xl font-black tracking-tight text-slate-900">{metric.value}</p>
              <p className="mt-4 text-xs font-medium text-slate-500">Executive summary metric</p>
            </div>
          ))
        ) : (
          <div className="col-span-full rounded-[32px] border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">
            No executive data available.
          </div>
        )}
      </section>

      <section className="mt-8 rounded-[40px] border border-slate-200 bg-white p-10 shadow-sm print:shadow-none">
        <div className="flex items-center gap-3 mb-8">
          <div className="rounded-xl bg-violet-50 p-2 text-violet-600">
            <Clock size={24} weight="bold" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Historical Quality Trend</h3>
            <p className="text-sm font-medium text-slate-500">Weekly comparison of reported vs fixed bugs.</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {trend.length > 0 ? (
            trend.map((item) => (
              <div key={item.label} className="rounded-2xl border border-slate-100 p-4 text-center">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{item.label}</p>
                <p className="mt-2 text-2xl font-black text-slate-900">{item.bugs}</p>
                <p className="text-xs text-slate-500">bugs / {item.fixed} fixed</p>
              </div>
            ))
          ) : (
            <div className="col-span-full rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
              No quality trend data available.
            </div>
          )}
        </div>
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[40px] border border-slate-200 bg-white p-10 shadow-sm print:shadow-none">
          <h3 className="mb-6 text-xl font-bold text-slate-900">Summary</h3>
          <p className="text-sm leading-7 text-slate-600">{summary.message}</p>
        </div>

        <div className="rounded-[40px] border border-slate-200 bg-white p-10 shadow-sm print:shadow-none">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-sky-50 text-sky-600">
              <ShieldCheck size={32} weight="bold" />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Final Status</p>
            <p className="mt-2 text-3xl font-black text-slate-900">{finalStatus}</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <CheckCircle size={24} weight="bold" />
              </div>
              <div>
                <p className="font-bold text-slate-800">Functionality</p>
                <p className="text-xs font-medium text-slate-500">Core features are tested and stable.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                <WarningCircle size={24} weight="bold" />
              </div>
              <div>
                <p className="font-bold text-slate-800">Performance</p>
                <p className="text-xs font-medium text-slate-500">Latency on mobile is slightly above target.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                <XCircle size={24} weight="bold" />
              </div>
              <div>
                <p className="font-bold text-slate-800">Risk</p>
                <p className="text-xs font-medium text-slate-500">Open defects still need review before release.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-[40px] border border-slate-200 bg-white p-10 shadow-sm print:shadow-none">
        <div className="flex items-center gap-3 mb-8">
          <div className="rounded-xl bg-sky-50 p-2 text-sky-600">
            <Printer size={24} weight="bold" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Release Notes</h3>
            <p className="text-sm font-medium text-slate-500">Recent completed work and fixed defects.</p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-emerald-500">Completed Tasks</h4>
            <ul className="space-y-3">
              {completedTasks.length > 0 ? completedTasks.map((t: any) => (
                <li key={t.code} className="flex gap-4 items-start">
                  <span className="text-[10px] font-black tracking-widest text-slate-500 mt-1">{t.code}</span>
                  <span className="text-sm font-semibold text-slate-800">{t.title}</span>
                </li>
              )) : <li className="text-sm text-slate-500 italic">No tasks completed in this window.</li>}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-rose-400">Fixed Defects</h4>
            <ul className="space-y-3">
              {fixedBugs.length > 0 ? fixedBugs.map((b: any) => (
                <li key={b.code} className="flex gap-4 items-start">
                  <span className="text-[10px] font-black tracking-widest text-slate-500 mt-1">{b.code}</span>
                  <div className="flex-1">
                    <span className="text-sm font-semibold text-slate-800">{b.title}</span>
                    <span className={cn("ml-2 rounded px-1.5 py-0.5 text-[9px] font-black",
                      b.severity === "critical" ? "bg-rose-500/20 text-rose-500" : "bg-slate-100 text-slate-500"
                    )}>
                      {String(b.severity || "low").toUpperCase()}
                    </span>
                  </div>
                </li>
              )) : <li className="text-sm text-slate-500 italic">No bugs fixed in this window.</li>}
            </ul>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
