"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { MagnifyingGlass, X, ArrowRight } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

type Result = { id: string; code: string; label: string; sublabel: string; href: string; type: string };

const typeColors: Record<string, string> = {
  Task: "bg-amber-100 text-amber-700",
  Bug: "bg-rose-100 text-rose-700",
  "Test Case": "bg-sky-100 text-sky-700",
  Meeting: "bg-violet-100 text-violet-700",
  API: "bg-teal-100 text-teal-700",
  "Daily Log": "bg-slate-100 text-slate-600",
};

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => { setMounted(true); }, []);

  // Keyboard shortcut Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (query.length < 2) { setResults([]); setActiveIndex(-1); return; }
    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.results || []);
        setActiveIndex(-1);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex < 0) return;
    const el = listRef.current?.querySelector(`[data-idx="${activeIndex}"]`) as HTMLElement | null;
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const handleSelect = (href: string) => {
    setOpen(false);
    setQuery("");
    setResults([]);
    setActiveIndex(-1);
    router.push(href);
  };

  function handleKeyDown(e: React.KeyboardEvent) {
    if (results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(results[activeIndex].href);
    }
  }

  // Group results by type
  const grouped = results.reduce<Record<string, Result[]>>((acc, r) => {
    (acc[r.type] ??= []).push(r);
    return acc;
  }, {});

  // Add static navigation/action suggestions if query is empty or matches keywords
  const suggestions: Result[] = [];
  if (query.length === 0) {
    suggestions.push(
      { id: "nav-dash", code: "GOTO", label: "Go to Dashboard", sublabel: "Overview and metrics", href: "/", type: "Navigation" },
      { id: "nav-bugs", code: "GOTO", label: "View Bug Reports", sublabel: "Defect management", href: "/bugs", type: "Navigation" },
      { id: "nav-tasks", code: "GOTO", label: "View Tasks", sublabel: "Task management", href: "/tasks", type: "Navigation" },
      { id: "nav-plans", code: "GOTO", label: "Test Plans", sublabel: "Strategic testing", href: "/test-plans", type: "Navigation" },
      { id: "act-bug", code: "NEW", label: "Report a New Bug", sublabel: "Create defect record", href: "/bugs?action=new", type: "Action" },
      { id: "act-task", code: "NEW", label: "Create a Task", sublabel: "New task item", href: "/tasks?action=new", type: "Action" },
    );
  }

  // Flat list for keyboard nav index mapping
  const flatResults = query.length === 0 ? suggestions : Object.values(grouped).flat();

  const modal = (
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center bg-black/40 pt-20 backdrop-blur-md"
      onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
    >
      <div className="w-full max-w-xl mx-4 rounded-md bg-white/90 dark:bg-slate-900/90 shadow-[0_0_50px_-12px_rgba(0,0,0,0.3)] ring-1 ring-slate-200 dark:ring-white/10 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
        {/* Search Input */}
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-white/5 px-5 py-4">
          <MagnifyingGlass size={18} className="text-slate-400 shrink-0" weight="bold" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search or type a command (e.g. 'new bug')..."
            className="flex-1 bg-transparent text-sm font-medium text-slate-800 dark:text-slate-200 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
            autoFocus
          />
          {loading && (
            <div role="status" aria-label="Searching" className="h-4 w-4 shrink-0 animate-spin rounded-md border-2 border-sky-500 border-t-transparent" />
          )}
          <button onClick={() => setOpen(false)} aria-label="Close search" className="rounded-md p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-600 dark:hover:text-slate-300">
            <X size={16} weight="bold" />
          </button>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[450px] overflow-y-auto py-2">
          {results.length === 0 && query.length >= 2 && !loading && (
            <p className="px-5 py-8 text-center text-sm text-slate-400 font-medium">
              No results found for &ldquo;{query}&rdquo;
            </p>
          )}

          {query.length === 0 && (
            <div>
              <p className="px-5 pt-3 pb-1 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Quick Commands</p>
              {suggestions.map((r, idx) => {
                const isActive = idx === activeIndex;
                return (
                  <button
                    key={r.id}
                    data-idx={idx}
                    onClick={() => handleSelect(r.href)}
                    className={cn(
                      "flex w-full items-center gap-4 px-5 py-3 text-left transition group",
                      isActive ? "bg-sky-50 dark:bg-white/5" : "hover:bg-slate-50 dark:hover:bg-white/5",
                    )}
                  >
                    <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-md", r.type === "Navigation" ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400" : "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400")}>
                      {r.type === "Navigation" ? <ArrowRight size={16} weight="bold" /> : <MagnifyingGlass size={16} weight="bold" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-200">{r.label}</p>
                      <p className="truncate text-[10px] uppercase font-black tracking-widest text-slate-400 dark:text-slate-500">{r.sublabel}</p>
                    </div>
                    <span className="shrink-0 text-[10px] font-black uppercase tracking-widest text-slate-300 dark:text-slate-600 group-hover:text-sky-500 transition">{r.code}</span>
                  </button>
                );
              })}
            </div>
          )}

          {Object.entries(grouped).map(([type, items]) => (
            <div key={type}>
              <p className="px-5 pt-3 pb-1 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{type}</p>
              {items.map((r) => {
                const idx = flatResults.indexOf(r);
                const isActive = idx === activeIndex;
                return (
                  <button
                    key={r.id}
                    data-idx={idx}
                    onClick={() => handleSelect(r.href)}
                    className={cn(
                      "flex w-full items-center gap-4 px-5 py-3 text-left transition group",
                      isActive ? "bg-sky-50 dark:bg-sky-950/40" : "hover:bg-slate-50 dark:hover:bg-slate-700/50",
                    )}
                  >
                    <span className={cn("shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide", typeColors[r.type] || "bg-slate-100 text-slate-600")}>
                      {r.type}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">{r.label}</p>
                      <p className="truncate text-xs text-slate-400 dark:text-slate-500">{r.sublabel}</p>
                    </div>
                    <span className={cn("shrink-0 text-xs font-bold", isActive ? "text-sky-500" : "text-slate-300 group-hover:text-sky-500")}>{r.code}</span>
                    <ArrowRight size={14} className={cn("shrink-0 transition", isActive ? "text-sky-500" : "text-slate-200 group-hover:text-sky-500")} weight="bold" />
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {results.length > 0 && (
          <div className="border-t border-slate-100 dark:border-slate-700 px-5 py-2.5">
            <p className="text-[11px] text-slate-400 font-medium">
              {results.length} result{results.length !== 1 ? "s" : ""} · <kbd className="rounded border border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 font-bold">↑↓</kbd> navigate · <kbd className="rounded border border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 font-bold">↵</kbd> open · <kbd className="rounded border border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 font-bold">Esc</kbd> close
            </p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => { setOpen(true); }}
        className="flex w-full max-w-[min(22rem,calc(100vw-2rem))] items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm text-slate-400 shadow-sm transition hover:border-sky-300 hover:shadow-md sm:w-auto"
      >
        <MagnifyingGlass size={15} weight="bold" />
        <span className="hidden sm:inline">Search anything...</span>
        <kbd className="hidden rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 sm:inline">⌘K</kbd>
      </button>

      {/* Modal rendered via Portal at document.body — bypasses stacking context */}
      {mounted && open && createPortal(modal, document.body)}
    </>
  );
}
