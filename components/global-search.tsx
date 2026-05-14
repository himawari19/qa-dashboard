"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState, useCallback, type KeyboardEvent as ReactKeyboardEvent } from"react";
import { createPortal } from"react-dom";
import { useRouter } from"next/navigation";
import { ArrowRight, ArrowSquareOut, Bug, CalendarBlank, CaretLeft, CaretRight, Checks, CircleNotch, ClipboardText, ClockCounterClockwise, CopySimple, Kanban, MagnifyingGlass, Note, PlayCircle, RocketLaunch, SlidersHorizontal, Table, User, X } from"@phosphor-icons/react";
import { cn, formatDisplayText } from"@/lib/utils";
import { HighlightText } from"@/components/highlight-text";
import { toast } from"@/components/ui/toast";

type SearchScope =
 |"all"
 |"tasks"
 |"bugs"
 |"test-plans"
 |"test-suites"
 |"test-cases"
 |"test-sessions"
 |"meeting-notes"
 |"sprints"
 |"assignees"
 |"users"
 |"deployments"
 |"activity";

type SearchResult = {
 id: string;
 code: string;
 label: string;
 sublabel: string;
 href: string;
 type: string;
 group: string;
 snippet: string;
 score: number;
 matchedField: string;
};

type SearchResponse = {
 results?: SearchResult[];
};

const SEARCH_SCOPES: Array<{ value: SearchScope; label: string }> = [
 { value:"all", label:"All" },
 { value:"test-plans", label:"Test Plans" },
 { value:"test-suites", label:"Test Suites" },
 { value:"test-cases", label:"Test Cases" },
 { value:"bugs", label:"Bugs" },
 { value:"tasks", label:"Tasks" },
 { value:"test-sessions", label:"Test Execution" },
 { value:"meeting-notes", label:"Meeting Notes" },
 { value:"sprints", label:"Sprints" },
 { value:"deployments", label:"Deployment Log" },
 { value:"assignees", label:"Assignees" },
 { value:"users", label:"Users" },
 { value:"activity", label:"Activity" },
];

const RECENTS_KEY ="qa-daily:global-search:recent";
const SCOPE_KEY ="qa-daily:global-search:scope";
const RECENT_LIMIT = 5;

const typeColors: Record<string, string> = {
 Tasks:"bg-amber-100 text-amber-700",
 Bugs:"bg-rose-100 text-rose-700",
 "Test Plans":"bg-indigo-100 text-indigo-700",
 "Test Suites":"bg-emerald-100 text-emerald-700",
 "Test Cases":"bg-sky-100 text-sky-700",
 "Test Execution":"bg-cyan-100 text-cyan-700",
 "Meeting Notes":"bg-violet-100 text-violet-700",
 Sprints:"bg-orange-100 text-orange-700",
 Assignees:"bg-slate-100 text-slate-700",
 Users:"bg-slate-100 text-slate-700",
 "Deployment Log":"bg-teal-100 text-teal-700",
 "Daily Log":"bg-slate-100 text-slate-600",
};

const typeIcons: Record<string, React.ReactNode> = {
 Tasks: <Kanban size={12} weight="bold" />,
 Bugs: <Bug size={12} weight="bold" />,
 "Test Plans": <ClipboardText size={12} weight="bold" />,
 "Test Suites": <Table size={12} weight="bold" />,
 "Test Cases": <Checks size={12} weight="bold" />,
 "Test Execution": <PlayCircle size={12} weight="bold" />,
 "Meeting Notes": <Note size={12} weight="bold" />,
 Sprints: <CalendarBlank size={12} weight="bold" />,
 Assignees: <User size={12} weight="bold" />,
 Users: <User size={12} weight="bold" />,
 "Deployment Log": <RocketLaunch size={12} weight="bold" />,
};

