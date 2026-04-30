"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ClockCounterClockwise,
  CopySimple,
  MagnifyingGlass,
  X,
  CircleNotch,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { HighlightText } from "@/components/highlight-text";
import { toast } from "@/components/ui/toast";

type SearchScope =
  | "all"
  | "tasks"
  | "bugs"
  | "test-plans"
  | "test-suites"
  | "test-cases"
  | "test-sessions"
  | "meeting-notes"
  | "sprints"
  | "assignees"
  | "users"
  | "deployments"
  | "activity";

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
  query?: string;
  scope?: SearchScope;
  scopeLabel?: string;
  results?: SearchResult[];
};

const SEARCH_SCOPES: Array<{ value: SearchScope; label: string }> = [
  { value: "all", label: "All" },
  { value: "test-plans", label: "Plans" },
  { value: "test-suites", label: "Suites" },
  { value: "test-cases", label: "Cases" },
  { value: "bugs", label: "Bugs" },
  { value: "tasks", label: "Tasks" },
  { value: "test-sessions", label: "Sessions" },
  { value: "meeting-notes", label: "Meetings" },
  { value: "sprints", label: "Sprints" },
  { value: "deployments", label: "Deployments" },
  { value: "assignees", label: "Assignees" },
  { value: "users", label: "Users" },
  { value: "activity", label: "Activity" },
];

const typeColors: Record<string, string> = {
  Task: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200",
  Bug: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-200",
  "Test Plan": "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-200",
  "Test Suite": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200",
  "Test Case": "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-200",
  "Test Session": "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-200",
  "Meeting Note": "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-200",
  Sprint: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-200",
  Assignee: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200",
  User: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200",
  Deployment: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-200",
  "Daily Log": "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
};

const RECENTS_KEY = "qa-daily:global-search:recent";
const SCOPE_KEY = "qa-daily:global-search:scope";
const RECENT_LIMIT = 5;

function readStringArray(raw: string | null) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
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

function findFirstResult(results: SearchResult[]) {
  return results.length > 0 ? results[0] : null;
}

