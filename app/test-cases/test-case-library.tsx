"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
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
  CaretRight,
} from "@phosphor-icons/react";

type TestCase = {
  id: number;
  tcId: string;
  caseName: string;
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
  planTitle: string | null;
  planProject: string | null;
  testSuiteId: string | number;
};

type SuiteGroup = {
  key: string;
  suiteTitle: string;
  suiteToken: string | null;
  suiteStatus: string | null;
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

export function TestCaseLibrary({ cases }: { cases: TestCase[] }) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState(ALL);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const total = cases.length;
  const passedTotal = cases.filter((c) => c.status === "Passed").length;

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
        if (search) {
          const q = search.toLowerCase();
          filteredCases = filteredCases.filter(
            (c) =>
              c.caseName?.toLowerCase().includes(q) ||
              c.tcId?.toLowerCase().includes(q)
          );
        }
        return { ...g, filteredCases };
      })
      .filter((g) => {
        if (search || filterStatus !== ALL) return g.filteredCases.length > 0;
        return true;
      });
  }, [groups, filterStatus, search]);

  const selected = filteredGroups.find((g) => g.key === selectedKey) ?? filteredGroups[0] ?? null;
  const displayCases = selected
    ? (filterStatus !== ALL || search
        ? selected.filteredCases
        : selected.cases)
    : [];

  return (
    <div className="space-y-4 pb-20">
      {/* Top bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search case name or ID…"
            className="h-9 w-full rounded-md border border-slate-200 bg-white pl-8 pr-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
          />
        </div>
        <div className="flex gap-1">
          {(["All", "Passed", "Failed", "Blocked", "Pending"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={cn(
                "h-9 rounded-md px-3 text-xs font-semibold transition",
                filterStatus === s
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"
              )}
            >
              {s}
            </button>
          ))}
        </div>
        <span className="text-xs font-semibold text-slate-400 whitespace-nowrap">
          {total} cases · {total > 0 ? Math.round((passedTotal / total) * 100) : 0}% pass rate
        </span>
      </div>

      {/* Split panel */}
      <div className="flex gap-4 h-[calc(100vh-260px)] min-h-[500px]">

        {/* LEFT — suite list */}
        <div className="w-72 shrink-0 flex flex-col gap-1 overflow-y-auto rounded-md border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-900">
          {filteredGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 gap-2">
              <Checks size={32} weight="bold" />
              <p className="text-xs font-semibold">No suites found</p>
            </div>
          ) : (
            filteredGroups.map((g) => {
              const isActive = (selectedKey ?? filteredGroups[0]?.key) === g.key;
              const displayCount = filterStatus !== ALL || search ? g.filteredCases.length : g.cases.length;
              return (
                <button
                  key={g.key}
                  onClick={() => setSelectedKey(g.key)}
                  className={cn(
                    "w-full rounded-md px-3 py-3 text-left transition-all",
                    isActive
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800/60"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      {g.planProject && (
                        <p className={cn("text-[9px] font-bold uppercase tracking-widest mb-0.5 truncate", isActive ? "text-blue-200" : "text-blue-500")}>
                          {g.planProject}
                        </p>
                      )}
                      <p className={cn("text-sm font-bold truncate leading-snug", isActive ? "text-white" : "text-slate-800 dark:text-slate-200")}>
                        {g.suiteTitle}
                      </p>
                      <p className={cn("text-[10px] font-semibold mt-0.5 truncate", isActive ? "text-blue-200" : "text-slate-400")}>
                        {g.planTitle || "No plan"}
                      </p>
                    </div>
                    <span className={cn(
                      "mt-0.5 shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-black",
                      isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500 dark:bg-slate-800"
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

        {/* RIGHT — case detail */}
        <div className="flex-1 overflow-hidden rounded-md border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 flex flex-col">
          {!selected ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
              <Table size={40} weight="bold" />
              <p className="text-sm font-semibold">Select a suite to view test cases</p>
            </div>
          ) : (
            <>
              {/* Suite header */}
              <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-4 dark:border-slate-800 shrink-0">
                <div className="min-w-0">
                  {selected.planProject && (
                    <p className="text-[10px] font-bold uppercase tracking-widest text-blue-500 mb-0.5">
                      {selected.planProject}{selected.planTitle ? ` · ${selected.planTitle}` : ""}
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900 dark:text-white truncate">{selected.suiteTitle}</h2>
                    {selected.suiteStatus && <Badge value={selected.suiteStatus} />}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="hidden sm:flex items-center gap-3 text-xs font-bold text-slate-400 mr-2">
                    <span className="flex items-center gap-1"><CheckCircle size={13} className="text-emerald-500" />{selected.passed}</span>
                    <span className="flex items-center gap-1"><XCircle size={13} className="text-rose-500" />{selected.failed}</span>
                    <span className="flex items-center gap-1"><Warning size={13} className="text-amber-500" />{selected.blocked}</span>
                    <span className="flex items-center gap-1"><Clock size={13} className="text-slate-400" />{selected.pending}</span>
                  </div>
                  {selected.suiteToken && (
                    <Link
                      href={`/test-cases/detail/${selected.suiteToken}`}
                      title="Manage cases"
                      className="flex h-8 items-center gap-1.5 rounded-md border border-slate-200 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition dark:border-slate-700 dark:text-slate-400"
                    >
                      <ArrowSquareOut size={13} weight="bold" />
                      Manage
                    </Link>
                  )}
                  {selected.suiteToken && (
                    <Link
                      href={`/test-suites/execute/${selected.suiteToken}`}
                      title="Execute suite"
                      className="flex h-8 items-center gap-1.5 rounded-md bg-slate-900 px-3 text-xs font-black uppercase tracking-wider text-white hover:bg-blue-600 transition dark:bg-white dark:text-slate-900"
                    >
                      <Play size={12} weight="fill" />
                      Execute
                    </Link>
                  )}
                </div>
              </div>

              {/* Cases table */}
              {displayCases.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 text-slate-400 gap-2">
                  <Checks size={32} weight="bold" />
                  <p className="text-sm font-semibold">No cases match this filter</p>
                </div>
              ) : (
                <div className="overflow-y-auto flex-1">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 z-10">
                      <tr className="border-b border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/80">
                        <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 w-[90px]">ID</th>
                        <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Case Name</th>
                        <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 hidden md:table-cell w-[120px]">Type</th>
                        <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 hidden lg:table-cell w-[90px]">Priority</th>
                        <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 w-[110px]">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {displayCases.map((tc) => (
                        <tr key={tc.id} className="group/row hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-5 py-3.5">
                            <span className="font-mono text-xs font-bold text-slate-400">{tc.tcId}</span>
                          </td>
                          <td className="px-3 py-3.5 max-w-[320px]">
                            <p className="truncate font-semibold text-slate-800 dark:text-slate-200">{tc.caseName}</p>
                            {tc.actualResult && (
                              <p className="truncate text-[11px] text-slate-400 mt-0.5">{tc.actualResult}</p>
                            )}
                          </td>
                          <td className="px-3 py-3.5 hidden md:table-cell">
                            <span className="text-xs text-slate-500">{tc.typeCase || "—"}</span>
                          </td>
                          <td className="px-3 py-3.5 hidden lg:table-cell">
                            <div className="flex items-center gap-1.5">
                              <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", PRIORITY_DOT[tc.priority] ?? "bg-slate-300")} />
                              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">{tc.priority || "—"}</span>
                            </div>
                          </td>
                          <td className="px-3 py-3.5">
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
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
