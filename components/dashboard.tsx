"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "@/components/ui/toast";
import { cn, formatDate } from "@/lib/utils";
import { Breadcrumb } from "@/components/breadcrumb";
import {
  Bug, ClipboardText, PlayCircle, Checks, Note,
  ArrowRight, User,
  ChartBar, CalendarBlank, Kanban, CaretRight,
  TrendUp, TrendDown, Minus,
} from "@phosphor-icons/react";
import { DensityToggle } from "@/components/density-toggle";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell,
} from "recharts";
import { ResponsiveContainer } from "@/components/responsive-container";
import { ChartSkeleton } from "@/components/ui/skeleton";
import { useCurrentUserRole, type AttentionItem } from "@/components/attention-panel";
import { useValueChangeAnimation } from "@/hooks/use-value-change-animation";

const DashboardDrawer = dynamic(() => import("@/components/dashboard-drawer").then((module) => module.DashboardDrawer), {
  ssr: false,
  loading: () => <SectionSkeleton className="h-72" />,
});

const DashboardStandupModal = dynamic(
  () => import("@/components/dashboard-standup-modal").then((module) => module.DashboardStandupModal),
  { ssr: false, loading: () => null },
);

const QualityHealthScore = dynamic(
  () => import("@/components/quality-health-score").then((module) => module.QualityHealthScore),
  { ssr: false, loading: () => <div className="h-24 rounded-2xl border border-slate-200 bg-slate-50" /> },
);

const AttentionPanel = dynamic(
  () => import("@/components/attention-panel").then((module) => module.AttentionPanel),
  { ssr: false, loading: () => <SectionSkeleton className="h-56" /> },
);

const DailyDigestCard = dynamic(
  () => import("@/components/daily-digest-card").then((module) => module.DailyDigestCard),
  { ssr: false, loading: () => <SectionSkeleton className="h-40" /> },
);

function SectionSkeleton({ className }: { className: string }) {
  return <div className={`rounded-2xl border border-slate-200 bg-slate-50 ${className}`} />;
}

// ── Types ──────────────────────────────────────────────────────────────────

type DrawerItem = { label: string; sub?: string; badge?: string; badge2?: string; href: string };

type DashboardProps = {
  metrics: { label: string; value: number; caption: string }[];
  distribution: {
    tasks: { name: string; value: number }[];
    bugs: { name: string; value: number }[];
    bugByModule: { module: string; count: number }[];
  };
  personalSuccessRate: number;
  spotlight?: {
    projectName: string;
    totalScenarios: number;
    totalBugs: number;
    completionRate: number;
    criticalBugs: { id?: number | string; code: string; title: string; severity: string; statusChangedAt?: string | null; ageDays?: number | null; moduleType?: 'Bug' | 'Task' }[];
    priorityTasks: { id?: number | string; code: string; title: string; priority: string; statusChangedAt?: string | null; ageDays?: number | null; moduleType?: 'Bug' | 'Task' }[];
  };
  recent: {
    tasks: { id: number; code: string; title: string; priority: string; status: string }[];
    bugs: { id: number; code: string; title: string; severity: string; priority: string; status: string }[];
    testCases: { id: string; code: string; title: string; priority: string; status: string }[];
  };
  sprintInfo?: {
    name: string; startDate: string; endDate: string;
    progress: number; taskTotal: number; taskDone: number; goal?: string;
  } | null;
  activity?: { id: number; entityType: string; entityId: string; action: string; summary: string; actor?: string; createdAt: string }[];
  bugTrendData?: { date: string; count: number }[];
  sprintBurndown?: { date: string; done: number; ideal: number }[];
  sprintPassRates?: { name: string; passRate: number; sessions: number }[];
  todayActivity?: { type: string; label: string; status: string }[];
  heatmap?: { name: string; taskCount: number; bugCount: number; suiteCount?: number; planCount?: number; total: number }[];
  recentSessions?: { id: number; date: string; tester: string; scope: string; totalCases: number; passed: number; failed: number; blocked: number; result: string }[];
  weekPulse?: { created: number; resolved: number; prevCreated: number; prevResolved: number };
  resolutionRate?: { current: number | null; previousWeek: number | null; delta: number | null };
  bugSeverityCounts?: { critical: number; high: number; medium: number; low: number };
  qualityHealthScore?: {
    score: number;
    components: {
      resolutionRate: number | null;
      inverseCriticalRatio: number | null;
      testPassRate: number | null;
    };
  };
};

