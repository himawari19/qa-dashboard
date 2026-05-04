"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Badge } from "@/components/badge";
import { toast } from "@/components/ui/toast";
import { cn, formatDate } from "@/lib/utils";
import { Breadcrumb } from "@/components/breadcrumb";
import { DashboardDrawer } from "@/components/dashboard-drawer";
import { DashboardStandupModal } from "@/components/dashboard-standup-modal";
import {
  Bug, ClipboardText, Table, PlayCircle, Checks, Note, Printer,
  ArrowRight, X, CheckCircle, XCircle, Warning, Clock, User,
  ChartBar, TrendUp, CalendarBlank, Kanban, CaretRight, Timer,
} from "@phosphor-icons/react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area, CartesianGrid,
  LineChart, Line, ReferenceLine,
} from "recharts";
import { ChartSkeleton } from "@/components/ui/skeleton";

// ── Types ──────────────────────────────────────────────────────────────────

type Session = { id: number; date: string; tester: string; scope: string; totalCases: number; passed: number; failed: number; blocked: number; result: string };
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
    criticalBugs: { id?: number | string; code: string; title: string; severity: string }[];
    priorityTasks: { id?: number | string; code: string; title: string; priority: string }[];
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
  activity?: { id: number; entityType: string; entityId: string; action: string; summary: string; createdAt: string }[];
  bugTrendData?: { date: string; count: number }[];
  sprintBurndown?: { date: string; done: number; ideal: number }[];
  sprintPassRates?: { name: string; passRate: number; sessions: number }[];
  todayActivity?: { type: string; label: string; status: string }[];
  heatmap?: { name: string; taskCount: number; bugCount: number; total: number }[];
  recentSessions?: Session[];
};

// ── Colors ─────────────────────────────────────────────────────────────────

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#dc2626", high: "#f97316", medium: "#facc15", low: "#0ea5e9",
  p0: "#dc2626", p1: "#f97316", p2: "#facc15", p3: "#0ea5e9",
};
const STATUS_COLORS: Record<string, string> = {
  todo: "#94a3b8", "in-progress": "#2563eb", in_progress: "#2563eb",
  doing: "#2563eb", done: "#059669", completed: "#059669",
  open: "#dc2626", closed: "#059669", rejected: "#475569",
  ready_to_retest: "#7c3aed", "in review": "#7c3aed",
  planning: "#6366f1", active: "#2563eb",
  draft: "#94a3b8", deferred: "#475569",
};
const MODULE_COLORS = ["#3b82f6","#10b981","#f59e0b","#6366f1","#8b5cf6","#ec4899","#06b6d4","#f97316"];

// ── Drawer ─────────────────────────────────────────────────────────────────

