"use client";

import { useEffect, useMemo, useState, useCallback, useRef, type ReactNode } from"react";
import { getFieldIcons } from"@/components/module-workspace-utils";
import { PageShell } from"@/components/page-shell";
import { Badge } from"@/components/badge";
import { cn, formatDate, formatDisplayText } from"@/lib/utils";
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
 CaretLeft,
 CaretRight,
} from"@phosphor-icons/react";
import {
 BarChart,
 Bar,
 XAxis,
 YAxis,
 Tooltip,
 Cell,
 CartesianGrid,
} from"recharts";
import { ResponsiveContainer } from"@/components/responsive-container";

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
 critical:"#dc2626",
 high:"#f97316",
 medium:"#facc15",
 low:"#0ea5e9",
 p0:"#dc2626",
 p1:"#f97316",
 p2:"#facc15",
 p3:"#0ea5e9",
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
 <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white", color ??"bg-slate-400")}>
 {icon}
 </div>
 <div className="min-w-0">
 <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">{label}</p>
 <p className="text-2xl font-black leading-tight text-slate-900">{value}</p>
 {sub && <p className="mt-0.5 text-[11px] font-medium text-slate-400">{sub}</p>}
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
 <div className="flex items-start justify-between gap-3 border-b border-slate-200/70 px-5 py-4">
 <div>
 <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">{title}</p>
 {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
 </div>
 {actions}
 </div>
 <div className="p-5">{children}</div>
 </section>
 );
}

function TrendIcon({ direction }: { direction:"up" |"down" |"flat" }) {
 if (direction ==="up") return <ArrowUp size={13} weight="bold" />;
 if (direction ==="down") return <ArrowDown size={13} weight="bold" />;
 return <Minus size={13} weight="bold" />;
}

function getMonday(d: Date): Date {
 const date = new Date(d);
 const day = date.getDay();
 const diff = date.getDate() - day + (day === 0 ? -6 : 1);
 date.setDate(diff);
 date.setHours(0, 0, 0, 0);
 return date;
}

function toDateStr(d: Date): string {
 return d.toISOString().split("T")[0];
}

function getSunday(monday: Date): Date {
 const d = new Date(monday);
 d.setDate(d.getDate() + 6);
 return d;
}

