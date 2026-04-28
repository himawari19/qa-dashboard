"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { cn, formatDate } from "@/lib/utils";
import { Badge } from "@/components/badge";
import { Breadcrumb } from "@/components/breadcrumb";
import {
  Play,
  CheckCircle,
  XCircle,
  Warning,
  Clock,
  Table,
  CalendarBlank,
  User,
  Tag,
  ArrowLeft,
  Checks,
  CircleNotch,
  CaretDown,
  ArrowSquareOut,
  MagnifyingGlass,
  FunnelSimple,
} from "@phosphor-icons/react";

type TestCase = {
  id: number;
  tcId: string;
  caseName: string;
  typeCase: string;
  status: string;
  priority: string;
  actualResult: string;
  preCondition: string;
  testStep: string;
  expectedResult: string;
};

type Suite = {
  id: string;
  publicToken: string;
  title: string;
  assignee: string;
  status: string;
  notes?: string;
  cases: TestCase[];
};

type Plan = {
  id: string;
  title: string;
  project: string;
  sprint: string;
  assignee: string;
  status: string;
  startDate: string;
  endDate: string;
  notes: string;
  scope: string;
};

const STATUS_PILL: Record<string, string> = {
  Passed: "text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800/40",
  Failed: "text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-950/20 dark:border-rose-800/40",
  Blocked: "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800/40",
  Pending: "text-slate-500 bg-slate-50 border-slate-200 dark:bg-slate-800/40 dark:border-slate-700",
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  Passed: <CheckCircle size={12} weight="fill" className="text-emerald-500" />,
  Failed: <XCircle size={12} weight="fill" className="text-rose-500" />,
  Blocked: <Warning size={12} weight="fill" className="text-amber-500" />,
  Pending: <Clock size={12} weight="fill" className="text-slate-400" />,
};

const PRIORITY_DOT: Record<string, string> = {
  High: "bg-rose-500",
  Medium: "bg-amber-400",
  Low: "bg-slate-300",
};

function suiteReadiness(passed: number, failed: number, blocked: number, total: number) {
  if (total === 0) return { label: "Empty", color: "text-slate-400 bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700", dot: "bg-slate-300" };
  if (failed > 0) return { label: "Needs Attention", color: "text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-950/20 dark:border-rose-800/30", dot: "bg-rose-500" };
  if (passed === total) return { label: "All Passed", color: "text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800/30", dot: "bg-emerald-500" };
  if (blocked > 0) return { label: "Blocked", color: "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800/30", dot: "bg-amber-400" };
  return { label: "In Progress", color: "text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800/30", dot: "bg-blue-500" };
}

const ALL = "All";

