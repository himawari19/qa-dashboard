"use client";

import { useEffect, useMemo, useRef, useState } from"react";
import Link from"next/link";
import { cn, formatDisplayText } from"@/lib/utils";
import { Badge } from"@/components/badge";
import {
 CheckCircle,
 XCircle,
 Warning,
 Clock,
 Checks,
 DotsThreeVertical,
 PencilSimple,
 Table,
} from"@phosphor-icons/react";

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
 Passed:"text-emerald-600 bg-emerald-50 border-emerald-200",
 Failed:"text-rose-600 bg-rose-50 border-rose-200",
 Blocked:"text-amber-600 bg-amber-50 border-amber-200",
 Pending:"text-slate-500 bg-slate-50 border-slate-200",
};

const STATUS_ICON: Record<string, React.ReactNode> = {
 Passed: <CheckCircle size={12} weight="fill" className="text-emerald-500" />,
 Failed: <XCircle size={12} weight="fill" className="text-rose-500" />,
 Blocked: <Warning size={12} weight="fill" className="text-amber-500" />,
 Pending: <Clock size={12} weight="fill" className="text-slate-400" />,
};

const PRIORITY_DOT: Record<string, string> = {
 High:"bg-rose-500",
 Medium:"bg-amber-400",
 Low:"bg-slate-300",
};

function getCaseSortValue(value: string) {
 const match = String(value ??"").match(/(\d+)/);
 return match ? Number.parseInt(match[1] ??"0", 10) : Number.MAX_SAFE_INTEGER;
}

function compareTestCases(a: TestCase, b: TestCase) {
 const aValue = getCaseSortValue(a.tcId);
 const bValue = getCaseSortValue(b.tcId);
 if (aValue !== bValue) return aValue - bValue;
 return String(a.tcId ??"").localeCompare(String(b.tcId ??""), undefined, { numeric: true, sensitivity:"base" });
}

function compareSuiteGroups(a: SuiteGroup, b: SuiteGroup) {
 const aCase = a.cases[0];
 const bCase = b.cases[0];
 if (!aCase && !bCase) return a.suiteTitle.localeCompare(b.suiteTitle);
 if (!aCase) return 1;
 if (!bCase) return -1;
 return compareTestCases(aCase, bCase) || a.suiteTitle.localeCompare(b.suiteTitle);
}

const ALL ="All";
const STATUS_FILTERS = [ALL,"Passed","Failed","Blocked","Pending"] as const;

