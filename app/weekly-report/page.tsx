"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { PageShell } from "@/components/page-shell";
import { Badge } from "@/components/badge";
import { cn, formatDate } from "@/lib/utils";
import {
  Bug,
  CheckCircle,
  ClipboardText,
  TrendUp,
  CalendarBlank,
  ArrowDown,
  ArrowUp,
  Minus,
  Printer,
  WarningCircle,
  Clock,
} from "@phosphor-icons/react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
} from "recharts";

type WeeklyReportData = {
  period: { from: string; to: string };
  summary: {
    newBugs: number;
    closedBugs: number;
    openBugs: number;
    newTasks: number;
    doneTasks: number;
    openTasks: number;
    sessions: number;
    testCasesRun: number;
    passRate: number | null;
  };
  newBugs: Array<{
    id: number;
    code: string;
    title: string;
    severity: string;
    priority: string;
    project: string;
    status: string;
  }>;
  closedBugs: Array<{
    id: number;
    code: string;
    title: string;
    severity: string;
  }>;
  newTasks: Array<{
    id: number;
    code: string;
    title: string;
    priority: string;
    status: string;
    project: string;
  }>;
  bugsBySeverity: Array<{ name: string; count: number }>;
  bugsByProject: Array<{ name: string; count: number }>;
  topAssignees: Array<{ assignee?: string; name?: string; count: number }>;
  activeSprints: Array<{
    id: number;
    name: string;
    startDate: string;
    endDate: string;
    status: string;
    goal: string;
  }>;
  sessions: Array<{
    id: number;
    date: string;
    tester: string;
    scope: string;
    totalCases: number;
    passed: number;
    failed: number;
    blocked: number;
    result: string;
  }>;
  recentActivity: Array<{
    entityType: string;
    action: string;
    summary: string;
    createdAt: string;
  }>;
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#dc2626",
  high: "#f97316",
  medium: "#facc15",
  low: "#0ea5e9",
  p0: "#dc2626",
  p1: "#f97316",
  p2: "#facc15",
  p3: "#0ea5e9",
};

function StatCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: ReactNode;
  label: string;
  value: number | string;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="glass-card flex items-start gap-3 p-4">
      <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white", color ?? "bg-slate-400")}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
        <p className="text-2xl font-black leading-tight text-slate-900 dark:text-white">{value}</p>
        {sub && <p className="mt-0.5 text-[10px] font-medium text-slate-400">{sub}</p>}
      </div>
    </div>
  );
}