function Drawer({ title, subtitle, items, loading, onClose, viewAllHref }: {
  title: string; subtitle?: string; items: DrawerItem[];
  loading?: boolean; onClose: () => void; viewAllHref?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const keyHandler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", keyHandler);
    return () => { document.removeEventListener("mousedown", handler); document.removeEventListener("keydown", keyHandler); };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-sm animate-in fade-in duration-200">
      <div ref={ref} className="h-full w-full max-w-sm bg-white dark:bg-slate-900 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-5 py-4">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white">{title}</h2>
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            <X size={16} weight="bold" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 rounded-md bg-slate-100 dark:bg-slate-800 animate-pulse" />
            ))
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2 py-16">
              <Checks size={32} weight="bold" />
              <p className="text-sm font-semibold">No items found</p>
            </div>
          ) : (
            items.map((item, i) => (
              <Link key={i} href={item.href} onClick={onClose}
                className="flex items-center gap-3 rounded-md border border-slate-100 dark:border-slate-800 p-3 hover:border-blue-200 hover:bg-blue-50/40 dark:hover:border-blue-800/40 dark:hover:bg-blue-950/20 transition group">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-blue-700 dark:group-hover:text-blue-400">{item.label}</p>
                  {item.sub && <p className="text-xs text-slate-400 truncate mt-0.5">{item.sub}</p>}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {item.badge && <Badge value={item.badge} />}
                  {item.badge2 && <Badge value={item.badge2} />}
                </div>
                <CaretRight size={12} className="text-slate-300 group-hover:text-blue-500 transition shrink-0" />
              </Link>
            ))
          )}
        </div>

        {viewAllHref && (
          <div className="border-t border-slate-100 dark:border-slate-800 p-4">
            <Link href={viewAllHref} onClick={onClose}
              className="flex items-center justify-center gap-2 h-10 rounded-md bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-bold hover:bg-blue-600 dark:hover:bg-blue-50 transition">
              View All <ArrowRight size={14} weight="bold" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Stat Card ──────────────────────────────────────────────────────────────

function StatCard({ label, value, icon, color, onClick, active }: {
  label: string; value: number; icon: React.ReactNode;
  color: string; onClick: () => void; active?: boolean;
}) {
  return (
    <button onClick={onClick}
      className={cn(
        "flex flex-col gap-3 rounded-xl border p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-lg group",
        active
          ? "border-blue-400 ring-2 ring-blue-400/30 bg-white dark:bg-slate-900"
          : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 hover:border-slate-300"
      )}>
      <div className="flex items-center justify-between">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", color)}>{icon}</div>
        <CaretRight size={14} className={cn("transition", active ? "text-blue-500" : "text-slate-300 group-hover:text-slate-400")} />
      </div>
      <div>
        <p className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">{value}</p>
        <p className="text-xs font-semibold text-slate-400 mt-0.5">{label}</p>
      </div>
    </button>
  );
}

// ── Quick action ───────────────────────────────────────────────────────────

function QuickBtn({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href} className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs font-bold text-slate-600 dark:text-slate-300 transition hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900">
      {icon}{label}
    </Link>
  );
}

// ── Custom tooltip ─────────────────────────────────────────────────────────

const ChartTip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-700 p-3 shadow-xl text-xs">
      {label && <p className="font-bold text-slate-500 mb-1.5">{label}</p>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color || p.fill }} />
          <span className="font-semibold text-slate-700 dark:text-slate-300">{p.name}: {p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ── Main Dashboard ─────────────────────────────────────────────────────────

export function Dashboard({
  metrics,
  distribution,
  recent,
  sprintInfo,
  personalSuccessRate,
  bugTrendData = [],
  sprintBurndown = [],
  sprintPassRates = [],
  todayActivity = [],
  heatmap = [],
  activity = [],
  recentSessions = [],
  spotlight,
}: DashboardProps) {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [drawer, setDrawer] = useState<{ title: string; subtitle?: string; items: DrawerItem[]; href?: string } | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [bottlenecks, setBottlenecks] = useState<{ id: string; code: string; title: string; module: string; status: string; days: number; href: string }[]>([]);

  useEffect(() => {
    fetch("/api/bottlenecks")
      .then(r => r.json())
      .then(d => setBottlenecks(d.bottlenecks || []))
      .catch(() => {});
  }, []);
  const [showStandup, setShowStandup] = useState(false);

  useEffect(() => {
    setMounted(true);
    const update = () => setIsDark(document.documentElement.classList.contains("dark"));
    update();
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  const closeDrawer = () => setDrawer(null);

  const openStatDrawer = async (metricLabel: string, value: number) => {
    const labelMap: Record<string, { href: string; fetchKey?: string }> = {
      "Open Tasks":   { href: "/tasks",         fetchKey: "tasks" },
      "Bug Entries":  { href: "/bugs",           fetchKey: "bugs" },
      "Test Cases":   { href: "/test-cases",     fetchKey: "testCases" },
      "Test Suites":  { href: "/test-suites" },
      "Sessions":     { href: "/test-sessions" },
    };
    const meta = labelMap[metricLabel];
    if (!meta) return;

    if (metricLabel === "Open Tasks") {
      setDrawer({
        title: "Open Tasks", subtitle: `${value} total`,
        href: "/tasks",
        items: recent.tasks.map(t => ({ label: t.title, sub: t.code, badge: t.priority, badge2: t.status, href: "/tasks" })),
      });
    } else if (metricLabel === "Bug Entries") {
      setDrawer({
        title: "Bug Entries", subtitle: `${value} total`,
        href: "/bugs",
        items: recent.bugs.map(b => ({ label: b.title, sub: b.code, badge: b.severity, badge2: b.status, href: "/bugs" })),
      });
    } else if (metricLabel === "Test Cases") {
      setDrawer({
        title: "Test Cases", subtitle: `${value} total`,
        href: "/test-cases",
        items: recent.testCases.map(c => ({ label: c.title, sub: c.code, badge: c.priority, badge2: c.status, href: "/test-cases" })),
      });
    } else if (metricLabel === "Test Suites") {
      setDrawerLoading(true);
      setDrawer({ title: "Test Suites", subtitle: `${value} total`, href: "/test-suites", items: [] });
      const res = await fetch("/api/dashboard/burnout").then(r => r.json()).catch(() => []);
      setDrawerLoading(false);
      setDrawer({ title: "Test Suites", subtitle: `${value} total`, href: "/test-suites", items: [] });
    } else if (metricLabel === "Sessions") {
      setDrawer({
        title: "Recent Sessions", subtitle: `${recentSessions.length} shown`,
        href: "/test-sessions",
        items: recentSessions.map(s => ({
          label: s.scope || "Session",
          sub: `${formatDate(s.date)} · ${s.tester}`,
          badge: s.result,
          href: "/test-sessions",
        })),
      });
    }
  };

  const openModuleDrawer = (module: string, count: number) => {
    const bugs = (spotlight?.criticalBugs ?? []).filter(b => b.title.toLowerCase().includes(module.toLowerCase()));
    setDrawer({
      title: `Bugs in "${module}"`,
      subtitle: `${count} defects`,
      href: "/bugs",
      items: bugs.length > 0
        ? bugs.map(b => ({ label: b.title, sub: b.code, badge: b.severity, href: "/bugs" }))
        : [{ label: `View all bugs in ${module}`, href: "/bugs" }],
    });
  };

  const openSeverityDrawer = (severity: string, count: number) => {
    const bugs = recent.bugs.filter(b => b.severity?.toLowerCase() === severity.toLowerCase());
    setDrawer({
      title: `${severity} Bugs`,
      subtitle: `${count} total`,
      href: "/bugs",
      items: bugs.length > 0
        ? bugs.map(b => ({ label: b.title, sub: b.code, badge2: b.status, href: "/bugs" }))
        : [{ label: `View all ${severity} bugs`, href: "/bugs" }],
    });
  };

  const openTaskStatusDrawer = (status: string, count: number) => {
    const tasks = recent.tasks.filter(t => t.status?.toLowerCase() === status.toLowerCase());
    setDrawer({
      title: `Tasks: ${status}`,
      subtitle: `${count} total`,
      href: "/tasks",
      items: tasks.length > 0
        ? tasks.map(t => ({ label: t.title, sub: t.code, badge: t.priority, href: "/tasks" }))
        : [{ label: `View all ${status} tasks`, href: "/tasks" }],
    });
  };

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

  // Session trend for chart
  const sessionTrend = recentSessions.slice().reverse().map(s => ({
    date: s.date ? s.date.slice(5) : "",
    passed: s.passed,
    failed: s.failed,
    blocked: s.blocked,
    rate: s.totalCases > 0 ? Math.round((s.passed / s.totalCases) * 100) : 0,
  }));

  const statCards = [
    { label: "Open Tasks", icon: <Kanban size={20} weight="bold" className="text-blue-600" />, color: "bg-blue-50 dark:bg-blue-950/30" },
    { label: "Bug Entries", icon: <Bug size={20} weight="bold" className="text-rose-500" />, color: "bg-rose-50 dark:bg-rose-950/30" },
    { label: "Test Cases", icon: <Checks size={20} weight="bold" className="text-emerald-500" />, color: "bg-emerald-50 dark:bg-emerald-950/30" },
    { label: "Test Suites", icon: <Table size={20} weight="bold" className="text-indigo-500" />, color: "bg-indigo-50 dark:bg-indigo-950/30" },
    { label: "Sessions", icon: <PlayCircle size={20} weight="bold" className="text-amber-500" />, color: "bg-amber-50 dark:bg-amber-950/30" },
  ];

  const ENTITY_ICON: Record<string, React.ReactNode> = {
    Task: <Kanban size={14} weight="bold" className="text-blue-500" />,
    Bug: <Bug size={14} weight="bold" className="text-rose-500" />,
    TestCase: <Checks size={14} weight="bold" className="text-emerald-500" />,
    TestSuite: <Table size={14} weight="bold" className="text-indigo-500" />,
    Session: <PlayCircle size={14} weight="bold" className="text-amber-500" />,
  };

  const chartGrid = isDark ? "#1e293b" : "#f1f5f9";
  const chartTick = isDark ? "#64748b" : "#94a3b8";
  const chartCursor = isDark ? "#1e293b" : "#f1f5f9";

  return (
    <div className="space-y-6 pb-12">
      {drawer && (
        <DashboardDrawer
          title={drawer.title}
          subtitle={drawer.subtitle}
          items={drawer.items}
          loading={drawerLoading}
          onClose={closeDrawer}
          viewAllHref={drawer.href}
        />
      )}

      <Breadcrumb crumbs={[{ label: "Dashboard" }]} />

      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Overview</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setShowStandup(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-blue-600 px-4 text-xs font-bold text-white hover:bg-blue-700 transition shadow-sm shadow-blue-500/20">
            <Note size={15} weight="bold" /> Standup
          </button>
          <button onClick={() => window.print()}
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition">
            <Printer size={15} weight="bold" /> Print
          </button>
          <div className="h-9 w-px bg-slate-200 dark:bg-slate-700 self-center" />
          <QuickBtn href="/bugs" icon={<Bug size={14} weight="bold" />} label="Bugs" />
          <QuickBtn href="/test-plans" icon={<ClipboardText size={14} weight="bold" />} label="Plans" />
          <QuickBtn href="/test-cases" icon={<Checks size={14} weight="bold" />} label="Cases" />
          <QuickBtn href="/test-sessions" icon={<PlayCircle size={14} weight="bold" />} label="Sessions" />
        </div>
      </header>

      {/* ── Stat cards ── */}
      <section className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {statCards.map((card) => {
          const metric = metrics.find(m => m.label === card.label);
          return (
            <StatCard
              key={card.label}
              label={card.label}
              value={metric?.value ?? 0}
              icon={card.icon}
              color={card.color}
              active={drawer?.title === card.label || drawer?.title === "Open Tasks" && card.label === "Open Tasks"}
              onClick={() => openStatDrawer(card.label, metric?.value ?? 0)}
            />
          );
        })}
      </section>


      {/* ── Charts row ── */}
      <section className="grid gap-4 lg:grid-cols-3">

        {/* Bug by Module */}
        <div className="flex min-h-0 min-w-0 flex-col rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-5">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-white">Bugs by Module</h3>
            <ChartBar size={15} className="text-slate-400" weight="bold" />
          </div>
          <p className="text-xs text-slate-500 mb-4">Click a bar to see defects</p>
          <div className="h-52 min-w-0">
            {!mounted ? <ChartSkeleton bars={5} /> : distribution.bugByModule.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <BarChart data={distribution.bugByModule} layout="vertical" barCategoryGap={6}
                  onClick={(d: any) => d?.activePayload?.[0] && openModuleDrawer(d.activePayload[0].payload.module, d.activePayload[0].value)}>
                  <XAxis type="number" tick={{ fontSize: 9, fill: chartTick }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="module" tick={{ fontSize: 10, fill: chartTick }} axisLine={false} tickLine={false} width={70} />
                  <Tooltip content={<ChartTip />} cursor={{ fill: chartCursor }} />
                  <Bar dataKey="count" radius={4} className="cursor-pointer">
                    {distribution.bugByModule.map((_, i) => (
                      <Cell key={i} fill={MODULE_COLORS[i % MODULE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart label="No module data" />
            )}
          </div>
        </div>

        {/* Bug Severity donut */}
        <div className="flex min-h-0 flex-col rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-5">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-white">Bug Severity</h3>
            <Bug size={15} className="text-slate-400" weight="bold" />
          </div>
          <p className="text-xs text-slate-500 mb-4">Click a slice to see bugs</p>
          <div className="h-52 min-w-0">
            {!mounted ? <ChartSkeleton /> : distribution.bugs.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <PieChart onClick={(d: any) => d?.activePayload?.[0] && openSeverityDrawer(d.activePayload[0].payload.name, d.activePayload[0].value)}>
                  <Pie data={distribution.bugs} cx="50%" cy="50%" innerRadius={42} outerRadius={62}
                    dataKey="value" nameKey="name" className="cursor-pointer">
                    {distribution.bugs.map((item) => (
                      <Cell key={item.name} fill={SEVERITY_COLORS[item.name.toLowerCase()] ?? "#94a3b8"} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTip />} />
                  <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart label="No severity data" />
            )}
          </div>
        </div>

        {/* Task Status donut */}
        <div className="flex min-h-0 flex-col min-w-0 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-5">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-white">Task Status</h3>
            <Kanban size={15} className="text-slate-400" weight="bold" />
          </div>
          <p className="text-xs text-slate-500 mb-4">Click a slice to see tasks</p>
          <div className="h-52 min-w-0">
            {!mounted ? <ChartSkeleton /> : distribution.tasks.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <PieChart onClick={(d: any) => d?.activePayload?.[0] && openTaskStatusDrawer(d.activePayload[0].payload.name, d.activePayload[0].value)}>
                  <Pie data={distribution.tasks} cx="50%" cy="50%" innerRadius={42} outerRadius={62}
                    dataKey="value" nameKey="name" className="cursor-pointer">
                    {distribution.tasks.map((item) => (
                      <Cell key={item.name} fill={STATUS_COLORS[item.name.toLowerCase()] ?? "#94a3b8"} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTip />} />
                  <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart label="No task data" />
            )}
          </div>
        </div>
      </section>

      {/* ── Session trend + Sprint ── */}
      <section className="grid gap-4 lg:grid-cols-3">

        {/* Session execution trend */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-5">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-white">Execution Trend</h3>
            <TrendUp size={15} className="text-slate-400" weight="bold" />
          </div>
          <p className="text-xs text-slate-500 mb-4">Pass / Fail per session (last 10)</p>
          <div className="h-48">
            {!mounted ? <ChartSkeleton /> : sessionTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <AreaChart data={sessionTrend}>
                  <defs>
                    <linearGradient id="gPass" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gFail" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: chartTick }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: chartTick }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTip />} />
                  <Area type="monotone" dataKey="passed" name="Passed" stroke="#10b981" strokeWidth={2} fill="url(#gPass)" dot={{ r: 3, fill: "#10b981" }} />
                  <Area type="monotone" dataKey="failed" name="Failed" stroke="#f43f5e" strokeWidth={2} fill="url(#gFail)" dot={{ r: 3, fill: "#f43f5e" }} />
                  <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 10 }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart label="No session data yet. Execute a suite to see trends." />
            )}
          </div>
        </div>

        {/* Sprint */}
        <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-white">Active Sprint</h3>
            <CalendarBlank size={15} className="text-slate-400" weight="bold" />
          </div>
          {sprintInfo ? (
            <>
              <div className="flex-1">
                <p className="text-lg font-black text-slate-900 dark:text-white leading-tight">{sprintInfo.name}</p>
                {sprintInfo.goal && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{sprintInfo.goal}</p>}
                <div className="mt-6">
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="text-slate-400">Progress</span>
                    <span className="text-emerald-600">{sprintInfo.progress}%</span>
                  </div>
                  <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div style={{ width: `${sprintInfo.progress}%` }} className="h-full bg-emerald-500 rounded-full transition-all duration-1000" />
                  </div>
                  <div className="flex justify-between text-xs font-bold text-slate-500 mt-2">
                    <span>{sprintInfo.taskDone} done</span>
                    <span>{sprintInfo.taskTotal} total</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400">
                <div><span className="block font-bold uppercase tracking-widest">Start</span><span>{formatDate(sprintInfo.startDate)}</span></div>
                <div className="text-right"><span className="block font-bold uppercase tracking-widest">End</span><span>{formatDate(sprintInfo.endDate)}</span></div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-2">
              <CalendarBlank size={32} weight="bold" />
              <p className="text-xs font-semibold text-center">No active sprint.<br />Create one in Sprints.</p>
              <Link href="/sprints" className="mt-2 text-xs font-bold text-blue-500 hover:underline">Go to Sprints →</Link>
            </div>
          )}
        </div>
      </section>

      {/* ── Sprint Burndown + Pass Rate per Sprint ── */}
      <section className="grid gap-4 lg:grid-cols-2">

        {/* Sprint Burndown */}
        <div className="min-w-0 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-5">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-white">Sprint Burndown</h3>
            <TrendUp size={15} className="text-violet-400" weight="bold" />
          </div>
          <p className="text-xs text-slate-500 mb-4">Actual vs ideal task completion</p>
          <div className="h-44 min-w-0">
            {!mounted ? <ChartSkeleton /> : sprintBurndown.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <LineChart data={sprintBurndown}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: chartTick }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 9, fill: chartTick }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTip />} />
                  <Line type="monotone" dataKey="ideal" name="Ideal" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                  <Line type="monotone" dataKey="done" name="Done" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3, fill: "#8b5cf6" }} />
                  <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 10 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart label={sprintInfo ? "Not enough data yet for this sprint." : "No active sprint."} />
            )}
          </div>
        </div>

        {/* Pass Rate per Sprint */}
        <div className="min-w-0 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-5">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-white">Pass Rate per Sprint</h3>
            <Checks size={15} className="text-emerald-400" weight="bold" />
          </div>
          <p className="text-xs text-slate-500 mb-4">Test pass rate across last 5 sprints</p>
          <div className="h-44 min-w-0">
            {!mounted ? <ChartSkeleton bars={5} /> : sprintPassRates.filter(s => s.sessions > 0).length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <BarChart data={sprintPassRates} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: chartTick }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: chartTick }} axisLine={false} tickLine={false} domain={[0, 100]} unit="%" />
                  <Tooltip content={<ChartTip />} />
                  <ReferenceLine y={80} stroke="#10b981" strokeDasharray="3 3" label={{ value: "80%", fontSize: 9, fill: "#10b981" }} />
                  <Bar dataKey="passRate" name="Pass Rate %" radius={[4, 4, 0, 0]}>
                    {sprintPassRates.map((entry, i) => (
                      <Cell key={i} fill={entry.passRate >= 80 ? "#10b981" : entry.passRate >= 60 ? "#f59e0b" : "#f43f5e"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart label="No test sessions recorded for sprints yet." />
            )}
          </div>
        </div>
      </section>

      {/* ── Bug Trend (7 days) ── */}
      {bugTrendData.length > 0 && (
        <section>
          <div className="min-w-0 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-5">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-white">Bug Trend</h3>
              <Bug size={15} className="text-rose-400" weight="bold" />
            </div>
            <p className="text-xs text-slate-500 mb-4">New bugs created per day (last 7 days)</p>
            <div className="h-36">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                  <BarChart data={bugTrendData} barSize={20}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: chartTick }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: chartTick }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<ChartTip />} />
                    <Bar dataKey="count" name="New Bugs" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : null}
            </div>
          </div>
        </section>
      )}

      {/* ── Quality + Critical ── */}
      <section className="grid gap-4 lg:grid-cols-3">

        {/* Quality shield */}
        <div className="rounded-xl bg-slate-900 dark:bg-blue-950 p-5 text-white relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 h-32 w-32 rounded-full bg-blue-500/10 blur-2xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Checks size={20} weight="bold" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-blue-300">Quality Index</p>
                <p className="text-sm font-bold text-white">Personal Shield</p>
              </div>
            </div>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-5xl font-black tracking-tighter">{personalSuccessRate}%</span>
              <span className="text-blue-400 text-xs font-bold">success rate</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div style={{ width: `${personalSuccessRate}%` }} className="h-full bg-blue-400 rounded-full transition-all duration-1000" />
            </div>
            <p className="text-xs text-blue-300 mt-2">
              {personalSuccessRate >= 80 ? "Excellent — keep it up!" : personalSuccessRate >= 60 ? "Good progress" : "Needs improvement"}
            </p>
          </div>
        </div>

        {/* Critical bugs */}
        <div className="min-w-0 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-rose-500">Critical Bugs</h3>
            <Link href="/bugs" className="text-xs font-bold text-blue-500 hover:underline flex items-center gap-0.5">View All <ArrowRight size={10} /></Link>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {(spotlight?.criticalBugs ?? []).length === 0
              ? <p className="text-xs text-slate-400 py-4 text-center">No critical bugs 🎉</p>
              : (spotlight?.criticalBugs ?? []).map((bug, i) => (
                  <Link key={i} href={bug.id ? `/bugs?viewId=${bug.id}` : "/bugs"}
                    className="flex w-full items-center gap-2 rounded-md bg-slate-50 dark:bg-slate-800/50 p-2.5 text-left hover:bg-rose-50 dark:hover:bg-rose-950/20 transition group">
                    <XCircle size={14} weight="fill" className="text-rose-500 shrink-0" />
                    <span className="flex-1 text-xs font-semibold text-slate-700 dark:text-slate-300 truncate group-hover:text-rose-700">{bug.title}</span>
                    <Badge value={bug.severity} />
                  </Link>
              ))
            }
          </div>
        </div>

        {/* Priority tasks */}
        <div className="min-w-0 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-blue-500">Priority Tasks</h3>
            <Link href="/tasks" className="text-xs font-bold text-blue-500 hover:underline flex items-center gap-0.5">View All <ArrowRight size={10} /></Link>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {(spotlight?.priorityTasks ?? []).length === 0
              ? <p className="text-xs text-slate-400 py-4 text-center">No priority tasks</p>
              : (spotlight?.priorityTasks ?? []).map((task, i) => (
                  <Link key={i} href={task.id ? `/tasks?viewId=${task.id}` : "/tasks"}
                    className="flex w-full items-center gap-2 rounded-md bg-slate-50 dark:bg-slate-800/50 p-2.5 text-left hover:bg-blue-50 dark:hover:bg-blue-950/20 transition group">
                    <CheckCircle size={14} weight="fill" className="text-blue-500 shrink-0" />
                    <span className="flex-1 text-xs font-semibold text-slate-700 dark:text-slate-300 truncate group-hover:text-blue-700">{task.title}</span>
                    <Badge value={task.priority} />
                  </Link>
              ))
            }
          </div>
        </div>
      </section>

      {/* ── Activity + Workload ── */}
      <section className="grid gap-4 lg:grid-cols-2">

        {/* Activity timeline */}
        <div className="flex h-[28rem] min-h-0 flex-col rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-white">Recent Activity</h3>
            <Clock size={15} className="text-slate-400" weight="bold" />
          </div>
          {activity.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">No activity yet.</div>
          ) : (
            <div className="relative min-h-0 flex-1 space-y-0 overflow-y-auto pr-2">
              <div className="absolute left-[22px] top-0 bottom-0 w-px bg-slate-100 dark:bg-slate-800" />
              {activity.map((item, i) => (
                <div key={i} className="relative flex items-start gap-3 pb-4">
                  <div className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    {ENTITY_ICON[item.entityType] ?? <Clock size={14} className="text-slate-400" weight="bold" />}
                  </div>
                  <div className="flex-1 min-w-0 pt-2">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-snug line-clamp-2">{item.summary}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{item.entityType} · {item.action} · {item.createdAt?.slice(0, 16).replace("T", " ")}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Team workload */}
        <div className="flex h-[28rem] min-h-0 flex-col rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-white">Team Workload</h3>
            <User size={15} className="text-slate-400" weight="bold" />
          </div>
          {heatmap.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">No team data.</div>
          ) : (
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-2">
              {heatmap.map((member) => {
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
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-black text-slate-500">
                          {member.name[0]?.toUpperCase() ?? "?"}
                        </div>
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:text-blue-600 transition">{member.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                        <span className="flex items-center gap-0.5"><Kanban size={10} />{(member as any).taskCount ?? 0}</span>
                        <span className="flex items-center gap-0.5"><Bug size={10} />{(member as any).bugCount ?? 0}</span>
                        <span className={cn("h-2 w-2 rounded-full", heat)} />
                      </div>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div style={{ width: `${pct}%` }} className={cn("h-full rounded-full transition-all", heat)} />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Bottleneck detector */}
      {bottlenecks.length > 0 && (
        <section className="mt-6">
          <div className="rounded-xl border border-amber-200 dark:border-amber-800/40 bg-amber-50/40 dark:bg-amber-950/10 p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-7 w-7 rounded-md bg-amber-500 flex items-center justify-center text-white shrink-0">
                <Timer size={14} weight="bold" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-amber-800 dark:text-amber-400">Bottleneck Detector</h3>
                <p className="text-xs text-amber-600 dark:text-amber-500">{bottlenecks.length} item{bottlenecks.length !== 1 ? "s" : ""} stuck in a status too long</p>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {bottlenecks.slice(0, 9).map(b => (
                <Link key={b.id} href={b.href} className="flex items-start gap-2.5 rounded-md border border-amber-200 dark:border-amber-800/30 bg-white dark:bg-slate-900 px-3 py-2.5 hover:border-amber-400 transition group">
                  <div className="shrink-0 mt-0.5">
                    <span className={cn(
                      "inline-flex h-5 items-center rounded px-1.5 text-[9px] font-black uppercase tracking-wider",
                      b.module === "Bug" ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" : "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                    )}>{b.module}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-slate-800 dark:text-white truncate group-hover:text-amber-700 transition">{b.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      <span className="font-semibold">{b.code}</span> · {b.status} · <span className="text-amber-600 font-bold">{b.days}d stuck</span>
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

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

function EmptyChart({ label }: { label: string }) {
  return <div className="flex h-full items-center justify-center text-[11px] text-slate-400 italic text-center">{label}</div>;
}