export default function WeeklyReportPage() {
 const [report, setReport] = useState<WeeklyReportData | null>(null);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
 const [calOpen, setCalOpen] = useState(false);
 const [calMonth, setCalMonth] = useState(() => new Date());
 const [rangeFrom, setRangeFrom] = useState<Date | null>(null);
 const [rangeTo, setRangeTo] = useState<Date | null>(null);
 const [rangeError, setRangeError] = useState<string | null>(null);
 type DetailModal = { type: string; module: string; id: number; fields: Array<{ label: string; value: string; icon?: string }> } | null;
 const [detailModal, setDetailModal] = useState<DetailModal>(null);
 const fieldIcons = useMemo(() => getFieldIcons(), []);
 const calRef = useRef<HTMLDivElement>(null);

 const [customEnd, setCustomEnd] = useState(() => getSunday(getMonday(new Date())));
 const weekEnd = customEnd;
 const isCurrentWeek = useMemo(() => toDateStr(weekStart) === toDateStr(getMonday(new Date())) && toDateStr(customEnd) === toDateStr(getSunday(getMonday(new Date()))), [weekStart, customEnd]);

 const fetchReport = useCallback((from: Date, to: Date) => {
 setLoading(true);
 setError(null);
 fetch(`/api/weekly-report?from=${toDateStr(from)}&to=${toDateStr(to)}`)
 .then(async (response) => {
 const payload = await response.json();
 if (!response.ok) throw new Error(payload?.error ||"Failed to load report");
 setReport(payload);
 })
 .catch((err) => {
 setError(err instanceof Error ? err.message :"Failed to load report");
 })
 .finally(() => setLoading(false));
 }, []);

 useEffect(() => { fetchReport(weekStart, customEnd); }, [weekStart, customEnd, fetchReport]);

 useEffect(() => {
 const handler = (e: MouseEvent) => {
 if (calRef.current && !calRef.current.contains(e.target as Node)) {
 setCalOpen(false);
 setRangeFrom(null);
 setRangeTo(null);
 setRangeError(null);
 }
 };
 document.addEventListener("mousedown", handler);
 return () => document.removeEventListener("mousedown", handler);
 }, []);

 const goWeek = (dir: -1 | 1) => {
 setWeekStart((prev) => {
 const d = new Date(prev);
 d.setDate(d.getDate() + dir * 7);
 const newStart = d;
 const newEnd = getSunday(newStart);
 setCustomEnd(newEnd);
 return newStart;
 });
 };

 const pickDate = (d: Date) => {
 setRangeError(null);
 if (!rangeFrom || (rangeFrom && rangeTo)) {
 setRangeFrom(d);
 setRangeTo(null);
 } else {
 const start = d < rangeFrom ? d : rangeFrom;
 const end = d < rangeFrom ? rangeFrom : d;
 setRangeFrom(start);
 setRangeTo(end);
 }
 };

 const applyRange = () => {
 if (!rangeFrom || !rangeTo) return;
 setWeekStart(rangeFrom);
 setCustomEnd(rangeTo);
 setRangeFrom(null);
 setRangeTo(null);
 setCalOpen(false);
 };

 const calDays = useMemo(() => {
 const year = calMonth.getFullYear();
 const month = calMonth.getMonth();
 const daysInMonth = new Date(year, month + 1, 0).getDate();
 const firstDay = new Date(year, month, 1).getDay();
 const days: (Date | null)[] = [];
 for (let i = 0; i < firstDay; i++) days.push(null);
 for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
 return days;
 }, [calMonth]);

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
 const key = session.date ||"Unknown";
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
 name: item.assignee || item.name ||"-",
 count: Number(item.count ?? 0),
 }))
 .filter((item) => item.count > 0)
 .slice(0, 5);
 }, [report]);

 const actionItems = useMemo(() => {
 if (!report) return [];
 const items: Array<{ title: string; detail: string; tone:"danger" |"warning" |"info" }> = [];
 if (report.summary.passRate !== null && report.summary.passRate < 80) {
 items.push({
 title:"Review execution failures",
 detail:`This week's pass rate is ${report.summary.passRate}%, which is below the target threshold.`,
 tone:"danger",
 });
 }
 if (report.summary.openBugs > 0) {
 items.push({
 title:"Triage open bugs",
 detail:`${report.summary.openBugs} bug${report.summary.openBugs === 1 ?"" :"s"} still open and need to be prioritized.`,
 tone:"warning",
 });
 }
 if (report.summary.openTasks > 0) {
 items.push({
 title:"Clear task backlog",
 detail:`${report.summary.openTasks} task${report.summary.openTasks === 1 ?"" :"s"} pending completion.`,
 tone:"info",
 });
 }
 if (!items.length) {
 items.push({
 title:"Weekly status is stable",
 detail:"No critical issues to escalate this period.",
 tone:"info",
 });
 }
 return items;
 }, [report]);

 const reportMood = useMemo(() => {
 if (!report) return null;
 if (report.summary.passRate === null) return { label:"No execution data", tone:"flat" as const };
 if (report.summary.passRate >= 85) return { label:"Healthy week", tone:"up" as const };
 if (report.summary.passRate >= 70) return { label:"Needs attention", tone:"flat" as const };
 return { label:"At risk", tone:"down" as const };
 }, [report]);

 if (loading) {
 return (
 <PageShell icon={<TrendUp size={22} weight="bold" />} title="Report" description="Track bugs, tasks, sessions, and sprint activity for the selected period." crumbs={[{ label:"Dashboard", href:"/dashboard" }, { label:"Report" }]}>
 <div className="space-y-4 animate-pulse">
 <div className="h-24 rounded-2xl bg-slate-100" />
 <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
 {[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-slate-100" />)}
 </div>
 <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
 <div className="h-80 rounded-2xl bg-slate-100" />
 <div className="h-80 rounded-2xl bg-slate-100" />
 </div>
 </div>
 </PageShell>
 );
 }

 if (error || !report) {
 return (
 <PageShell icon={<TrendUp size={22} weight="bold" />} title="Report" description="Track bugs, tasks, sessions, and sprint activity for the selected period." crumbs={[{ label:"Dashboard", href:"/dashboard" }, { label:"Report" }]}>
 <div className="glass-card p-8">
 <p className="text-sm font-semibold text-slate-900">Failed to load report.</p>
 <p className="mt-1 text-sm text-slate-500">{error ??"No data available."}</p>
 </div>
 </PageShell>
 );
 }

 const { summary, newBugs, newTasks, activeSprints, recentActivity } = report;
 const passRateTone = summary.passRate !== null
 ? summary.passRate >= 85
 ?"bg-emerald-600"
 : summary.passRate >= 70
 ?"bg-amber-500"
 :"bg-rose-600"
 :"bg-slate-400";
 const insightLine = summary.passRate === null
 ?"No test sessions recorded this period."
 :`${summary.sessions} session${summary.sessions === 1 ?"" :"s"} this period — pass rate ${summary.passRate}%.`;

 return (
 <PageShell
 icon={<TrendUp size={22} weight="bold" />}
 title="Report"
 description="Track bugs, tasks, sessions, and sprint activity for the selected period."
 crumbs={[{ label:"Dashboard", href:"/dashboard" }, { label:"Report" }]}
 actions={
 <button
 onClick={() => window.print()}
 className="flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 transition hover:bg-slate-50 print:hidden"
 >
 <Printer size={15} weight="bold" />
 Print / PDF
 </button>
 }
 >
 <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500 print:justify-between">
 <div className="relative flex items-center gap-1 print:hidden" ref={calRef}>
 <button
 onClick={() => goWeek(-1)}
 className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
 >
 <CaretLeft size={14} weight="bold" />
 </button>
 <button
 onClick={() => { setCalMonth(new Date(weekStart)); setCalOpen(!calOpen); }}
 className="flex h-8 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 transition hover:bg-blue-50 hover:text-blue-600"
 >
 <CalendarBlank size={14} weight="bold" />
 {formatDate(toDateStr(weekStart))} — {formatDate(toDateStr(weekEnd))}
 </button>
 <button
 onClick={() => goWeek(1)}
 className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
 >
 <CaretRight size={14} weight="bold" />
 </button>
 {!isCurrentWeek && (
 <button
 onClick={() => { const m = getMonday(new Date()); setWeekStart(m); setCustomEnd(getSunday(m)); }}
 className="ml-1 flex h-8 items-center rounded-lg bg-blue-100 px-2.5 text-[11px] font-black uppercase tracking-wider text-blue-700 transition hover:bg-blue-200"
 >
 This period
 </button>
 )}

 {calOpen && (
 <div className="absolute left-0 top-10 z-50 w-72 rounded-xl border border-slate-200 bg-white p-4 shadow-xl animate-in fade-in zoom-in-95 duration-200">
 <div className="mb-2 text-center text-[11px] font-bold text-slate-400">
 {!rangeFrom ?"Pilih tanggal awal" : !rangeTo ?"Pilih tanggal akhir" :`${formatDate(toDateStr(rangeFrom))} — ${formatDate(toDateStr(rangeTo))}`}
 </div>
 <div className="mb-3 flex items-center justify-between">
 <button
 type="button"
 onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() - 1, 1))}
 className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100"
 >
 <CaretLeft size={14} weight="bold" />
 </button>
 <span className="text-xs font-bold text-slate-700">
 {calMonth.toLocaleDateString("en-US", { month:"long", year:"numeric" })}
 </span>
 <button
 type="button"
 onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 1))}
 className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100"
 >
 <CaretRight size={14} weight="bold" />
 </button>
 </div>
 <div className="mb-1 grid grid-cols-7 gap-1 text-center">
 {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
 <div key={d} className="text-[11px] font-bold uppercase text-slate-400">{d}</div>
 ))}
 </div>
 <div className="grid grid-cols-7 gap-1">
 {calDays.map((day, idx) => {
 if (!day) return <div key={`e-${idx}`} className="h-7" />;
 const ds = toDateStr(day);
 const isRangeStart = rangeFrom && ds === toDateStr(rangeFrom);
 const isRangeEnd = rangeTo && ds === toDateStr(rangeTo);
 const inPickedRange = rangeFrom && rangeTo && ds >= toDateStr(rangeFrom) && ds <= toDateStr(rangeTo);
 const inCurrentRange = !rangeFrom && ds >= toDateStr(weekStart) && ds <= toDateStr(weekEnd);
 const isToday = day.toDateString() === new Date().toDateString();
 return (
 <button
 key={idx}
 type="button"
 onClick={() => pickDate(day)}
 className={cn(
"flex h-7 w-full items-center justify-center text-xs font-semibold transition hover:bg-blue-100",
 (isRangeStart || isRangeEnd) ?"rounded-md bg-blue-700 text-white ring-2 ring-blue-300" :
 inPickedRange ?"bg-blue-500 text-white" :
 inCurrentRange ?"rounded-md bg-blue-600 text-white hover:bg-blue-700" :
"rounded-md text-slate-700",
 isRangeStart &&"rounded-l-md rounded-r-none",
 isRangeEnd &&"rounded-r-md rounded-l-none",
 inPickedRange && !isRangeStart && !isRangeEnd &&"rounded-none",
 isToday && !inCurrentRange && !inPickedRange && !isRangeStart &&"font-black text-blue-600 bg-blue-50"
 )}
 >
 {day.getDate()}
 </button>
 );
 })}
 </div>
 {rangeFrom && rangeTo && (
 <button
 type="button"
 onClick={applyRange}
 className="mt-3 flex h-9 w-full items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white transition hover:bg-blue-500"
 >
 Terapkan Filter
 </button>
 )}
 </div>
 )}
 </div>

 <div className="hidden print:flex items-center gap-2">
 <CalendarBlank size={13} weight="bold" />
 Period: <span className="font-bold text-slate-700">{formatDate(toDateStr(weekStart))}</span> — <span className="font-bold text-slate-700">{formatDate(toDateStr(weekEnd))}</span>
 </div>

 <span className={cn("ml-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-black uppercase tracking-widest text-white", passRateTone)}>
 <TrendIcon direction={reportMood?.tone ??"flat"} />
 {reportMood?.label}
 </span>
 </div>

 <div className="mb-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
 <StatCard icon={<Bug size={18} weight="bold" />} label="New Bugs" value={summary.newBugs} sub={`${summary.closedBugs} closed this period`} color="bg-red-600" />
 <StatCard icon={<CheckCircle size={18} weight="bold" />} label="Tasks Done" value={summary.doneTasks} sub={`${summary.newTasks} new, ${summary.openTasks} open`} color="bg-emerald-600" />
 <StatCard icon={<ClipboardText size={18} weight="bold" />} label="Test Sessions" value={summary.sessions} sub={`${summary.testCasesRun} cases run`} color="bg-blue-600" />
 <StatCard
 icon={<TrendUp size={18} weight="bold" />}
 label="Pass Rate"
 value={summary.passRate !== null ?`${summary.passRate}%` :"—"}
 sub={insightLine}
 color={passRateTone}
 />
 </div>

 <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
 <Panel title="Execution Trend" subtitle="Passed / failed / blocked from this period's execution items.">
 {sessionTrendData.length > 0 ? (
 <ResponsiveContainer width="100%" height={280} minWidth={1} minHeight={1}>
 <BarChart data={sessionTrendData} margin={{ left: -12, right: 8, top: 8 }}>
 <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" vertical={false} />
 <XAxis dataKey="date" tick={{ fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
 <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={24} />
 <Tooltip contentStyle={{ fontSize: 11, borderRadius: 10, border:"1px solid rgba(148,163,184,0.2)" }} />
 <Bar dataKey="passed" stackId="sessions" radius={[4, 4, 0, 0]} fill="#16a34a" />
 <Bar dataKey="failed" stackId="sessions" fill="#dc2626" />
 <Bar dataKey="blocked" stackId="sessions" radius={[0, 0, 4, 4]} fill="#f59e0b" />
 </BarChart>
 </ResponsiveContainer>
 ) : (
 <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-sm text-slate-500">
 No execution data this period.
 </div>
 )}
 </Panel>

 <Panel title="Focus Area" subtitle="Priority items to close out this period.">
 <div className="space-y-3">
 {actionItems.map((item, idx) => (
 <div
 key={`${item.title}-${idx}`}
 className={cn(
"rounded-2xl border p-4",
 item.tone ==="danger" &&"border-rose-200 bg-rose-50",
 item.tone ==="warning" &&"border-amber-200 bg-amber-50",
 item.tone ==="info" &&"border-sky-200 bg-sky-50",
 )}
 >
 <div className="flex items-start gap-3">
 <div className={cn("mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl text-white", item.tone ==="danger" ?"bg-rose-600" : item.tone ==="warning" ?"bg-amber-600" :"bg-sky-600")}>
 <WarningCircle size={16} weight="bold" />
 </div>
 <div className="min-w-0">
 <p className="text-sm font-bold text-slate-900">{item.title}</p>
 <p className="mt-0.5 text-xs text-slate-600">{item.detail}</p>
 </div>
 </div>
 </div>
 ))}

 <div className="grid grid-cols-2 gap-3 pt-1">
 <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4">
 <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Open Bugs</p>
 <p className="mt-2 text-2xl font-black text-slate-900">{summary.openBugs}</p>
 </div>
 <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4">
 <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Open Tasks</p>
 <p className="mt-2 text-2xl font-black text-slate-900">{summary.openTasks}</p>
 </div>
 </div>
 </div>
 </Panel>
 </div>

 <div className="mt-4 grid gap-4 xl:grid-cols-2">
 <Panel title="Bug Severity" subtitle="Bug distribution by severity level.">
 {severityChartData.length > 0 ? (
 <ResponsiveContainer width="100%" height={240} minWidth={1} minHeight={1}>
 <BarChart data={severityChartData} margin={{ left: -10, right: 4, top: 8 }}>
 <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" vertical={false} />
 <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
 <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={24} />
 <Tooltip contentStyle={{ fontSize: 11, borderRadius: 10, border:"1px solid rgba(148,163,184,0.2)" }} />
 <Bar dataKey="count" radius={[6, 6, 0, 0]}>
 {severityChartData.map((entry) => (
 <Cell key={entry.name} fill={SEVERITY_COLORS[entry.name.toLowerCase()] ??"#94a3b8"} />
 ))}
 </Bar>
 </BarChart>
 </ResponsiveContainer>
 ) : (
 <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-sm text-slate-500">
 No severity data.
 </div>
 )}
 </Panel>

 <Panel title="Bugs by Test Plans" subtitle="Test plans with the most bugs this period.">
 {projectChartData.length > 0 ? (
 <ResponsiveContainer width="100%" height={240} minWidth={1} minHeight={1}>
 <BarChart data={projectChartData} layout="vertical" margin={{ top: 8, right: 16, left: 10 }}>
 <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" horizontal={false} />
 <XAxis type="number" tick={{ fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
 <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
 <Tooltip contentStyle={{ fontSize: 11, borderRadius: 10, border:"1px solid rgba(148,163,184,0.2)" }} />
 <Bar dataKey="count" radius={[0, 6, 6, 0]} fill="#2563eb" />
 </BarChart>
 </ResponsiveContainer>
 ) : (
 <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-sm text-slate-500">
 No test plan data.
 </div>
 )}
 </Panel>
 </div>

 <div className="mt-4 grid gap-4 xl:grid-cols-[0.75fr_0.75fr_0.5fr]">
 <Panel title="New Bugs" subtitle="Bugs reported this period.">
 <div className="max-h-[340px] space-y-2 overflow-y-auto pr-1">
 {(newBugs as WeeklyReportData["newBugs"]).map((bug) => (
 <button key={bug.id} type="button" onClick={() => setDetailModal({ type:"Bug", module:"bugs", id: bug.id, fields: [{ label:"Code", value: bug.code, icon:"title" }, { label:"Title", value: bug.title, icon:"title" }, { label:"Project", value: bug.project, icon:"project" }, { label:"Status", value: formatDisplayText(bug.status), icon:"status" }, { label:"Priority", value: formatDisplayText(bug.priority), icon:"priority" }, { label:"Severity", value: formatDisplayText(bug.severity), icon:"severity" }] })} className="w-full text-left rounded-2xl border border-slate-200/70 p-3 transition hover:border-blue-200 hover:bg-blue-50/40">
 <div className="flex items-start justify-between gap-2">
 <div className="min-w-0">
 <p className="truncate text-xs font-bold text-slate-900">{bug.code} · {bug.title}</p>
 <p className="mt-0.5 truncate text-[11px] text-slate-400">{bug.project} · {formatDisplayText(bug.priority)}</p>
 </div>
 <Badge value={bug.status} />
 </div>
 </button>
 ))}
 </div>
 </Panel>

 <Panel title="New Tasks" subtitle="Tasks created this period.">
 <div className="max-h-[340px] space-y-2 overflow-y-auto pr-1">
 {(newTasks as WeeklyReportData["newTasks"]).map((task) => (
 <button key={task.id} type="button" onClick={() => setDetailModal({ type:"Task", module:"tasks", id: task.id, fields: [{ label:"Code", value: task.code, icon:"title" }, { label:"Title", value: task.title, icon:"title" }, { label:"Project", value: task.project, icon:"project" }, { label:"Status", value: formatDisplayText(task.status), icon:"status" }, { label:"Priority", value: formatDisplayText(task.priority), icon:"priority" }] })} className="w-full text-left rounded-2xl border border-slate-200/70 p-3 transition hover:border-blue-200 hover:bg-blue-50/40">
 <div className="flex items-start justify-between gap-2">
 <div className="min-w-0">
 <p className="truncate text-xs font-bold text-slate-900">{task.code} · {task.title}</p>
 <p className="mt-0.5 truncate text-[11px] text-slate-400">{task.project} · {formatDisplayText(task.priority)}</p>
 </div>
 <Badge value={task.status} />
 </div>
 </button>
 ))}
 </div>
 </Panel>

 <Panel title="Top Assignees" subtitle="Most active contributors this period.">
 <div className="max-h-[340px] space-y-2 overflow-y-auto pr-1">
 {assigneeLoad.length > 0 ? assigneeLoad.map((person, idx) => (
 <button key={`${person.name}-${idx}`} type="button" onClick={() => setDetailModal({ type:"Assignee", module:"reports/workload", id: 0, fields: [{ label:"Name", value: person.name, icon:"title" }, { label:"Rank", value:`#${idx + 1}`, icon:"status" }, { label:"Active Items", value: String(person.count), icon:"progressSummary" }] })} className="w-full flex items-center justify-between rounded-2xl border border-slate-200/70 px-3 py-2 transition hover:border-blue-200 hover:bg-blue-50/40">
 <div className="flex items-center gap-2 min-w-0">
 <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-xs font-black text-slate-500">
 {idx + 1}
 </div>
 <p className="truncate text-xs font-bold text-slate-800">{person.name}</p>
 </div>
 <span className="text-xs font-black text-slate-500">{person.count}</span>
 </button>
 )) : (
 <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
 No assignee data.
 </div>
 )}
 </div>
 </Panel>
 </div>

 <div className="mt-4 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
 <Panel
 title="Active Sprints"
 subtitle="Currently active sprints."
 actions={<span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-black uppercase tracking-widest text-amber-600">{activeSprints.length} items</span>}
 >
 <div className="max-h-[300px] space-y-2 overflow-y-auto pr-1">
 {(activeSprints as WeeklyReportData["activeSprints"]).map((sprint) => (
 <button key={sprint.id} type="button" onClick={() => setDetailModal({ type:"Sprint", module:"sprints", id: sprint.id, fields: [{ label:"Name", value: sprint.name, icon:"title" }, { label:"Status", value: formatDisplayText(sprint.status), icon:"status" }, { label:"Goal", value: sprint.goal ||"-", icon:"description" }, { label:"Start Date", value: formatDate(sprint.startDate), icon:"date" }, { label:"End Date", value: formatDate(sprint.endDate), icon:"dueDate" }] })} className="w-full text-left rounded-2xl border border-slate-200/70 p-3 transition hover:border-blue-200 hover:bg-blue-50/40">
 <div className="flex items-start justify-between gap-2">
 <div className="min-w-0">
 <p className="truncate text-xs font-bold text-slate-900">{sprint.name}</p>
 {sprint.goal && <p className="mt-0.5 truncate text-[11px] text-slate-400">{sprint.goal}</p>}
 </div>
 <Badge value={sprint.status} />
 </div>
 <p className="mt-2 flex items-center gap-1 text-[11px] font-medium text-slate-400">
 <Clock size={11} weight="bold" />
 {formatDate(sprint.startDate)} – {formatDate(sprint.endDate)}
 </p>
 </button>
 ))}
 </div>
 </Panel>

 <Panel title={`Recent Activity (${recentActivity.length})`} subtitle="Latest activity recorded in the system.">
 <div className="max-h-80 space-y-1.5 overflow-y-auto pr-1">
 {(recentActivity as WeeklyReportData["recentActivity"]).map((activity, idx) => (
 <div key={`${activity.createdAt}-${idx}`} className="flex items-start gap-2 rounded-2xl border border-slate-200/70 px-3 py-2">
 <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-slate-100 text-[10px] font-black uppercase text-slate-500">
 {activity.entityType?.[0] ??"?"}
 </span>
 <div className="min-w-0 flex-1">
 <p className="text-xs font-medium leading-snug text-slate-700">{activity.summary}</p>
 <p className="mt-0.5 text-[11px] uppercase tracking-widest text-slate-400">{formatDisplayText(activity.entityType)} · {formatDisplayText(activity.action)}</p>
 </div>
 </div>
 ))}
 </div>
 </Panel>
 </div>

 {detailModal && (
 <div
 className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 backdrop-blur-sm animate-in fade-in duration-200 sm:items-center"
 onMouseDown={(e) => { if (e.target === e.currentTarget) setDetailModal(null); }}
 >
 <div className="relative flex max-h-[85vh] w-full max-w-xl flex-col rounded-2xl bg-white shadow-2xl animate-in slide-in-from-bottom-4 duration-300 sm:slide-in-from-bottom-0">
 <div className="flex items-center justify-between border-b border-slate-200/60 px-4 py-3">
 <div>
 <p className="text-[10px] font-black uppercase tracking-widest text-blue-500">{detailModal.type}</p>
 <h2 className="text-sm font-black text-slate-900">
 {detailModal.fields.find(f => f.label ==="Title")?.value || detailModal.fields.find(f => f.label ==="Name")?.value ||"Detail"}
 </h2>
 {detailModal.fields.find(f => f.label ==="Code") && (
 <p className="text-[11px] font-semibold text-slate-400">{detailModal.fields.find(f => f.label ==="Code")?.value}</p>
 )}
 </div>
 <button onClick={() => setDetailModal(null)} className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">×</button>
 </div>
 <div className="flex-1 overflow-y-auto px-4 py-4">
 <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
 {detailModal.fields.filter(f => f.label !=="Code").map((f) => {
 const isLong = f.label ==="Title" || f.label ==="Goal" || f.label ==="Name";
 const icon = f.icon ? fieldIcons[f.icon] : null;
 return (
 <div key={f.label} className={cn("rounded-xl bg-slate-50 px-3 py-2", isLong &&"sm:col-span-2")}>
 <div className="mb-1 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
 {icon}
 {f.label}
 </div>
 <p className="whitespace-pre-wrap text-xs font-semibold text-slate-800">{f.value ||"-"}</p>
 </div>
 );
 })}
 </div>
 </div>
 <div className="flex items-center justify-end gap-2 border-t border-slate-200/60 px-4 py-3">
 {detailModal.id > 0 && (
 <button
 onClick={() => {
 if (typeof window ==="undefined") return;
 setDetailModal(null);
 window.location.href =`/${detailModal.module}?edit=${detailModal.id}`;
 }}
 className="h-8 rounded-lg bg-blue-600 px-4 text-xs font-bold text-white transition-all duration-300 hover:bg-blue-500 hover:-translate-y-0.5 hover:shadow-md"
 >
 Edit
 </button>
 )}
 <button onClick={() => setDetailModal(null)} className="h-8 rounded-lg bg-rose-600 px-4 text-xs font-bold text-white transition-all duration-300 hover:bg-rose-500 hover:-translate-y-0.5 hover:shadow-md">Close</button>
 </div>
 </div>
 </div>
 )}
 </PageShell>
 );
}