function ResultSkeleton() {
 return (
 <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
 {Array.from({ length: 3 }).map((_, i) => (
 <div key={i} className="flex items-start gap-3 border-b border-slate-100 px-3 py-2.5 last:border-b-0 animate-pulse">
 <div className="mt-0.5 flex shrink-0 flex-col gap-1.5">
 <div className="h-4 w-14 rounded-full bg-slate-200" />
 <div className="h-3 w-10 rounded bg-slate-100" />
 </div>
 <div className="flex-1 space-y-1.5 pt-0.5">
 <div className="h-4 w-3/4 rounded bg-slate-200" />
 <div className="h-3 w-1/2 rounded bg-slate-100" />
 </div>
 </div>
 ))}
 </div>
 );
}

const scopeColors: Record<SearchScope, { idle: string; active: string }> = {
 all: { idle:"border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700", active:"border-slate-400 bg-slate-100 text-slate-800" },
"test-plans": { idle:"border-indigo-200 bg-indigo-50 text-indigo-600 hover:border-indigo-300 hover:text-indigo-700", active:"border-indigo-400 bg-indigo-100 text-indigo-800" },
"test-suites": { idle:"border-emerald-200 bg-emerald-50 text-emerald-600 hover:border-emerald-300 hover:text-emerald-700", active:"border-emerald-400 bg-emerald-100 text-emerald-800" },
"test-cases": { idle:"border-sky-200 bg-sky-50 text-sky-600 hover:border-sky-300 hover:text-sky-700", active:"border-sky-400 bg-sky-100 text-sky-800" },
 bugs: { idle:"border-rose-200 bg-rose-50 text-rose-600 hover:border-rose-300 hover:text-rose-700", active:"border-rose-400 bg-rose-100 text-rose-800" },
 tasks: { idle:"border-amber-200 bg-amber-50 text-amber-600 hover:border-amber-300 hover:text-amber-700", active:"border-amber-400 bg-amber-100 text-amber-800" },
"test-sessions": { idle:"border-cyan-200 bg-cyan-50 text-cyan-600 hover:border-cyan-300 hover:text-cyan-700", active:"border-cyan-400 bg-cyan-100 text-cyan-800" },
"meeting-notes": { idle:"border-violet-200 bg-violet-50 text-violet-600 hover:border-violet-300 hover:text-violet-700", active:"border-violet-400 bg-violet-100 text-violet-800" },
 sprints: { idle:"border-orange-200 bg-orange-50 text-orange-600 hover:border-orange-300 hover:text-orange-700", active:"border-orange-400 bg-orange-100 text-orange-800" },
 deployments: { idle:"border-teal-200 bg-teal-50 text-teal-600 hover:border-teal-300 hover:text-teal-700", active:"border-teal-400 bg-teal-100 text-teal-800" },
 assignees: { idle:"border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:text-slate-700", active:"border-slate-400 bg-slate-100 text-slate-800" },
 users: { idle:"border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:text-slate-700", active:"border-slate-400 bg-slate-100 text-slate-800" },
 activity: { idle:"border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:text-slate-700", active:"border-slate-400 bg-slate-100 text-slate-800" },
};

function readStringArray(raw: string | null) {
 if (!raw) return [];
 try {
 const parsed = JSON.parse(raw);
 return Array.isArray(parsed) ? parsed.filter((item) => typeof item ==="string") : [];
 } catch {
 return [];
 }
}

function groupResults(results: SearchResult[]) {
 const grouped = new Map<string, SearchResult[]>();
 for (const result of results) {
 const list = grouped.get(result.group) ?? [];
 list.push(result);
 grouped.set(result.group, list);
 }
 return Array.from(grouped.entries()).map(([group, items]) => ({
 group,
 items: items.sort((a, b) => b.score - a.score || a.type.localeCompare(b.type) || a.label.localeCompare(b.label)),
 }));
}