// ── Main Dashboard ─────────────────────────────────────────────────────────

export function Dashboard({
  metrics,
  distribution,
  recent,
  sprintInfo,
  bugTrendData = [],
  todayActivity = [],
  heatmap = [],
  activity = [],
  spotlight,
  weekPulse,
  resolutionRate,
  bugSeverityCounts,
  qualityHealthScore,
}: DashboardProps) {
  const [mounted, setMounted] = useState(false);
  const [drawer, setDrawer] = useState<{ title: string; subtitle?: string; items: DrawerItem[]; href?: string; entityType?: string; entityId?: number } | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [bottlenecks, setBottlenecks] = useState<{ id: string; code: string; title: string; module: string; status: string; days: number; href: string }[]>([]);
  const [showStandup, setShowStandup] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetch("/api/bottlenecks")
      .then(r => r.json())
      .then(d => setBottlenecks(d.bottlenecks || []))
      .catch(() => {});
  }, []);

  const closeDrawer = () => setDrawer(null);

  const generateStandupText = () => {
    const date = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    let text = `*Standup Log - ${date}*\n\n*Done Today:*\n`;
    if (todayActivity.length === 0) {
      text += `- Working on various QA activities\n`;
    } else {
      todayActivity.forEach(a => { text += `- [${a.type}] ${a.label} (${a.status})\n`; });
    }
    text += `\n*Blockers:*\n- (fill in)\n\n*Next Plan:*\n- (fill in)`;
    return text;
  };

  // Compute week pulse from bugTrendData if not provided from API
  const pulse = weekPulse || computeWeekPulse(metrics, distribution);

  const openBugs = metrics.find(m => m.label === "Bug Entries")?.value ?? 0;
  const openTasks = metrics.find(m => m.label === "Open Tasks")?.value ?? 0;
  const testCases = metrics.find(m => m.label === "Test Cases")?.value ?? 0;

  const criticalBugs = spotlight?.criticalBugs ?? [];
  const priorityTasks = spotlight?.priorityTasks ?? [];
  const attentionItems: AttentionItem[] = [
    ...criticalBugs.map(b => ({ type: "bug" as const, id: b.id, title: b.title, badge: b.severity, href: b.id ? `/bugs?viewId=${b.id}` : "/bugs", statusChangedAt: b.statusChangedAt ?? null, ageDays: b.ageDays ?? null, moduleType: "Bug" as const })),
    ...priorityTasks.map(t => ({ type: "task" as const, id: t.id, title: t.title, badge: t.priority, href: t.id ? `/tasks?viewId=${t.id}` : "/tasks", statusChangedAt: t.statusChangedAt ?? null, ageDays: t.ageDays ?? null, moduleType: "Task" as const })),
    ...bottlenecks.slice(0, 5).map(b => ({ type: "stuck" as const, id: b.id, title: b.title, badge: `${b.days}d stuck`, href: b.href, statusChangedAt: null as string | null, ageDays: b.days ?? null, moduleType: undefined })),
  ];

  const userRole = useCurrentUserRole();

  const chartGrid = "#f1f5f9";
  const chartTick = "#94a3b8";

  return (
    <div
      id="dashboard-density-container"
      data-dashboard-root=""
      className="space-y-6 pb-12"
      style={{ "--dash-padding": "16px", "--dash-font": "14px", "--dash-gap": "16px" } as React.CSSProperties}
    >
      {drawer && (
        <DashboardDrawer
          title={drawer.title}
          subtitle={drawer.subtitle}
          items={drawer.items}
          loading={drawerLoading}
          onClose={closeDrawer}
          viewAllHref={drawer.href}
          entityType={drawer.entityType}
          entityId={drawer.entityId}
        />
      )}

      {/* Daily morning digest - only renders before noon, when not dismissed today, and when there is data */}
      <DailyDigestCard />

      <Breadcrumb crumbs={[{ label: "Dashboard" }]} />

      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
            <ChartBar size={18} weight="bold" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Dashboard</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DensityToggle />
          <button onClick={() => setShowStandup(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-blue-600 px-4 text-xs font-bold text-white hover:bg-blue-700 transition shadow-sm shadow-blue-500/20">
            <Note size={15} weight="bold" /> Standup
          </button>
          <QuickBtn href="/bugs" icon={<Bug size={14} weight="bold" />} label="Bugs" />
          <QuickBtn href="/test-plans" icon={<ClipboardText size={14} weight="bold" />} label="Plans" />
          <QuickBtn href="/test-sessions" icon={<PlayCircle size={14} weight="bold" />} label="Sessions" />
        </div>
      </header>

      {/* Sprint bar (inline, only if active) */}
      {sprintInfo && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <CalendarBlank size={14} weight="bold" className="text-slate-400" />
              <span className="text-xs font-black uppercase tracking-widest text-slate-600">{sprintInfo.name}</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="font-bold text-emerald-600">{sprintInfo.progress}%</span>
              <span>{sprintInfo.taskDone}/{sprintInfo.taskTotal} tasks</span>
              <span className="text-slate-400">{formatDate(sprintInfo.startDate)} → {formatDate(sprintInfo.endDate)}</span>
            </div>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div style={{ width: `${sprintInfo.progress}%` }} className="h-full bg-emerald-500 rounded-full transition-all duration-1000" />
          </div>
        </div>
      )}

      {/* ── Daily Digest (morning summary) ── */}
      <DailyDigestCard />

      {/* ── Quick Stats (3 cards) ── */}
      <section className="grid gap-4 sm:grid-cols-3">
        <BugStatCard
          value={openBugs}
          bugSeverityCounts={bugSeverityCounts}
        />
        <StatCard
          label="Active Tasks"
          value={openTasks}
          icon={<Kanban size={20} weight="bold" className="text-blue-600" />}
          color="bg-blue-50"
          href="/tasks"
        />
        <StatCard
          label="Test Cases"
          value={testCases}
          icon={<Checks size={20} weight="bold" className="text-emerald-500" />}
          color="bg-emerald-50"
          href="/test-cases"
        />
      </section>

      {/* ── This Week Pulse ── */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-700">This Week</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Created vs resolved items</p>
          </div>
          <ChartBar size={14} className="text-slate-300" weight="bold" />
        </div>

        {/* Pulse metrics row - compact inline */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <PulseMetric
            label="Created"
            value={pulse.created}
            prev={pulse.prevCreated}
            color="text-rose-600"
            bgColor="bg-rose-50"
          />
          <PulseMetric
            label="Resolved"
            value={pulse.resolved}
            prev={pulse.prevResolved}
            color="text-emerald-600"
            bgColor="bg-emerald-50"
          />
          {/* Resolution Rate inline */}
          <ResolutionRateMetric resolutionRate={resolutionRate} />
          {/* Quality Health Score inline */}
          {qualityHealthScore && (
            <div className="flex items-center justify-center rounded-xl bg-slate-50 px-3 py-2">
              <QualityHealthScore qualityHealthScore={qualityHealthScore} />
            </div>
          )}
        </div>

        {/* Mini bar chart - bugs by module (top 5) */}
        {distribution.bugByModule.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-500 mb-2">Bug distribution by module</p>
            <div className="h-28">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                  <BarChart data={distribution.bugByModule.slice(0, 6)} barSize={20}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} vertical={false} />
                    <XAxis dataKey="module" tick={{ fontSize: 9, fill: chartTick }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: chartTick }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e2e8f0" }}
                      cursor={{ fill: "#f8fafc" }}
                    />
                    <Bar dataKey="count" name="Bugs" radius={[4, 4, 0, 0]}>
                      {distribution.bugByModule.slice(0, 6).map((_, i) => (
                        <Cell key={i} fill={MODULE_COLORS[i % MODULE_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : <ChartSkeleton bars={5} />}
            </div>
          </div>
        )}
      </section>

      {/* ── Attention Needed + Team Pulse ── */}
      <section className="grid gap-4 lg:grid-cols-5">

        {/* Attention Needed (3 cols) */}
        <AttentionPanel items={attentionItems} userRole={userRole} />

        {/* Team Pulse (2 cols) */}
        <div className="lg:col-span-2 flex flex-col rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-700">Team Workload</h3>
            <User size={15} className="text-slate-400" weight="bold" />
          </div>
          {heatmap.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-10 text-slate-400 gap-2">
              <User size={28} weight="bold" />
              <p className="text-xs font-semibold">No assignee data yet.</p>
              <p className="text-xs text-slate-400">Assign tasks and bugs to see workload.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {heatmap.slice(0, 8).map((member) => {
                const score = member.total;
                const heat = score >= 8 ? "bg-rose-500" : score >= 4 ? "bg-amber-400" : "bg-emerald-500";
                const pct = Math.min(100, Math.round((score / 12) * 100));
                return (
                  <button key={member.name}
                    onClick={async () => {
                      setDrawerLoading(true);
                      setDrawer({ title: member.name, subtitle: `${score} active items`, href: "/tasks", items: [] });
                      const res = await fetch(`/api/dashboard/resource-details?name=${encodeURIComponent(member.name)}`).then(r => r.json()).catch(() => ({}));
                      setDrawerLoading(false);
                      const items: DrawerItem[] = [
                        ...(res.tasks || []).map((t: any) => ({ label: t.title, sub: "Task · " + t.status, badge: t.priority, href: "/tasks" })),
                        ...(res.bugs || []).map((b: any) => ({ label: b.title, sub: "Bug · " + b.status, badge: b.priority, href: "/bugs" })),
                        ...(res.suites || []).map((s: any) => ({ label: s.title, sub: "Suite · " + s.status, href: "/test-suites" })),
                      ];
                      setDrawer({ title: member.name, subtitle: `${score} active items`, href: "/tasks", items });
                    }}
                    className="w-full text-left group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[11px] font-black text-slate-500">
                          {member.name[0]?.toUpperCase() ?? "?"}
                        </div>
                        <span className="text-xs font-semibold text-slate-700 group-hover:text-blue-600 transition">{member.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400">
                        <span>{(member as any).taskCount ?? 0}T</span>
                        <span>{(member as any).bugCount ?? 0}B</span>
                        <span className={cn("h-2 w-2 rounded-full", heat)} />
                      </div>
                    </div>
                    <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div style={{ width: `${pct}%` }} className={cn("h-full rounded-full transition-all", heat)} />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Standup modal */}
      <DashboardStandupModal
        open={showStandup}
        text={generateStandupText()}
        onClose={() => setShowStandup(false)}
        onCopy={() => {
          navigator.clipboard.writeText(generateStandupText());
          toast("Copied!", "success");
          setShowStandup(false);
        }}
      />
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

const MODULE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#6366f1", "#8b5cf6", "#ec4899"];

function computeWeekPulse(
  metrics: { label: string; value: number }[],
  distribution: { tasks: { name: string; value: number }[]; bugs: { name: string; value: number }[] },
) {
  // Fallback: use distribution data as approximation
  const totalBugs = metrics.find(m => m.label === "Bug Entries")?.value ?? 0;
  const totalTasks = metrics.find(m => m.label === "Open Tasks")?.value ?? 0;
  return {
    created: totalBugs + totalTasks,
    resolved: 0,
    prevCreated: 0,
    prevResolved: 0,
  };
}

function StatCard({ label, value, icon, color, href }: {
  label: string; value: number; icon: React.ReactNode; color: string; href: string;
}) {
  const animClass = useValueChangeAnimation(value);
  return (
    <Link href={href} prefetch={false}
      className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5 group">
      <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", color)}>
        {icon}
      </div>
      <div>
        <p className={cn("text-2xl font-black tracking-tight text-slate-900", animClass)}>{value}</p>
        <p className="text-xs font-semibold text-slate-400">{label}</p>
      </div>
      <ArrowRight size={14} className="ml-auto text-slate-300 group-hover:text-slate-500 transition" weight="bold" />
    </Link>
  );
}

function BugStatCard({ value, bugSeverityCounts }: {
  value: number;
  bugSeverityCounts?: { critical: number; high: number; medium: number; low: number };
}) {
  const animClass = useValueChangeAnimation(value);
  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5 group">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50">
          <Bug size={20} weight="bold" className="text-rose-500" />
        </div>
        <div>
          <p className={cn("text-2xl font-black tracking-tight text-slate-900", animClass)}>{value}</p>
          <p className="text-xs font-semibold text-slate-400">Open Bugs</p>
        </div>
        <Link href="/bugs" prefetch={false} className="ml-auto">
          <ArrowRight size={14} className="text-slate-300 group-hover:text-slate-500 transition" weight="bold" />
        </Link>
      </div>
      {bugSeverityCounts && (
        <div className="mt-3 grid grid-cols-4 gap-2 border-t border-slate-100 pt-3">
          {(["critical", "high", "medium", "low"] as const).map((severity) => (
            <Link
              key={severity}
              href={`/bugs?severity=${severity}`}
              prefetch={false}
              className="text-center hover:bg-slate-50 rounded-md p-1.5 transition"
            >
              <p className="text-sm font-bold text-slate-700">{bugSeverityCounts[severity]}</p>
              <p className="text-[11px] font-semibold text-slate-400 capitalize">{severity}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function PulseMetric({ label, value, prev, color, bgColor }: {
  label: string; value: number; prev: number; color: string; bgColor: string;
}) {
  const delta = prev > 0 ? Math.round(((value - prev) / prev) * 100) : 0;
  const TrendIcon = delta > 0 ? TrendUp : delta < 0 ? TrendDown : Minus;

  return (
    <div className={cn("rounded-xl px-4 py-3", bgColor)}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-600">{label}</span>
        {prev > 0 && (
          <div className={cn("flex items-center gap-0.5 text-[11px] font-bold", delta > 0 ? "text-rose-500" : delta < 0 ? "text-emerald-500" : "text-slate-400")}>
            <TrendIcon size={10} weight="bold" />
            <span>{delta > 0 ? "+" : ""}{delta}%</span>
          </div>
        )}
      </div>
      <p className={cn("text-xl font-black mt-1", color)}>{value}</p>
    </div>
  );
}

function ResolutionRateMetric({ resolutionRate }: {
  resolutionRate?: { current: number | null; previousWeek: number | null; delta: number | null };
}) {
  if (!resolutionRate) return null;

  const { current, delta } = resolutionRate;
  const isNA = current === null;
  const rateColor = isNA ? "text-slate-400" : current < 70 ? "text-amber-500" : "text-emerald-500";
  const rateBgColor = isNA ? "bg-slate-50" : current < 70 ? "bg-amber-50" : "bg-emerald-50";

  return (
    <div className={cn("rounded-xl px-4 py-3", rateBgColor)} data-testid="resolution-rate-metric">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-600">Resolution Rate</span>
        {delta !== null && (
          <span className={cn("text-[11px] font-bold", delta >= 0 ? "text-emerald-600" : "text-amber-600")} data-testid="resolution-rate-delta">
            {delta >= 0 ? `+${delta}` : `\u2212${Math.abs(delta)}`}pp
          </span>
        )}
      </div>
      <p className={cn("text-xl font-black mt-1", rateColor)} data-testid="resolution-rate-value">
        {isNA ? "N/A" : `${current}%`}
      </p>
    </div>
  );
}

function QuickBtn({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href} prefetch={false} className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 transition hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900">
      {icon}{label}
    </Link>
  );
}