function Panel({
  title,
  subtitle,
  children,
  actions,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <section className="glass-card overflow-hidden">
      <div className="flex items-start justify-between gap-3 border-b border-slate-200/70 px-5 py-4 dark:border-white/8">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{title}</p>
          {subtitle && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
        {actions}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function TrendIcon({ direction }: { direction: "up" | "down" | "flat" }) {
  if (direction === "up") return <ArrowUp size={13} weight="bold" />;
  if (direction === "down") return <ArrowDown size={13} weight="bold" />;
  return <Minus size={13} weight="bold" />;
}

export default function WeeklyReportPage() {
  const [report, setReport] = useState<WeeklyReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/weekly-report")
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload?.error || "Failed to load weekly report");
        if (alive) setReport(payload);
      })
      .catch((err) => {
        if (alive) setError(err instanceof Error ? err.message : "Failed to load weekly report");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  const severityChartData = useMemo(() => {
    return (report?.bugsBySeverity ?? [])
      .map((item) => ({ name: item.name, count: Number(item.count ?? 0) }))
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [report]);

  const projectChartData = useMemo(() => {
    return (report?.bugsByProject ?? [])
      .map((item) => ({ name: item.name, count: Number(item.count ?? 0) }))
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [report]);

  const sessionTrendData = useMemo(() => {
    const sessions = report?.sessions ?? [];
    const map = new Map<string, { date: string; sessions: number; passed: number; failed: number; blocked: number; totalCases: number }>();
    for (const session of sessions) {
      const key = session.date || "Unknown";
      const current = map.get(key) ?? { date: key, sessions: 0, passed: 0, failed: 0, blocked: 0, totalCases: 0 };
      current.sessions += 1;
      current.passed += Number(session.passed ?? 0);
      current.failed += Number(session.failed ?? 0);
      current.blocked += Number(session.blocked ?? 0);
      current.totalCases += Number(session.totalCases ?? 0);
      map.set(key, current);
    }
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [report]);

  const assigneeLoad = useMemo(() => {
    return (report?.topAssignees ?? [])
      .map((item) => ({
        name: item.assignee || item.name || "-",
        count: Number(item.count ?? 0),
      }))
      .filter((item) => item.count > 0)
      .slice(0, 5);
  }, [report]);

  const actionItems = useMemo(() => {
    if (!report) return [];
    const items: Array<{ title: string; detail: string; tone: "danger" | "warning" | "info" }> = [];
    if (report.summary.passRate !== null && report.summary.passRate < 80) {
      items.push({
        title: "Review execution failures",
        detail: `Pass rate minggu ini ${report.summary.passRate}% masih di bawah target.`,
        tone: "danger",
      });
    }
    if (report.summary.openBugs > 0) {
      items.push({
        title: "Triage open bugs",
        detail: `${report.summary.openBugs} bug masih open dan perlu prioritas.`,
        tone: "warning",
      });
    }
    if (report.summary.openTasks > 0) {
      items.push({
        title: "Clear task backlog",
        detail: `${report.summary.openTasks} task belum selesai.`,
        tone: "info",
      });
    }
    if (!items.length) {
      items.push({
        title: "Weekly status is stable",
        detail: "Tidak ada issue kritis yang perlu di-escalate minggu ini.",
        tone: "info",
      });
    }
    return items;
  }, [report]);

  const reportMood = useMemo(() => {
    if (!report) return null;
    if (report.summary.passRate === null) return { label: "No execution data", tone: "flat" as const };
    if (report.summary.passRate >= 85) return { label: "Healthy week", tone: "up" as const };
    if (report.summary.passRate >= 70) return { label: "Needs attention", tone: "flat" as const };
    return { label: "At risk", tone: "down" as const };
  }, [report]);

  if (loading) {
    return (
      <PageShell title="Weekly Report" eyebrow="Reports" crumbs={[{ label: "Dashboard", href: "/" }, { label: "Reports" }, { label: "Weekly Report" }]}>
        <div className="space-y-4 animate-pulse">
          <div className="h-24 rounded-2xl bg-slate-100 dark:bg-slate-800" />
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-slate-100 dark:bg-slate-800" />)}
          </div>
          <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
            <div className="h-80 rounded-2xl bg-slate-100 dark:bg-slate-800" />
            <div className="h-80 rounded-2xl bg-slate-100 dark:bg-slate-800" />
          </div>
        </div>
      </PageShell>
    );
  }

  if (error || !report) {
    return (
      <PageShell title="Weekly Report" eyebrow="Reports" crumbs={[{ label: "Dashboard", href: "/" }, { label: "Reports" }, { label: "Weekly Report" }]}>
        <div className="glass-card p-8">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">Weekly report gagal dimuat.</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{error ?? "Tidak ada data."}</p>
        </div>
      </PageShell>
    );
  }

  const { summary, period, newBugs, newTasks, activeSprints, recentActivity } = report;
  const passRateTone = summary.passRate !== null
    ? summary.passRate >= 85
      ? "bg-emerald-600"
      : summary.passRate >= 70
        ? "bg-amber-500"
        : "bg-rose-600"
    : "bg-slate-400";
  const insightLine = summary.passRate === null
    ? "Belum ada test session minggu ini."
    : `Minggu ini ada ${summary.sessions} session dengan pass rate ${summary.passRate}%.`;

  return (
    <PageShell
      title="Weekly Report"
      eyebrow="Reports"
      crumbs={[{ label: "Dashboard", href: "/" }, { label: "Reports" }, { label: "Weekly Report" }]}
      actions={
        <button
          onClick={() => window.print()}
          className="flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 transition hover:bg-slate-50 print:hidden dark:border-white/10 dark:bg-slate-800 dark:text-slate-300"
        >
          <Printer size={15} weight="bold" />
          Print / PDF
        </button>
      }
    >
      <div className="mb-4 flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
        <CalendarBlank size={13} weight="bold" />
        Period: <span className="font-bold text-slate-700 dark:text-slate-200">{formatDate(period.from)}</span> —
        <span className="font-bold text-slate-700 dark:text-slate-200">{formatDate(period.to)}</span>
        <span className={cn("ml-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-widest text-white", passRateTone)}>
          <TrendIcon direction={reportMood?.tone ?? "flat"} />
          {reportMood?.label}
        </span>
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<Bug size={18} weight="bold" />} label="New Bugs" value={summary.newBugs} sub={`${summary.closedBugs} closed this week`} color="bg-red-600" />
        <StatCard icon={<CheckCircle size={18} weight="bold" />} label="Tasks Done" value={summary.doneTasks} sub={`${summary.newTasks} new, ${summary.openTasks} open`} color="bg-emerald-600" />
        <StatCard icon={<ClipboardText size={18} weight="bold" />} label="Test Sessions" value={summary.sessions} sub={`${summary.testCasesRun} cases run`} color="bg-blue-600" />
        <StatCard
          icon={<TrendUp size={18} weight="bold" />}
          label="Pass Rate"
          value={summary.passRate !== null ? `${summary.passRate}%` : "—"}
          sub={insightLine}
          color={passRateTone}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <Panel title="Execution Trend" subtitle="Passed / failed / blocked dari test session minggu ini.">
          {sessionTrendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280} minWidth={1} minHeight={1}>
              <BarChart data={sessionTrendData} margin={{ left: -12, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={24} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 10, border: "1px solid rgba(148,163,184,0.2)" }} />
                <Bar dataKey="passed" stackId="sessions" radius={[4, 4, 0, 0]} fill="#16a34a" />
                <Bar dataKey="failed" stackId="sessions" fill="#dc2626" />
                <Bar dataKey="blocked" stackId="sessions" radius={[0, 0, 4, 4]} fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
              No test session data this week.
            </div>
          )}
        </Panel>

        <Panel title="Weekly Focus" subtitle="Prioritas yang perlu ditutup dulu minggu ini.">
          <div className="space-y-3">
            {actionItems.map((item) => (
              <div
                key={item.title}
                className={cn(
                  "rounded-2xl border p-4",
                  item.tone === "danger" && "border-rose-200 bg-rose-50 dark:border-rose-500/20 dark:bg-rose-500/10",
                  item.tone === "warning" && "border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/10",
                  item.tone === "info" && "border-sky-200 bg-sky-50 dark:border-sky-500/20 dark:bg-sky-500/10",
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn("mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl text-white", item.tone === "danger" ? "bg-rose-600" : item.tone === "warning" ? "bg-amber-600" : "bg-sky-600")}>
                    <WarningCircle size={16} weight="bold" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{item.title}</p>
                    <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">{item.detail}</p>
                  </div>
                </div>
              </div>
            ))}

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Open Bugs</p>
                <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{summary.openBugs}</p>
              </div>
              <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Open Tasks</p>
                <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{summary.openTasks}</p>
              </div>
            </div>
          </div>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Panel title="Bug Severity" subtitle="Distribusi bug berdasarkan severity.">
          {severityChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240} minWidth={1} minHeight={1}>
              <BarChart data={severityChartData} margin={{ left: -10, right: 4, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={24} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 10, border: "1px solid rgba(148,163,184,0.2)" }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {severityChartData.map((entry) => (
                    <Cell key={entry.name} fill={SEVERITY_COLORS[entry.name.toLowerCase()] ?? "#94a3b8"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
              No severity data.
            </div>
          )}
        </Panel>

        <Panel title="Bug by Project" subtitle="Project yang paling banyak memunculkan bug minggu ini.">
          {projectChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240} minWidth={1} minHeight={1}>
              <BarChart data={projectChartData} layout="vertical" margin={{ top: 8, right: 16, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 10, border: "1px solid rgba(148,163,184,0.2)" }} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
              No project data.
            </div>
          )}
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[0.75fr_0.75fr_0.5fr]">
        <Panel title="New Bugs" subtitle="Bug yang masuk minggu ini.">
          <div className="space-y-2">
            {(newBugs as WeeklyReportData["newBugs"]).slice(0, 5).map((bug) => (
              <div key={bug.id} className="rounded-2xl border border-slate-200/70 p-3 dark:border-white/10">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-slate-900 dark:text-white">{bug.code} · {bug.title}</p>
                    <p className="mt-0.5 truncate text-[10px] text-slate-400">{bug.project} · {bug.priority}</p>
                  </div>
                  <Badge value={bug.status} />
                </div>
                <p className="mt-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">{bug.severity}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="New Tasks" subtitle="Task yang dibuat minggu ini.">
          <div className="space-y-2">
            {(newTasks as WeeklyReportData["newTasks"]).slice(0, 5).map((task) => (
              <div key={task.id} className="rounded-2xl border border-slate-200/70 p-3 dark:border-white/10">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-slate-900 dark:text-white">{task.code} · {task.title}</p>
                    <p className="mt-0.5 truncate text-[10px] text-slate-400">{task.project} · {task.priority}</p>
                  </div>
                  <Badge value={task.status} />
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Top Assignees" subtitle="Kontributor paling aktif minggu ini.">
          <div className="space-y-2">
            {assigneeLoad.length > 0 ? assigneeLoad.map((person, idx) => (
              <div key={person.name} className="flex items-center justify-between rounded-2xl border border-slate-200/70 px-3 py-2 dark:border-white/10">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-xs font-black text-slate-500 dark:bg-white/5 dark:text-slate-300">
                    {idx + 1}
                  </div>
                  <p className="truncate text-xs font-bold text-slate-800 dark:text-white">{person.name}</p>
                </div>
                <span className="text-xs font-black text-slate-500">{person.count}</span>
              </div>
            )) : (
              <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
                No assignee data.
              </div>
            )}
          </div>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Panel
          title="Active Sprints"
          subtitle="Sprint yang masih berjalan."
          actions={<span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-amber-600">{activeSprints.length} items</span>}
        >
          <div className="space-y-2">
            {(activeSprints as WeeklyReportData["activeSprints"]).map((sprint) => (
              <div key={sprint.id} className="rounded-2xl border border-slate-200/70 p-3 dark:border-white/10">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-slate-900 dark:text-white">{sprint.name}</p>
                    {sprint.goal && <p className="mt-0.5 truncate text-[10px] text-slate-400">{sprint.goal}</p>}
                  </div>
                  <Badge value={sprint.status} />
                </div>
                <p className="mt-2 flex items-center gap-1 text-[10px] font-medium text-slate-400">
                  <Clock size={11} weight="bold" />
                  {formatDate(sprint.startDate)} – {formatDate(sprint.endDate)}
                </p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title={`Recent Activity (${recentActivity.length})`} subtitle="Aktivitas terakhir yang tercatat di sistem.">
          <div className="max-h-80 space-y-1.5 overflow-y-auto pr-1">
            {(recentActivity as WeeklyReportData["recentActivity"]).map((activity, idx) => (
              <div key={`${activity.createdAt}-${idx}`} className="flex items-start gap-2 rounded-2xl border border-slate-200/70 px-3 py-2 dark:border-white/10">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-slate-100 text-[9px] font-black uppercase text-slate-500 dark:bg-white/5 dark:text-slate-300">
                  {activity.entityType?.[0] ?? "?"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium leading-snug text-slate-700 dark:text-slate-300">{activity.summary}</p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-widest text-slate-400">{activity.action}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </PageShell>
  );
}