export function GlobalSearch({
 triggerClassName,
 triggerLabel ="Search...",
 triggerShortcut ="⌘K",
 compactTrigger = false,
}: {
 triggerClassName?: string;
 triggerLabel?: string;
 triggerShortcut?: string;
 compactTrigger?: boolean;
}) {
 const [open, setOpen] = useState(false);
 const [query, setQuery] = useState("");
 const [scope, setScope] = useState<SearchScope>("all");
 const [status, setStatus] = useState("");
 const [assignee, setAssignee] = useState("");
 const [from, setFrom] = useState("");
 const [to, setTo] = useState("");
 const [showFilters, setShowFilters] = useState(false);
 const [results, setResults] = useState<SearchResult[]>([]);
 const [recentQueries, setRecentQueries] = useState<string[]>([]);
 const [loading, setLoading] = useState(false);
 const [mounted, setMounted] = useState(false);
 const [activeIndex, setActiveIndex] = useState(-1);
 const [draggingScopes, setDraggingScopes] = useState(false);
 const [scopeDragStartX, setScopeDragStartX] = useState(0);
 const [scopeDragStartScroll, setScopeDragStartScroll] = useState(0);
 const [scopeCanScrollLeft, setScopeCanScrollLeft] = useState(false);
 const [scopeCanScrollRight, setScopeCanScrollRight] = useState(false);
 const inputRef = useRef<HTMLInputElement>(null);
 const scopeRef = useRef<HTMLDivElement>(null);
 const resultsRef = useRef<HTMLDivElement>(null);
 const activeItemRef = useRef<HTMLDivElement>(null);
 const router = useRouter();
 const deferredQuery = useDeferredValue(query);

 useEffect(() => {
 setMounted(true);
 try {
 const storedScope = window.localStorage.getItem(SCOPE_KEY);
 if (storedScope && SEARCH_SCOPES.some((option) => option.value === storedScope)) {
 setScope(storedScope as SearchScope);
 }
 setRecentQueries(readStringArray(window.localStorage.getItem(RECENTS_KEY)).slice(0, RECENT_LIMIT));
 } catch {
 // ignore
 }
 }, []);

 useEffect(() => {
 const handler = (event: KeyboardEvent) => {
 if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() ==="k") {
 event.preventDefault();
 setOpen(true);
 setTimeout(() => inputRef.current?.focus(), 40);
 }
 if (event.key ==="Escape") setOpen(false);
 };
 window.addEventListener("keydown", handler);
 return () => window.removeEventListener("keydown", handler);
 }, []);

 useEffect(() => {
 if (!open) return;
 setTimeout(() => inputRef.current?.focus(), 40);
 }, [open]);

 const updateScopeFade = useCallback(() => {
 const node = scopeRef.current;
 if (!node) return;
 setScopeCanScrollLeft(node.scrollLeft > 4);
 setScopeCanScrollRight(node.scrollLeft + node.clientWidth < node.scrollWidth - 4);
 }, []);

 useEffect(() => {
 const node = scopeRef.current;
 if (!node) return;
 updateScopeFade();
 node.addEventListener("scroll", updateScopeFade, { passive: true });
 const ro = new ResizeObserver(updateScopeFade);
 ro.observe(node);
 return () => { node.removeEventListener("scroll", updateScopeFade); ro.disconnect(); };
 }, [open, updateScopeFade]);

 useEffect(() => {
 const trimmedQuery = deferredQuery.trim();
 if (!trimmedQuery || trimmedQuery.length < 2) {
 setResults([]);
 setLoading(false);
 setActiveIndex(-1);
 return;
 }

 const controller = new AbortController();
 const timeout = setTimeout(async () => {
 setLoading(true);
 try {
 const params = new URLSearchParams({ q: trimmedQuery, scope });
 if (status.trim()) params.set("status", status.trim());
 if (assignee.trim()) params.set("assignee", assignee.trim());
 if (from) params.set("from", from);
 if (to) params.set("to", to);

 const res = await fetch(`/api/search?${params.toString()}`, { signal: controller.signal });
 if (!res.ok) throw new Error(`Search failed (${res.status})`);
 const data = (await res.json()) as SearchResponse;
 const nextResults = Array.isArray(data.results) ? data.results : [];
 setResults(nextResults);
 setActiveIndex(nextResults.length > 0 ? 0 : -1);
 } catch {
 if (!controller.signal.aborted) {
 setResults([]);
 setActiveIndex(-1);
 }
 } finally {
 if (!controller.signal.aborted) setLoading(false);
 }
 }, 160);

 return () => {
 controller.abort();
 clearTimeout(timeout);
 };
 }, [deferredQuery, scope, status, assignee, from, to]);

 const groupedResults = useMemo(() => groupResults(results), [results]);
 const flatResults = useMemo(() => groupedResults.flatMap((group) => group.items), [groupedResults]);
 const activeResult = activeIndex >= 0 ? flatResults[activeIndex] ?? null : null;
 const scopeLabel = SEARCH_SCOPES.find((item) => item.value === scope)?.label ??"All";

 useEffect(() => {
 activeItemRef.current?.scrollIntoView({ block:"nearest", behavior:"smooth" });
 }, [activeIndex]);

 useEffect(() => {
 try {
 window.localStorage.setItem(SCOPE_KEY, scope);
 } catch {
 // ignore
 }
 }, [scope]);

 function rememberQuery(value: string) {
 const normalized = value.trim();
 if (!normalized) return;
 setRecentQueries((prev) => {
 const next = [normalized, ...prev.filter((item) => item.toLowerCase() !== normalized.toLowerCase())].slice(0, RECENT_LIMIT);
 try {
 window.localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
 } catch {
 // ignore
 }
 return next;
 });
 }

 function openResult(result?: SearchResult | null) {
 if (!result) return;
 rememberQuery(query);
 setOpen(false);
 router.push(result.href);
 }

 function openResultNewTab(result?: SearchResult | null) {
 if (!result) return;
 rememberQuery(query);
 window.open(result.href,"_blank","noopener,noreferrer");
 }

 function copyCode(code: string) {
 if (!navigator.clipboard?.writeText) {
 toast("Clipboard is unavailable.","error");
 return;
 }
 navigator.clipboard.writeText(code).then(
 () => toast("Code copied.","success"),
 () => toast("Failed to copy code.","error"),
 );
 }

 function scrollScopes(direction:"left" |"right") {
 const node = scopeRef.current;
 if (!node) return;
 node.scrollBy({ left: direction ==="left" ? -240 : 240, behavior:"smooth" });
 }

 function startScopeDrag(event: React.PointerEvent<HTMLDivElement>) {
 const node = scopeRef.current;
 if (!node) return;
 if (event.target !== event.currentTarget) return;
 node.setPointerCapture(event.pointerId);
 setDraggingScopes(true);
 setScopeDragStartX(event.clientX);
 setScopeDragStartScroll(node.scrollLeft);
 }

 function moveScopeDrag(event: React.PointerEvent<HTMLDivElement>) {
 if (!draggingScopes) return;
 const node = scopeRef.current;
 if (!node) return;
 event.preventDefault();
 node.scrollLeft = scopeDragStartScroll - (event.clientX - scopeDragStartX);
 }

 function stopScopeDrag() {
 setDraggingScopes(false);
 }

 function clearRecentQueries() {
 setRecentQueries([]);
 try {
 window.localStorage.removeItem(RECENTS_KEY);
 } catch {
 // ignore
 }
 }

 function handleKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
 if (event.key ==="Escape") {
 setOpen(false);
 return;
 }
 if (flatResults.length === 0) return;
 if (event.key ==="ArrowDown") {
 event.preventDefault();
 setActiveIndex((current) => Math.min(flatResults.length - 1, Math.max(0, current + 1)));
 } else if (event.key ==="ArrowUp") {
 event.preventDefault();
 setActiveIndex((current) => Math.max(0, current - 1));
 } else if (event.key ==="Enter") {
 event.preventDefault();
 const target = activeResult ?? flatResults[0];
 if (event.ctrlKey || event.metaKey) openResultNewTab(target);
 else openResult(target);
 }
 }

 const filterSummary = [
 status &&`Status: ${formatDisplayText(status)}`,
 assignee &&`Assignee: ${formatDisplayText(assignee)}`,
 from &&`From: ${from}`,
 to &&`To: ${to}`,
 ].filter(Boolean).join(" ·");

 const modal = (
 <div className="fixed inset-0 z-[500] flex items-start justify-center px-3 pt-[6vh]">
 <button type="button" aria-label="Close search" onClick={() => setOpen(false)} className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm" />

 <div className="relative z-[501] w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
 <div className="border-b border-slate-100 px-4 py-3">
 <div className="flex items-center gap-3">
 <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
 <MagnifyingGlass size={16} weight="bold" />
 </div>
 <div className="min-w-0">
 <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">Global Search</p>
 <p className="mt-0.5 text-xs text-slate-500">Fast search. Filters are behind More.</p>
 </div>
 </div>
 </div>

 <div className="space-y-3 px-4 py-3">
 <div className="flex items-center gap-2">
 <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
 <MagnifyingGlass size={15} weight="bold" className="shrink-0 text-slate-400" />
 <input
 ref={inputRef}
 value={query}
 onChange={(event) => setQuery(event.target.value)}
 onKeyDown={handleKeyDown}
 placeholder="Search..."
 autoComplete="off"
 autoCorrect="off"
 spellCheck="false"
 className="w-full border-none bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:border-none focus:outline-none focus:ring-0"
 />
 {query && (
 <button type="button" onClick={() => setQuery("")} className="rounded-md p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700">
 <X size={14} weight="bold" />
 </button>
 )}
 </div>

 <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-500 shadow-sm">
 {scopeLabel}
 </div>

 <button
 type="button"
 onClick={() => setShowFilters((v) => !v)}
 aria-label="More filters"
 className={cn(
"inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border shadow-sm transition-all",
 showFilters
 ?"border-sky-400 bg-sky-100 text-sky-700"
 :"border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
 )}
 >
 <SlidersHorizontal size={13} weight="bold" />
 </button>
 </div>

 <div className="flex items-center gap-2">
 <button
 type="button"
 onClick={() => scrollScopes("left")}
 aria-label="Scroll scopes left"
 className={cn(
"flex h-8 w-8 shrink-0 items-center justify-center self-center rounded-full border shadow-sm transition-all",
 scopeCanScrollLeft
 ?"border-slate-200 bg-white text-slate-500 hover:border-sky-400 hover:text-sky-700"
 :"border-slate-100 bg-white text-slate-300 cursor-default",
 )}
 >
 <CaretLeft size={12} weight="bold" />
 </button>

 <div className="relative flex-1 overflow-hidden">
 {scopeCanScrollLeft && (
 <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-white to-transparent" />
 )}
 {scopeCanScrollRight && (
 <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-white to-transparent" />
 )}
 <div
 ref={scopeRef}
 onPointerDown={startScopeDrag}
 onPointerMove={moveScopeDrag}
 onPointerUp={stopScopeDrag}
 onPointerCancel={stopScopeDrag}
 onPointerLeave={stopScopeDrag}
 className={cn(
"flex items-center gap-2 overflow-x-auto scroll-smooth py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
 draggingScopes ?"cursor-grabbing" :"cursor-grab",
 )}
 >
 {SEARCH_SCOPES.map((option) => {
 const active = option.value === scope;
 return (
 <button
 key={option.value}
 type="button"
 onClick={() => setScope(option.value)}
 className={cn(
"inline-flex h-8 items-center whitespace-nowrap rounded-full border px-3 text-xs font-semibold leading-none transition",
 active ? scopeColors[option.value].active : scopeColors[option.value].idle,
 )}
 >
 {option.label}
 </button>
 );
 })}
 </div>
 </div>

 <button
 type="button"
 onClick={() => scrollScopes("right")}
 aria-label="Scroll scopes right"
 className={cn(
"flex h-8 w-8 shrink-0 items-center justify-center self-center rounded-full border shadow-sm transition-all",
 scopeCanScrollRight
 ?"border-slate-200 bg-white text-slate-500 hover:border-sky-400 hover:text-sky-700"
 :"border-slate-100 bg-white text-slate-300 cursor-default",
 )}
 >
 <CaretRight size={12} weight="bold" />
 </button>
 </div>

 {showFilters && (
 <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
 <input
 value={status}
 onChange={(event) => setStatus(event.target.value)}
 placeholder="Status"
 className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none placeholder:text-slate-400 transition-all focus:ring-0"
 />
 <input
 value={assignee}
 onChange={(event) => setAssignee(event.target.value)}
 placeholder="Assignee"
 className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none placeholder:text-slate-400 transition-all focus:ring-0"
 />
 <input
 value={from}
 onChange={(event) => setFrom(event.target.value)}
 type="date"
 className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none transition-all focus:ring-0"
 />
 <input
 value={to}
 onChange={(event) => setTo(event.target.value)}
 type="date"
 className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none transition-all focus:ring-0"
 />
 </div>
 )}

 <div>
 <div className="min-w-0">
 {!query.trim() ? (
 <div className="space-y-3 flex-1 flex flex-col">
 {recentQueries.length > 0 ? (
 <>
 <div className="flex items-center justify-between gap-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
 <div className="flex items-center gap-2">
 <ClockCounterClockwise size={13} weight="bold" />
 Recent searches
 </div>
 <button
 type="button"
 onClick={clearRecentQueries}
 className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 shadow-sm hover:border-rose-300 hover:text-rose-600"
 aria-label="Clear recent searches"
 title="Clear recent searches"
 >
 <X size={11} weight="bold" />
 Clear
 </button>
 </div>
 <div className="flex flex-wrap gap-2">
 {recentQueries.map((item) => (
 <button
 key={item}
 type="button"
 onClick={() => setQuery(item)}
 className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 shadow-sm hover:border-sky-400 hover:text-sky-700"
 >
 {item}
 </button>
 ))}
 </div>
 </>
 ) : (
 <div className="flex flex-1 items-center rounded-xl border border-dashed border-slate-200 bg-white px-3 py-4 text-sm text-slate-500">
 Search once to populate recent queries.
 </div>
 )}
 </div>
 ) : loading ? (
 <div className="space-y-2">
 <div className="flex items-center gap-2 px-1 pb-1">
 <CircleNotch size={12} className="animate-spin text-slate-400" weight="bold" />
 <span className="text-xs text-slate-400">Searching&hellip;</span>
 </div>
 <ResultSkeleton />
 </div>
 ) : flatResults.length === 0 ? (
 <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-6">
 <p className="text-sm font-semibold text-slate-700">
 No results for <span className="text-sky-600">&ldquo;{query}&rdquo;</span>
 </p>
 <p className="mt-1 text-xs text-slate-500">Try:</p>
 <ul className="mt-2 space-y-1 text-xs text-slate-500">
 {scope !=="all" && (
 <li>
 <button type="button" onClick={() => setScope("all")} className="text-sky-600 hover:underline">
 Switch to All scopes
 </button>{""}
 instead of &ldquo;{scopeLabel}&rdquo;
 </li>
 )}
 {(status || assignee || from || to) && (
 <li>
 <button type="button" onClick={() => { setStatus(""); setAssignee(""); setFrom(""); setTo(""); }} className="text-sky-600 hover:underline">
 Clear active filters
 </button>{""}
 (status / assignee / date)
 </li>
 )}
 <li>Try a shorter or different keyword</li>
 <li>Check spelling</li>
 </ul>
 </div>
 ) : (
 <div ref={resultsRef} className="max-h-[52vh] space-y-2 overflow-y-auto pr-1">
 {groupedResults.map((group) => (
 <div key={group.group} className="space-y-2">
 <div className="flex items-center justify-between px-1">
 <h3 className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">{group.group}</h3>
 <span className="text-[11px] font-medium text-slate-400">{group.items.length}</span>
 </div>
 <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
 {group.items.map((result) => {
 const index = flatResults.findIndex((item) => item.id === result.id);
 const isActive = index === activeIndex;
 return (
 <div
 key={result.id}
 ref={isActive ? activeItemRef : null}
 className={cn(
"flex items-stretch border-b border-slate-100 last:border-b-0 transition-colors",
 isActive
 ?"bg-sky-50/70 border-l-2 border-l-sky-400"
 :"hover:bg-slate-50",
 )}
 >
 <button
 type="button"
 onMouseEnter={() => setActiveIndex(index)}
 onClick={() => openResult(result)}
 className="flex flex-1 items-start gap-3 px-3 py-2.5 text-left"
 >
 <div className="mt-0.5 flex shrink-0 flex-col items-start gap-1">
 <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide", typeColors[result.type] ||"bg-slate-100 text-slate-600")}>
 {typeIcons[result.type]}
 {formatDisplayText(result.type)}
 </span>
 <span className="text-[11px] font-semibold text-slate-400">{result.code}</span>
 </div>
 <div className="min-w-0 flex-1">
 <p className="truncate text-sm font-semibold text-slate-900">
 <HighlightText text={result.label} query={query} linkify={false} />
 </p>
 <p className="mt-0.5 truncate text-xs text-slate-500">{result.sublabel}</p>
 </div>
 </button>
 <div className="flex shrink-0 items-center gap-1 pr-1">
 <button
 type="button"
 onClick={() => copyCode(result.code)}
 className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
 title="Copy code"
 aria-label="Copy code"
 >
 <CopySimple size={14} weight="bold" />
 </button>
 <button
 type="button"
 onClick={() => openResultNewTab(result)}
 className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-violet-600"
 title="Open in new tab"
 aria-label="Open in new tab"
 >
 <ArrowSquareOut size={14} weight="bold" />
 </button>
 <button
 type="button"
 onClick={() => openResult(result)}
 className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-sky-600"
 title="Open result"
 aria-label="Open result"
 >
 <ArrowRight size={14} weight="bold" />
 </button>
 </div>
 </div>
 );
 })}
 </div>
 </div>
 ))}
 </div>
 )}
 </div>

 </div>
 </div>

 <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2.5 text-[11px] text-slate-400">
 <p>{results.length > 0 ?`${results.length} result${results.length !== 1 ?"s" :""}` :"Ready to search"}</p>
 <div className="hidden items-center gap-3 sm:flex">
 {activeIndex >= 0 && <span>Selected: <span className="font-semibold text-slate-600">{activeResult?.code ??"-"}</span></span>}
 <span className="flex items-center gap-1">
 <kbd className="rounded border border-slate-200 bg-slate-100 px-1 py-0.5 text-[10px] font-bold">↑↓</kbd> navigate
 </span>
 <span className="flex items-center gap-1">
 <kbd className="rounded border border-slate-200 bg-slate-100 px-1 py-0.5 text-[10px] font-bold">Enter</kbd> open
 </span>
 <span className="flex items-center gap-1">
 <kbd className="rounded border border-slate-200 bg-slate-100 px-1 py-0.5 text-[10px] font-bold">⌘↵</kbd> new tab
 </span>
 </div>
 </div>
 </div>
 </div>
 );

 return (
 <>
 <button
 type="button"
 onClick={() => setOpen(true)}
 className={cn(
"flex w-full max-w-[min(22rem,calc(100vw-2rem))] items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm text-slate-400 shadow-sm transition hover:border-sky-300 hover:shadow-md sm:w-auto",
 triggerClassName,
 )}
 >
 <MagnifyingGlass size={15} weight="bold" />
 <span className={cn("hidden flex-1 truncate text-left sm:inline", compactTrigger &&"hidden")}>{triggerLabel}</span>
 <kbd className={cn("hidden rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500 sm:inline", compactTrigger &&"hidden")}>
 {triggerShortcut}
 </kbd>
 </button>

 {mounted && open && createPortal(modal, document.body)}
 </>
 );
}