export function TestPlanDetail({
  plan,
  suites,
}: {
  plan: Plan;
  suites: Suite[];
}) {
  const [openSuites, setOpenSuites] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState(ALL);
  const [activeTab, setActiveTab] = useState<"all" | "attention" | "empty">("all");

  const toggleSuite = (id: string) =>
    setOpenSuites((p) => ({ ...p, [id]: !p[id] }));

  const expandAll = () => {
    const next: Record<string, boolean> = {};
    suites.forEach((s) => (next[s.id] = true));
    setOpenSuites(next);
  };
  const collapseAll = () => setOpenSuites({});

  // Compute per-suite stats
  const suitesWithStats = useMemo(() =>
    suites.map((s) => {
      let passed = 0, failed = 0, blocked = 0, pending = 0;
      s.cases.forEach((c) => {
        const st = String(c.status).toLowerCase();
        if (st === "passed") passed++;
        else if (st === "failed") failed++;
        else if (st === "blocked") blocked++;
        else pending++;
      });
      return { ...s, passed, failed, blocked, pending, total: s.cases.length };
    }),
    [suites]
  );

  // Totals
  const totalCases = suitesWithStats.reduce((a, s) => a + s.total, 0);
  const totalPassed = suitesWithStats.reduce((a, s) => a + s.passed, 0);
  const totalFailed = suitesWithStats.reduce((a, s) => a + s.failed, 0);
  const totalBlocked = suitesWithStats.reduce((a, s) => a + s.blocked, 0);
  const totalPending = suitesWithStats.reduce((a, s) => a + s.pending, 0);
  const successRate = totalCases > 0 ? Math.round((totalPassed / totalCases) * 100) : 0;
  const passW = totalCases > 0 ? (totalPassed / totalCases) * 100 : 0;
  const failW = totalCases > 0 ? (totalFailed / totalCases) * 100 : 0;
  const blockW = totalCases > 0 ? (totalBlocked / totalCases) * 100 : 0;

  // Tab filter
  const tabFiltered = useMemo(() => {
    if (activeTab === "attention") return suitesWithStats.filter((s) => s.failed > 0);
    if (activeTab === "empty") return suitesWithStats.filter((s) => s.total === 0);
    return suitesWithStats;
  }, [suitesWithStats, activeTab]);

  // Search filter on visible suites
  const filteredSuites = useMemo(() => {
    if (!search) return tabFiltered;
    const q = search.toLowerCase();
    return tabFiltered.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.cases.some((c) => c.caseName?.toLowerCase().includes(q) || c.tcId?.toLowerCase().includes(q))
    );
  }, [tabFiltered, search]);

  const needsAttentionCount = suitesWithStats.filter((s) => s.failed > 0).length;
  const emptyCount = suitesWithStats.filter((s) => s.total === 0).length;

  return (
    <div className="space-y-6">

        <Breadcrumb crumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Test Plans", href: "/test-plans" },
          { label: plan.title || "Plan Detail" },
        ]} />

        {/* ── Hero ── */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-500" />
          <div className="p-6 md:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">

              {/* Title + meta */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-3">
                  <Link href="/test-plans" className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-blue-600 transition dark:border-slate-700">
                    <ArrowLeft size={15} weight="bold" />
                  </Link>
                  <Badge value={plan.status} />
                </div>
                <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white leading-tight mb-4">
                  {plan.title || "Untitled Plan"}
                </h1>
                <div className="flex flex-wrap gap-4 text-sm">
                  {plan.project && (
                    <span className="flex items-center gap-1.5 text-slate-500"><Tag size={13} weight="bold" className="text-blue-500" /><span className="font-semibold text-slate-700 dark:text-slate-300">{plan.project}</span></span>
                  )}
                  {plan.sprint && (
                    <span className="flex items-center gap-1.5 text-slate-500"><CircleNotch size={13} weight="bold" className="text-indigo-500" /><span className="font-semibold text-slate-700 dark:text-slate-300">{plan.sprint}</span></span>
                  )}
                  {plan.assignee && (
                    <span className="flex items-center gap-1.5 text-slate-500"><User size={13} weight="bold" className="text-slate-400" /><span className="font-semibold text-slate-700 dark:text-slate-300">{plan.assignee}</span></span>
                  )}
                  {(plan.startDate || plan.endDate) && (
                    <span className="flex items-center gap-1.5 text-slate-500"><CalendarBlank size={13} weight="bold" className="text-slate-400" /><span className="font-semibold text-slate-700 dark:text-slate-300">{formatDate(plan.startDate)} — {formatDate(plan.endDate)}</span></span>
                  )}
                </div>
                {(plan.scope || plan.notes) && (
                  <p className="mt-4 text-sm text-slate-500 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-4 max-w-2xl">
                    {plan.scope || plan.notes}
                  </p>
                )}
              </div>

              {/* Ring + counters */}
              <div className="flex items-center gap-6 shrink-0">
                <div className="relative flex h-28 w-28 items-center justify-center">
                  <svg viewBox="0 0 36 36" className="h-28 w-28 -rotate-90">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="3" className="text-slate-100 dark:text-slate-800" />
                    {totalCases > 0 && <>
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="#10b981" strokeWidth="3" strokeDasharray={`${passW} ${100 - passW}`} strokeLinecap="round" />
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f43f5e" strokeWidth="3" strokeDasharray={`${failW} ${100 - failW}`} strokeDashoffset={`${-passW}`} strokeLinecap="round" />
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f59e0b" strokeWidth="3" strokeDasharray={`${blockW} ${100 - blockW}`} strokeDashoffset={`${-(passW + failW)}`} strokeLinecap="round" />
                    </>}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-black text-slate-900 dark:text-white">{successRate}%</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Pass</span>
                  </div>
                </div>
                <div className="space-y-2">
                  {[
                    { label: "Suites", value: suites.length, cls: "text-slate-700 dark:text-slate-200" },
                    { label: "Total Cases", value: totalCases, cls: "text-slate-700 dark:text-slate-200" },
                    { label: "Passed", value: totalPassed, cls: "text-emerald-600" },
                    { label: "Failed", value: totalFailed, cls: "text-rose-600" },
                    { label: "Blocked", value: totalBlocked, cls: "text-amber-500" },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between gap-8">
                      <span className="text-xs font-semibold text-slate-400">{row.label}</span>
                      <span className={cn("text-sm font-black", row.cls)}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Progress bar */}
            {totalCases > 0 && (
              <div className="mt-6">
                <div className="flex h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div style={{ width: `${passW}%` }} className="bg-emerald-500 transition-all" />
                  <div style={{ width: `${failW}%` }} className="bg-rose-500 transition-all" />
                  <div style={{ width: `${blockW}%` }} className="bg-amber-400 transition-all" />
                </div>
                <div className="mt-2 flex flex-wrap gap-4 text-[11px] font-semibold text-slate-400">
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" />{totalPassed} Passed</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-500" />{totalFailed} Failed</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-400" />{totalBlocked} Blocked</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-slate-300" />{totalPending} Pending</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Stat cards (clickable tabs) ── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { key: "all" as const, label: "All Suites", value: suitesWithStats.length, sub: `${totalCases} cases`, icon: <Table size={18} weight="bold" className="text-blue-500" />, bg: "bg-blue-50 dark:bg-blue-950/20" },
            { key: "attention" as const, label: "Needs Attention", value: needsAttentionCount, sub: `${totalFailed} failed cases`, icon: <XCircle size={18} weight="fill" className="text-rose-500" />, bg: "bg-rose-50 dark:bg-rose-950/20" },
            { key: null, label: "Pass Rate", value: `${successRate}%`, sub: `${totalPassed}/${totalCases} verified`, icon: <CheckCircle size={18} weight="fill" className="text-emerald-500" />, bg: "bg-emerald-50 dark:bg-emerald-950/20" },
            { key: "empty" as const, label: "Empty Suites", value: emptyCount, sub: "no cases yet", icon: <Checks size={18} weight="bold" className="text-slate-400" />, bg: "bg-slate-50 dark:bg-slate-800/40" },
          ].map((card) => (
            <button
              key={card.label}
              onClick={() => card.key && setActiveTab(activeTab === card.key ? "all" : card.key)}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-4 text-left transition hover:shadow-md",
                card.key && activeTab === card.key
                  ? "border-blue-300 ring-1 ring-blue-400 bg-white dark:bg-slate-900"
                  : "bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800",
                !card.key && "cursor-default"
              )}
            >
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg shrink-0", card.bg)}>
                {card.icon}
              </div>
              <div>
                <p className="text-xl font-black text-slate-900 dark:text-white leading-none">{card.value}</p>
                <p className="text-[11px] font-semibold text-slate-400 mt-0.5">{card.label}</p>
                <p className="text-[10px] text-slate-300 dark:text-slate-600">{card.sub}</p>
              </div>
            </button>
          ))}
        </div>

        {/* ── Suite accordion ── */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              {[
                { key: "all" as const, label: "All" },
                { key: "attention" as const, label: `Needs Attention${needsAttentionCount > 0 ? ` (${needsAttentionCount})` : ""}` },
                { key: "empty" as const, label: `Empty${emptyCount > 0 ? ` (${emptyCount})` : ""}` },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "h-8 rounded-md px-3 text-xs font-semibold transition",
                    activeTab === tab.key
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"
                  )}
                >{tab.label}</button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <MagnifyingGlass size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search suites or cases…"
                  className="h-8 rounded-md border border-slate-200 bg-white pl-7 pr-3 text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-900 dark:border-slate-700 dark:text-white w-48"
                />
              </div>
              <button onClick={expandAll} className="h-8 rounded-md border border-slate-200 px-3 text-xs font-semibold text-slate-500 hover:bg-slate-50 transition dark:border-slate-700 dark:text-slate-400">Expand All</button>
              <button onClick={collapseAll} className="h-8 rounded-md border border-slate-200 px-3 text-xs font-semibold text-slate-500 hover:bg-slate-50 transition dark:border-slate-700 dark:text-slate-400">Collapse</button>
            </div>
          </div>

          {filteredSuites.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white p-16 text-center dark:border-slate-800 dark:bg-slate-900">
              <Checks size={36} className="mx-auto mb-3 text-slate-300" weight="bold" />
              <p className="font-bold text-slate-700 dark:text-slate-200">No suites found</p>
              <p className="mt-1 text-sm text-slate-500">Try changing the filter or search term.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredSuites.map((suite) => {
                const ready = suiteReadiness(suite.passed, suite.failed, suite.blocked, suite.total);
                const isOpen = !!openSuites[suite.id];
                const suitePassW = suite.total > 0 ? (suite.passed / suite.total) * 100 : 0;
                const suiteFailW = suite.total > 0 ? (suite.failed / suite.total) * 100 : 0;
                const suiteBlockW = suite.total > 0 ? (suite.blocked / suite.total) * 100 : 0;

                const visibleCases = filterStatus === ALL
                  ? suite.cases
                  : suite.cases.filter((c) => c.status === filterStatus);

                return (
                  <div key={suite.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                    {/* Suite row */}
                    <button
                      onClick={() => toggleSuite(suite.id)}
                      className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                    >
                      <CaretDown
                        size={14}
                        weight="bold"
                        className={cn("text-slate-400 transition-transform shrink-0", isOpen ? "rotate-0" : "-rotate-90")}
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <Link href={`/test-suites/${suite.publicToken}`} onClick={(e) => e.stopPropagation()} className="text-sm font-bold text-slate-900 dark:text-white hover:text-blue-600 transition">{suite.title}</Link>
                          <Badge value={suite.status} />
                          <span className={cn("inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-bold", ready.color)}>
                            <span className={cn("h-1.5 w-1.5 rounded-full", ready.dot)} />
                            {ready.label}
                          </span>
                        </div>
                        {suite.notes && (
                          <p className="text-xs text-slate-400 line-clamp-1">{suite.notes}</p>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="hidden md:flex items-center gap-4 shrink-0">
                        <div className="flex items-center gap-3 text-xs font-bold text-slate-400">
                          <span className="flex items-center gap-1"><CheckCircle size={13} className="text-emerald-500" />{suite.passed}</span>
                          <span className="flex items-center gap-1"><XCircle size={13} className="text-rose-500" />{suite.failed}</span>
                          <span className="flex items-center gap-1"><Warning size={13} className="text-amber-500" />{suite.blocked}</span>
                          <span className="flex items-center gap-1"><Clock size={13} className="text-slate-400" />{suite.pending}</span>
                        </div>
                        <div className="w-20">
                          <div className="flex h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                            {suite.total > 0 ? (
                              <>
                                <div style={{ width: `${suitePassW}%` }} className="bg-emerald-500" />
                                <div style={{ width: `${suiteFailW}%` }} className="bg-rose-500" />
                                <div style={{ width: `${suiteBlockW}%` }} className="bg-amber-400" />
                              </>
                            ) : (
                              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full" />
                            )}
                          </div>
                          <p className="mt-0.5 text-right text-[10px] font-bold text-slate-400">
                            {suite.total > 0 ? `${Math.round(suitePassW)}%` : "0%"}
                          </p>
                        </div>
                        <span className="text-xs font-bold text-slate-400">{suite.total} cases</span>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <Link
                          href={`/test-cases/detail/${suite.publicToken}`}
                          className="flex h-8 items-center gap-1.5 rounded-md border border-slate-200 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 transition dark:border-slate-700 dark:text-slate-400"
                        >
                          <ArrowSquareOut size={12} weight="bold" />
                          Manage
                        </Link>
                        <Link
                          href={`/test-suites/execute/${suite.publicToken}`}
                          className="flex h-8 items-center gap-1.5 rounded-md bg-slate-900 px-3 text-xs font-black text-white hover:bg-blue-600 transition dark:bg-white dark:text-slate-900"
                        >
                          <Play size={12} weight="fill" />
                          Execute
                        </Link>
                      </div>
                    </button>

                    {/* Accordion — test cases */}
                    {isOpen && (
                      <div className="border-t border-slate-100 dark:border-slate-800">
                        {/* Case filter bar */}
                        <div className="flex items-center gap-2 px-5 py-2.5 bg-slate-50/60 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800">
                          <FunnelSimple size={12} className="text-slate-400" />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mr-1">Filter:</span>
                          {["All", "Passed", "Failed", "Blocked", "Pending"].map((s) => (
                            <button
                              key={s}
                              onClick={() => setFilterStatus(s)}
                              className={cn(
                                "h-6 rounded px-2 text-[11px] font-semibold transition",
                                filterStatus === s
                                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                                  : "text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"
                              )}
                            >{s}</button>
                          ))}
                          <span className="ml-auto text-[10px] font-semibold text-slate-400">{visibleCases.length} shown</span>
                        </div>

                        {visibleCases.length === 0 ? (
                          <div className="py-8 text-center text-sm text-slate-400">No cases match this filter.</div>
                        ) : (
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-slate-100 dark:border-slate-800">
                                <th className="px-5 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 w-[80px]">ID</th>
                                <th className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Case Name</th>
                                <th className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 hidden md:table-cell w-[100px]">Type</th>
                                <th className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 hidden lg:table-cell w-[90px]">Priority</th>
                                <th className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 w-[120px]">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                              {visibleCases.map((tc) => (
                                <tr key={tc.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/20 transition-colors">
                                  <td className="px-5 py-3">
                                    <span className="font-mono text-xs font-bold text-slate-400">{tc.tcId}</span>
                                  </td>
                                  <td className="px-3 py-3 max-w-xs">
                                    <p className="truncate font-semibold text-slate-800 dark:text-slate-200">{tc.caseName}</p>
                                    {tc.actualResult && (
                                      <p className="truncate text-[11px] text-slate-400 mt-0.5">{tc.actualResult}</p>
                                    )}
                                  </td>
                                  <td className="px-3 py-3 hidden md:table-cell">
                                    <span className="text-xs text-slate-500">{tc.typeCase || "—"}</span>
                                  </td>
                                  <td className="px-3 py-3 hidden lg:table-cell">
                                    <div className="flex items-center gap-1.5">
                                      <span className={cn("h-1.5 w-1.5 rounded-full", PRIORITY_DOT[tc.priority] ?? "bg-slate-300")} />
                                      <span className="text-xs font-semibold text-slate-500">{tc.priority || "—"}</span>
                                    </div>
                                  </td>
                                  <td className="px-3 py-3">
                                    <span className={cn(
                                      "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-bold",
                                      STATUS_PILL[tc.status] ?? STATUS_PILL.Pending
                                    )}>
                                      {STATUS_ICON[tc.status] ?? STATUS_ICON.Pending}
                                      {tc.status || "Pending"}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
    </div>
  );
}