export function TestCaseLibrary({ cases, initialSearch ="" }: { cases: TestCase[]; initialSearch?: string }) {
 const [search, setSearch] = useState(initialSearch);
 const [filterStatus, setFilterStatus] = useState(ALL);
 const [filterAssignee, setFilterAssignee] = useState(ALL);
 const [selectedKey, setSelectedKey] = useState<string | null>(null);
 const [isMenuOpen, setIsMenuOpen] = useState(false);
 const menuRef = useRef<HTMLDivElement | null>(null);

 const groups = useMemo<SuiteGroup[]>(() => {
 const map = new Map<string, SuiteGroup>();
 cases.forEach((c) => {
 const key = String(c.testSuiteId ??"unassigned");
 if (!map.has(key)) {
 map.set(key, {
 key,
 suiteTitle: c.suiteTitle ||"Unassigned Suite",
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
 if (s ==="Passed") g.passed++;
 else if (s ==="Failed") g.failed++;
 else if (s ==="Blocked") g.blocked++;
 else g.pending++;
 });
 return Array.from(map.values())
 .map((group) => ({ ...group, cases: [...group.cases].sort(compareTestCases) }))
 .sort(compareSuiteGroups);
 }, [cases]);

 const filteredGroups = useMemo(() => {
 return groups
 .map((g) => {
 let filteredCases = g.cases;
 if (filterStatus !== ALL) filteredCases = filteredCases.filter((c) => c.status === filterStatus);
 if (filterAssignee !== ALL) {
 filteredCases = filteredCases.filter((c) => (c.assignee || g.suiteAssignee ||"Unassigned") === filterAssignee);
 }
 if (search) {
 const q = search.toLowerCase();
 filteredCases = filteredCases.filter(
 (c) =>
 c.caseName?.toLowerCase().includes(q) ||
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
 const suiteAssignee = String(c.suiteAssignee ??"").trim();
 const assignee = String(c.assignee ??"").trim();
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

 useEffect(() => {
 setIsMenuOpen(false);
 }, [selected?.key]);

 useEffect(() => {
 if (!isMenuOpen) return;
 const handlePointerDown = (event: PointerEvent) => {
 const target = event.target as Node | null;
 if (target && menuRef.current?.contains(target)) return;
 setIsMenuOpen(false);
 };
 const handleEscape = (event: KeyboardEvent) => {
 if (event.key ==="Escape") setIsMenuOpen(false);
 };
 document.addEventListener("pointerdown", handlePointerDown);
 document.addEventListener("keydown", handleEscape);
 return () => {
 document.removeEventListener("pointerdown", handlePointerDown);
 document.removeEventListener("keydown", handleEscape);
 };
 }, [isMenuOpen]);

 return (
 <div className="space-y-3 pb-6">
 <div>
 <div className="flex flex-col gap-4 lg:h-[calc(100vh-310px)] lg:min-h-[500px] lg:flex-row">
 <div className="flex max-h-[320px] w-full shrink-0 flex-col gap-1 overflow-y-auto border-b border-slate-200/70 bg-transparent p-3 lg:h-full lg:max-h-none lg:w-[360px] lg:border-b-0 lg:border-r">
 {filteredGroups.length === 0 ? (
 <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-slate-400">
 <Checks size={32} weight="bold" />
 <p className="text-xs font-semibold">No suites found</p>
 </div>
 ) : (
 filteredGroups.map((group) => {
 const isActive = (selectedKey ?? filteredGroups[0]?.key) === group.key;
 const displayCount = filterStatus !== ALL || search || filterAssignee !== ALL ? group.filteredCases.length : group.cases.length;
 return (
 <button
 key={group.key}
 type="button"
 onClick={() => setSelectedKey(group.key)}
 className={cn(
"w-full rounded-lg px-4 py-4 text-left transition-all",
 isActive ?"bg-blue-600 text-white shadow-sm shadow-blue-500/20" :"hover:bg-slate-50",
 )}
 >
 <div className="flex items-start justify-between gap-3">
 <div className="min-w-0 flex-1">
 {group.planProject && (
 <p className={cn("mb-0.5 truncate text-[10px] font-bold uppercase tracking-widest", isActive ?"text-blue-200" :"text-blue-500")}>
 {group.planProject}
 </p>
 )}
 <p className={cn("truncate text-sm font-bold leading-snug", isActive ?"text-white" :"text-slate-800")}>
 {group.suiteTitle}
 </p>
 <p className={cn("mt-0.5 truncate text-[11px] font-semibold", isActive ?"text-blue-200" :"text-slate-400")}>
 {group.planTitle ||"No plan"}
 </p>
 {group.suiteAssignee && (
 <p className={cn("mt-0.5 truncate text-[11px] font-semibold", isActive ?"text-blue-100" :"text-slate-500")}>
 {group.suiteAssignee}
 </p>
 )}
 </div>
 <span className={cn(
"mt-0.5 shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-black",
 isActive ?"bg-white/20 text-white" :"bg-slate-100 text-slate-500",
 )}>
 {displayCount}
 </span>
 </div>
 <div className={cn("mt-2 flex items-center gap-2.5 text-[11px] font-bold", isActive ?"text-blue-200" :"text-slate-400")}>
 <span className="flex items-center gap-1">
 <span className={cn("h-1.5 w-1.5 rounded-full", isActive ?"bg-emerald-300" :"bg-emerald-500")} />
 {group.passed}
 </span>
 <span className="flex items-center gap-1">
 <span className={cn("h-1.5 w-1.5 rounded-full", isActive ?"bg-rose-300" :"bg-rose-500")} />
 {group.failed}
 </span>
 <span className="flex items-center gap-1">
 <span className={cn("h-1.5 w-1.5 rounded-full", isActive ?"bg-amber-300" :"bg-amber-400")} />
 {group.blocked}
 </span>
 {group.cases.length > 0 && (
 <div className="ml-auto flex h-1 flex-1 max-w-[48px] overflow-hidden rounded-full bg-white/20">
 <div
 style={{ width:`${(group.passed / group.cases.length) * 100}%` }}
 className={cn("h-full transition-all", isActive ?"bg-emerald-300" :"bg-emerald-500")}
 />
 </div>
 )}
 </div>
 </button>
 );
 })
 )}
 </div>

 <div className="flex min-h-[520px] flex-1 flex-col overflow-hidden">
 {!selected ? (
 <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-400">
 <Table size={40} weight="bold" />
 <p className="text-sm font-semibold">Select a suite to view test cases</p>
 </div>
 ) : (
 <>
 <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-6 py-4">
 <div className="min-w-0">
 {selected.planProject && (
 <p className="mb-0.5 text-[11px] font-bold uppercase tracking-widest text-blue-500">
 {selected.planProject}{selected.planTitle ?` ? ${selected.planTitle}` :""}
 </p>
 )}
 <div className="flex items-center gap-2">
 <h2 className="truncate text-base font-bold text-slate-900">{selected.suiteTitle}</h2>
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
 {(selected.suiteToken || selected.key) && (
 <div ref={menuRef} className="relative">
 <button
 type="button"
 aria-label="Open test case menu"
 aria-expanded={isMenuOpen}
 aria-haspopup="menu"
 onClick={() => setIsMenuOpen((open) => !open)}
 className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition hover:bg-slate-50"
 >
 <DotsThreeVertical size={18} weight="bold" />
 </button>
 {isMenuOpen && (
 <div className="absolute right-0 top-11 z-20 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
 <Link href={`/test-cases/${selected.suiteToken || selected.key}`} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50" onClick={() => setIsMenuOpen(false)}>
 <PencilSimple size={16} weight="bold" />
 Edit Test Case
 </Link>
 </div>
 )}
 </div>
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
 {displayCases.map((testCase) => (
 <div key={testCase.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
 <div className="flex items-start justify-between gap-3">
 <div className="min-w-0">
 <h3 className="mt-1 truncate text-sm font-bold text-slate-900">{testCase.caseName}</h3>
 <p className="mt-1 text-xs text-slate-500">{testCase.assignee || selected.suiteAssignee ||"Unassigned"}</p>
 </div>
 <span className={cn("inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-bold", STATUS_PILL[testCase.status] ?? STATUS_PILL.Pending)}>
 {STATUS_ICON[testCase.status] ?? STATUS_ICON.Pending}
 {formatDisplayText(testCase.status ||"Pending")}
 </span>
 </div>
 <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
 <span className="rounded-full bg-slate-100 px-2 py-1">{formatDisplayText(testCase.typeCase)}</span>
 <span className="rounded-full bg-slate-100 px-2 py-1">{formatDisplayText(testCase.priority)}</span>
 </div>
 {testCase.actualResult && (
 <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-slate-500">{testCase.actualResult}</p>
 )}
 </div>
 ))}
 </div>

 <div className="hidden flex-1 overflow-y-auto md:block">
 <table className="w-full text-sm">
 <thead className="sticky top-0 z-10">
 <tr className="border-b border-slate-100 bg-slate-50">
 <th className="w-[72px] px-5 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-slate-400">#</th>
 <th className="px-3 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-slate-400">Case Name</th>
 <th className="hidden w-[160px] px-3 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-slate-400 md:table-cell">Assignee</th>
 <th className="hidden w-[120px] px-3 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-slate-400 md:table-cell">Type</th>
 <th className="hidden w-[90px] px-3 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-slate-400 lg:table-cell">Priority</th>
 <th className="w-[110px] px-3 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-slate-400">Status</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100">
 {displayCases.map((testCase, index) => (
 <tr key={testCase.id} className="group/row transition-colors hover:bg-slate-50/70">
 <td className="px-5 py-3.5 align-top">
 <span className="font-mono text-xs font-bold text-slate-400">{index + 1}</span>
 </td>
 <td className="max-w-[360px] px-3 py-3.5 align-top">
 <div className="space-y-1">
 <p className="truncate font-semibold text-slate-800">{testCase.caseName}</p>
 {testCase.actualResult && (
 <p className="mt-0 truncate text-xs text-slate-400">{testCase.actualResult}</p>
 )}
 </div>
 </td>
 <td className="hidden px-3 py-3.5 align-top md:table-cell">
 <span className="text-xs font-semibold text-slate-600">
 {testCase.assignee || selected.suiteAssignee ||"Unassigned"}
 </span>
 </td>
 <td className="hidden px-3 py-3.5 align-top md:table-cell">
 <span className="text-xs text-slate-500">{formatDisplayText(testCase.typeCase)}</span>
 </td>
 <td className="hidden px-3 py-3.5 align-top lg:table-cell">
 <div className="flex items-center gap-1.5">
 <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", PRIORITY_DOT[testCase.priority] ??"bg-slate-300")} />
 <span className="text-xs font-semibold text-slate-600">{formatDisplayText(testCase.priority)}</span>
 </div>
 </td>
 <td className="px-3 py-3.5 align-top">
 <span className={cn("inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-bold", STATUS_PILL[testCase.status] ?? STATUS_PILL.Pending)}>
 {STATUS_ICON[testCase.status] ?? STATUS_ICON.Pending}
 {formatDisplayText(testCase.status ||"Pending")}
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
