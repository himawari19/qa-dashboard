"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { cn, formatDisplayText } from "@/lib/utils";
import { Badge } from "@/components/badge";
import {
  CheckCircle,
  XCircle,
  Warning,
  Clock,
  Play,
  MagnifyingGlass,
  Checks,
  Table,
  ArrowSquareOut,
} from "@phosphor-icons/react";

type TestCase = {
  id: number;
  tcId: string;
  caseName: string;
  assignee?: string;
  typeCase: string;
  preCondition: string;
  testStep: string;
  expectedResult: string;
  actualResult: string;
  status: string;
  priority: string;
  evidence: string;
  suiteTitle: string | null;
  suiteToken: string | null;
  suiteStatus: string | null;
  suiteAssignee?: string | null;
  planTitle: string | null;
  planProject: string | null;
  testSuiteId: string | number;
};

type SuiteGroup = {
  key: string;
  suiteTitle: string;
  suiteToken: string | null;
  suiteStatus: string | null;
  suiteAssignee: string | null;
  planTitle: string | null;
  planProject: string | null;
  cases: TestCase[];
  passed: number;
  failed: number;
  blocked: number;
  pending: number;
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

const ALL = "All";
const STATUS_FILTERS = [ALL, "Passed", "Failed", "Blocked", "Pending"] as const;

export function TestCaseLibrary({ cases, initialSearch = "" }: { cases: TestCase[]; initialSearch?: string }) {
  const [search, setSearch] = useState(initialSearch);
  const [filterStatus, setFilterStatus] = useState(ALL);
  const [filterAssignee, setFilterAssignee] = useState(ALL);
  const [compactView, setCompactView] = useState(true);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const total = cases.length;
  const passedTotal = cases.filter((c) => c.status === "Passed").length;
  const suiteCount = useMemo(() => new Set(cases.map((c) => String(c.testSuiteId ?? "unassigned"))).size, [cases]);

  const groups = useMemo<SuiteGroup[]>(() => {
    const map = new Map<string, SuiteGroup>();
    cases.forEach((c) => {
      const key = String(c.testSuiteId ?? "unassigned");
      if (!map.has(key)) {
        map.set(key, {
          key,
          suiteTitle: c.suiteTitle || "Unassigned Suite",
          suiteToken: c.suiteToken,
          suiteStatus: c.suiteStatus,
          suiteAssignee: c.suiteAssignee || null,
          planTitle: c.planTitle,
          planProject: c.planProject,
          cases: [],
          passed: 0, failed: 0, blocked: 0, pending: 0,
        });
      }
      const g = map.get(key)!;
      g.cases.push(c);
      const s = c.status;
      if (s === "Passed") g.passed++;
      else if (s === "Failed") g.failed++;
      else if (s === "Blocked") g.blocked++;
      else g.pending++;
    });
    return Array.from(map.values());
  }, [cases]);

  const filteredGroups = useMemo(() => {
    return groups
      .map((g) => {
        let filteredCases = g.cases;
        if (filterStatus !== ALL) filteredCases = filteredCases.filter((c) => c.status === filterStatus);
        if (filterAssignee !== ALL) {
          filteredCases = filteredCases.filter((c) => (c.assignee || g.suiteAssignee || "Unassigned") === filterAssignee);
        }
        if (search) {
          const q = search.toLowerCase();
          filteredCases = filteredCases.filter(
            (c) =>
              c.caseName?.toLowerCase().includes(q) ||
              c.tcId?.toLowerCase().includes(q) ||
              c.assignee?.toLowerCase().includes(q) ||
              c.suiteTitle?.toLowerCase().includes(q) ||
              c.suiteAssignee?.toLowerCase().includes(q) ||
              c.planTitle?.toLowerCase().includes(q) ||
              c.planProject?.toLowerCase().includes(q) ||
              c.typeCase?.toLowerCase().includes(q) ||
              c.priority?.toLowerCase().includes(q) ||
              c.status?.toLowerCase().includes(q)
          );
        }
        return { ...g, filteredCases };
      })
      .filter((g) => {
        if (search || filterStatus !== ALL || filterAssignee !== ALL) return g.filteredCases.length > 0;
        return true;
      });
  }, [groups, filterStatus, filterAssignee, search]);

  const assigneeOptions = useMemo(() => {
    const values = new Set<string>();
    cases.forEach((c) => {
      const suiteAssignee = String(c.suiteAssignee ?? "").trim();
      const assignee = String(c.assignee ?? "").trim();
      if (assignee) values.add(assignee);
      else if (suiteAssignee) values.add(suiteAssignee);
    });
    return [ALL, ...Array.from(values).sort((a, b) => a.localeCompare(b))];
  }, [cases]);

  const selected = filteredGroups.find((g) => g.key === selectedKey) ?? filteredGroups[0] ?? null;
  const displayCases = selected
    ? (filterStatus !== ALL || search
        ? selected.filteredCases
        : selected.cases)
    : [];
  const visibleCases = selected ? displayCases.length : 0;
  const passRate = visibleCases > 0 ? Math.round((displayCases.filter((c) => c.status === "Passed").length / visibleCases) * 100) : 0;

  return (
    <div className="space-y-4 pb-20">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-100 px-4 py-4 dark:border-slate-800 sm:px-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0 space-y-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-blue-600">Test Case Library</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Search by case, suite, assignee, or status. Switch to compact view when the list gets dense.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">{total} cases</span>
                <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">{suiteCount} suites</span>
                <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">{visibleCases || total} visible</span>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">{passRate}% pass rate</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setCompactView((v) => !v)}
                className={cn(
                  "h-9 rounded-md border px-3 text-xs font-semibold transition",
                  compactView
                    ? "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400",
                )}
              >
                Compact
              </button>
              <Link
                href={selected?.suiteToken ? `/test-cases/detail/${selected.suiteToken}` : "/test-cases"}
                className="inline-flex h-9 items-center gap-2 rounded-md border border-sky-200 bg-sky-50 px-3 text-xs font-semibold text-sky-700 transition hover:bg-sky-100 dark:border-sky-800 dark:bg-sky-950/30 dark:text-sky-300"
              >
                <ArrowSquareOut size={13} weight="bold" />
                Edit Selected
              </Link>
              <Link
                href={selected?.suiteToken ? `/test-suites/execute/${selected.suiteToken}` : "/test-suites"}
                className="inline-flex h-9 items-center gap-2 rounded-md bg-slate-900 px-3 text-xs font-black uppercase tracking-wider text-white transition hover:bg-blue-600 dark:bg-white dark:text-slate-900"
              >
                <Play size={12} weight="fill" />
                Execute
              </Link>
            </div>
          </div>

          <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto]">
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px]">
              <div className="relative">
                <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search case name, TC ID, suite, assignee..."
                  className="h-10 w-full rounded-md border border-slate-200 bg-white pl-8 pr-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                />
              </div>
              <select
                value={filterAssignee}
                onChange={(e) => setFilterAssignee(e.target.value)}
                className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300"
              >
                {assigneeOptions.map((name) => (
                  <option key={name} value={name}>{name === ALL ? "All assignees" : name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap gap-1">
              {STATUS_FILTERS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setFilterStatus(s)}
                  className={cn(
                    "h-10 rounded-md px-3 text-xs font-semibold transition",
                    filterStatus === s
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 px-4 pb-4 lg:h-[calc(100vh-310px)] lg:min-h-[500px] lg:flex-row">
          <div className="flex max-h-[320px] w-full shrink-0 flex-col gap-1 overflow-y-auto rounded-md border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-900 lg:sticky lg:top-4 lg:h-full lg:max-h-none lg:w-72">
            {filteredGroups.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-slate-400">
                <Checks size={32} weight="bold" />
                <p className="text-xs font-semibold">No suites found</p>
              </div>
            ) : (
              filteredGroups.map((g) => {
                const isActive = (selectedKey ?? filteredGroups[0]?.key) === g.key;
                const displayCount = filterStatus !== ALL || search || filterAssignee !== ALL ? g.filteredCases.length : g.cases.length;
                return (
                  <button
                    key={g.key}
                    type="button"
                    onClick={() => setSelectedKey(g.key)}
                    className={cn(
                      "w-full rounded-md px-3 py-3 text-left transition-all",
                      isActive ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20" : "hover:bg-slate-50 dark:hover:bg-slate-800/60",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        {g.planProject && (
                          <p className={cn("mb-0.5 truncate text-[9px] font-bold uppercase tracking-widest", isActive ? "text-blue-200" : "text-blue-500")}>
                            {g.planProject}
                          </p>
                        )}
                        <p className={cn("truncate text-sm font-bold leading-snug", isActive ? "text-white" : "text-slate-800 dark:text-slate-200")}>
                          {g.suiteTitle}
                        </p>
                        <p className={cn("mt-0.5 truncate text-[10px] font-semibold", isActive ? "text-blue-200" : "text-slate-400")}>
                          {g.planTitle || "No plan"}
                        </p>
                        {g.suiteAssignee && (
                          <p className={cn("mt-0.5 truncate text-[10px] font-semibold", isActive ? "text-blue-100" : "text-slate-500")}>
                            {g.suiteAssignee}
                          </p>
                        )}
                      </div>
                      <span className={cn(
                        "mt-0.5 shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-black",
                        isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500 dark:bg-slate-800",
                      )}>
                        {displayCount}
                      </span>
                    </div>
                    <div className={cn("mt-2 flex items-center gap-2.5 text-[10px] font-bold", isActive ? "text-blue-200" : "text-slate-400")}>
                      <span className="flex items-center gap-1">
                        <span className={cn("h-1.5 w-1.5 rounded-full", isActive ? "bg-emerald-300" : "bg-emerald-500")} />
                        {g.passed}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className={cn("h-1.5 w-1.5 rounded-full", isActive ? "bg-rose-300" : "bg-rose-500")} />
                        {g.failed}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className={cn("h-1.5 w-1.5 rounded-full", isActive ? "bg-amber-300" : "bg-amber-400")} />
                        {g.blocked}
                      </span>
                      {g.cases.length > 0 && (
                        <div className="ml-auto flex h-1 flex-1 max-w-[48px] overflow-hidden rounded-full bg-white/20 dark:bg-slate-700">
                          <div
                            style={{ width: `${(g.passed / g.cases.length) * 100}%` }}
                            className={cn("h-full transition-all", isActive ? "bg-emerald-300" : "bg-emerald-500")}
                          />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="flex min-h-[520px] flex-1 flex-col overflow-hidden rounded-md border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            {!selected ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-400">
                <Table size={40} weight="bold" />
                <p className="text-sm font-semibold">Select a suite to view test cases</p>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-6 py-4 dark:border-slate-800">
                  <div className="min-w-0">
                    {selected.planProject && (
                      <p className="mb-0.5 text-[10px] font-bold uppercase tracking-widest text-blue-500">
                        {selected.planProject}{selected.planTitle ? ` · ${selected.planTitle}` : ""}
                      </p>
                    )}
                    <div className="flex items-center gap-2">
                      <h2 className="truncate text-base font-bold text-slate-900 dark:text-white">{selected.suiteTitle}</h2>
                      {selected.suiteStatus && <Badge value={selected.suiteStatus} />}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="hidden sm:flex items-center gap-3 text-xs font-bold text-slate-400">
                      <span className="flex items-center gap-1"><CheckCircle size={13} className="text-emerald-500" />{selected.passed}</span>
                      <span className="flex items-center gap-1"><XCircle size={13} className="text-rose-500" />{selected.failed}</span>
                      <span className="flex items-center gap-1"><Warning size={13} className="text-amber-500" />{selected.blocked}</span>
                      <span className="flex items-center gap-1"><Clock size={13} className="text-slate-400" />{selected.pending}</span>
                    </div>
                    {selected.suiteToken && (
                      <Link
                        href={`/test-cases/detail/${selected.suiteToken}`}
                        title="Edit test cases"
                        className="flex h-8 items-center gap-1.5 rounded-md border border-sky-200 bg-sky-50 px-3 text-xs font-semibold text-sky-700 transition hover:bg-sky-100 dark:border-sky-800 dark:bg-sky-950/30 dark:text-sky-300"
                      >
                        <ArrowSquareOut size={13} weight="bold" />
                        Edit Cases
                      </Link>
                    )}
                    {selected.suiteToken && (
                      <Link
                        href={`/test-suites/execute/${selected.suiteToken}`}
                        title="Execute suite"
                        className="flex h-8 items-center gap-1.5 rounded-md bg-slate-900 px-3 text-xs font-black uppercase tracking-wider text-white transition hover:bg-blue-600 dark:bg-white dark:text-slate-900"
                      >
                        <Play size={12} weight="fill" />
                        Execute
                      </Link>
                    )}
                  </div>
                </div>

                {displayCases.length === 0 ? (
                  <div className="flex flex-1 flex-col items-center justify-center gap-2 text-slate-400">
                    <Checks size={32} weight="bold" />
                    <p className="text-sm font-semibold">No cases match this filter</p>
                  </div>
                ) : (
                  <div className="flex flex-1 flex-col overflow-hidden">
                    <div className="grid gap-3 px-4 py-4 md:hidden">
                      {displayCases.map((tc) => (
                        <div key={tc.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-mono text-[11px] font-bold text-slate-400">{tc.tcId}</p>
                              <h3 className="mt-1 truncate text-sm font-bold text-slate-900 dark:text-white">{tc.caseName}</h3>
                              <p className="mt-1 text-[11px] text-slate-500">{tc.assignee || selected.suiteAssignee || "Unassigned"}</p>
                            </div>
                            <span className={cn("inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-bold", STATUS_PILL[tc.status] ?? STATUS_PILL.Pending)}>
                              {STATUS_ICON[tc.status] ?? STATUS_ICON.Pending}
                              {formatDisplayText(tc.status || "Pending")}
                            </span>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold text-slate-500">
                            <span className="rounded-full bg-slate-100 px-2 py-1 dark:bg-slate-800">{formatDisplayText(tc.typeCase)}</span>
                            <span className="rounded-full bg-slate-100 px-2 py-1 dark:bg-slate-800">{formatDisplayText(tc.priority)}</span>
                          </div>
                          {tc.actualResult && (
                            <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-slate-500">{tc.actualResult}</p>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="hidden flex-1 overflow-y-auto md:block">
                      <table className={cn("w-full text-sm", compactView ? "text-[13px]" : "text-sm")}>
                        <thead className="sticky top-0 z-10">
                          <tr className="border-b border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/80">
                            <th className="w-[90px] px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">ID</th>
                            <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Case Name</th>
                            <th className="hidden w-[160px] px-3 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 md:table-cell">Assignee</th>
                            <th className="hidden w-[120px] px-3 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 md:table-cell">Type</th>
                            <th className="hidden w-[90px] px-3 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 lg:table-cell">Priority</th>
                            <th className="w-[110px] px-3 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {displayCases.map((tc) => (
                            <tr key={tc.id} className="group/row transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                              <td className="px-5 py-3.5 align-top">
                                <span className="font-mono text-xs font-bold text-slate-400">{tc.tcId}</span>
                              </td>
                              <td className={cn("px-3 py-3.5 align-top", compactView ? "max-w-[360px]" : "max-w-[320px]")}>
                                <div className="space-y-1">
                                  <p className="truncate font-semibold text-slate-800 dark:text-slate-200">{tc.caseName}</p>
                                  {tc.actualResult && (
                                    <p className={cn("truncate text-[11px] text-slate-400", compactView ? "mt-0" : "mt-0.5")}>{tc.actualResult}</p>
                                  )}
                                </div>
                              </td>
                              <td className="hidden px-3 py-3.5 align-top md:table-cell">
                                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                                  {tc.assignee || selected.suiteAssignee || "Unassigned"}
                                </span>
                              </td>
                              <td className="hidden px-3 py-3.5 align-top md:table-cell">
                                <span className="text-xs text-slate-500">{formatDisplayText(tc.typeCase)}</span>
                              </td>
                              <td className="hidden px-3 py-3.5 align-top lg:table-cell">
                                <div className="flex items-center gap-1.5">
                                  <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", PRIORITY_DOT[tc.priority] ?? "bg-slate-300")} />
                                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">{formatDisplayText(tc.priority)}</span>
                                </div>
                              </td>
                              <td className="px-3 py-3.5 align-top">
                                <span className={cn("inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-bold", STATUS_PILL[tc.status] ?? STATUS_PILL.Pending)}>
                                  {STATUS_ICON[tc.status] ?? STATUS_ICON.Pending}
                                  {formatDisplayText(tc.status || "Pending")}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