export function GlobalSearch({
  triggerClassName,
  triggerLabel = "Cari...",
  triggerShortcut = "⌘K",
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
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentQueries, setRecentQueries] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
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
      // Ignore storage errors.
    }
  }, []);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (!open) return;
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

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
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmedQuery)}&scope=${encodeURIComponent(scope)}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`Search failed (${res.status})`);
        const data = (await res.json()) as SearchResponse;
        setResults(Array.isArray(data.results) ? data.results : []);
        setActiveIndex(Array.isArray(data.results) && data.results.length > 0 ? 0 : -1);
      } catch {
        if (!controller.signal.aborted) {
          setResults([]);
          setActiveIndex(-1);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 180);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [deferredQuery, scope]);

  const groupedResults = useMemo(() => groupResults(results), [results]);
  const flatResults = useMemo(() => groupedResults.flatMap((group) => group.items), [groupedResults]);
  const activeResult = activeIndex >= 0 ? flatResults[activeIndex] ?? null : null;
  const scopeLabel = SEARCH_SCOPES.find((item) => item.value === scope)?.label ?? "All";

  useEffect(() => {
    try {
      window.localStorage.setItem(SCOPE_KEY, scope);
    } catch {
      // Ignore storage errors.
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
        // Ignore storage errors.
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

  function copyCode(code: string) {
    if (!navigator.clipboard?.writeText) {
      toast("Clipboard is unavailable.", "error");
      return;
    }
    navigator.clipboard.writeText(code).then(
      () => toast("Code copied to clipboard.", "success"),
      () => toast("Failed to copy code.", "error"),
    );
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (flatResults.length === 0) {
      if (event.key === "Escape") setOpen(false);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => Math.min(flatResults.length - 1, Math.max(0, current + 1)));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => Math.max(0, current - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      openResult(activeResult ?? findFirstResult(flatResults));
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  const modal = (
    <div className="fixed inset-0 z-[500] flex items-start justify-center px-4 pt-[10vh]">
      <button type="button" aria-label="Close search" onClick={() => setOpen(false)} className="absolute inset-0 cursor-default bg-slate-950/55 backdrop-blur-sm" />
      <div className="relative z-[501] w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-slate-950">
        <div className="border-b border-slate-100 px-5 py-4 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-300">
              <MagnifyingGlass size={18} weight="bold" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Global Search</p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Cari berdasarkan judul, kode, proyek, status, dan isi.</p>
            </div>
          </div>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/5">
              <MagnifyingGlass size={16} weight="bold" className="shrink-0 text-slate-400" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Cari di semua modul..."
                className="w-full bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100"
              />
              {query && (
                <button type="button" onClick={() => setQuery("")} className="rounded-md p-1 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white">
                  <X size={14} weight="bold" />
                </button>
              )}
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs font-semibold text-slate-500 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
              {scopeLabel}
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {SEARCH_SCOPES.map((option) => {
              const active = option.value === scope;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setScope(option.value)}
                  className={cn(
                    "whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                    active
                      ? "border-sky-500 bg-sky-50 text-sky-700 dark:border-sky-400 dark:bg-sky-950/40 dark:text-sky-200"
                      : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300",
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          {!query.trim() ? (
            <div className="space-y-4" ref={listRef}>
              <div>
                <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                  <ClockCounterClockwise size={14} weight="bold" />
                  Pencarian terakhir
                </div>
                {recentQueries.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
                    Cari sekali, lalu riwayat pencarian akan muncul di sini.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {recentQueries.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setQuery(item)}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-sky-400 hover:text-sky-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-xl bg-slate-50 px-4 py-4 text-sm text-slate-600 dark:bg-white/5 dark:text-slate-300">
                Coba kode seperti `TASK-001`, nama proyek, atau nama orang.
              </div>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-8 text-sm text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
              <CircleNotch size={16} className="animate-spin" weight="bold" />
              Searching...
            </div>
          ) : flatResults.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
              No results for <span className="font-semibold text-slate-700 dark:text-slate-200">{query}</span>.
            </div>
          ) : (
            <div className="space-y-4" ref={listRef}>
              {groupedResults.map((group) => (
                <div key={group.group} className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">{group.group}</h3>
                    <span className="text-[11px] font-medium text-slate-400">{group.items.length} result{group.items.length !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5">
                    {group.items.map((result) => {
                      const index = flatResults.findIndex((item) => item.id === result.id);
                      const isActive = index === activeIndex;
                      return (
                        <div
                          key={result.id}
                          className={cn(
                            "flex items-start gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0 dark:border-white/5",
                            isActive ? "bg-sky-50/70 dark:bg-sky-950/30" : "hover:bg-slate-50 dark:hover:bg-white/5",
                          )}
                        >
                          <button
                            type="button"
                            onMouseEnter={() => setActiveIndex(index)}
                            onClick={() => openResult(result)}
                            className="flex flex-1 items-start gap-3 text-left"
                          >
                            <div className="mt-0.5 flex shrink-0 flex-col items-start gap-1">
                              <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide", typeColors[result.type] || "bg-slate-100 text-slate-600")}>
                                {result.type}
                              </span>
                              <span className="text-[11px] font-semibold text-slate-400">{result.code}</span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                                <HighlightText text={result.label} query={query} linkify={false} />
                              </p>
                              <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{result.sublabel}</p>
                              <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                                <HighlightText text={result.snippet} query={query} linkify={false} />
                              </p>
                            </div>
                          </button>
                          <div className="flex shrink-0 items-center gap-1">
                            <button
                              type="button"
                              onClick={() => copyCode(result.code)}
                              className="rounded-md p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white"
                              title="Copy code"
                              aria-label={`Copy ${result.code}`}
                            >
                              <CopySimple size={15} weight="bold" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openResult(result)}
                              className="rounded-md p-2 text-slate-400 transition hover:bg-slate-100 hover:text-sky-600 dark:hover:bg-white/10 dark:hover:text-sky-300"
                              title="Open result"
                              aria-label={`Open ${result.label}`}
                            >
                              <ArrowRight size={15} weight="bold" />
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

        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-[11px] text-slate-400 dark:border-white/5 dark:text-slate-500">
          <p>
            {results.length > 0 ? `${results.length} result${results.length !== 1 ? "s" : ""}` : "Ready to search"}
          </p>
          <p className="hidden sm:block">
            {activeIndex >= 0 ? `Selected: ${activeResult?.code ?? "-"}` : "Use ↑↓ and Enter"}
          </p>
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
        <span className={cn("hidden flex-1 truncate text-left sm:inline", compactTrigger && "hidden")}>{triggerLabel}</span>
        <kbd className={cn(
          "hidden rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 sm:inline dark:border-white/10 dark:bg-white/5 dark:text-slate-300",
          compactTrigger && "hidden",
        )}>
          {triggerShortcut}
        </kbd>
      </button>

      {mounted && open && createPortal(modal, document.body)}
    </>
  );
}
