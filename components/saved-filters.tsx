"use client";

import { useState, useRef, useEffect } from "react";
import { BookmarkSimple, Plus, Trash, X } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import type { FilterValue } from "@/components/module-filter-bar";

type SavedFilter = {
  id: string;
  name: string;
  filters: FilterValue[];
  search: string;
};

type SavedFiltersProps = {
  module: string;
  activeFilters: FilterValue[];
  search: string;
  onApply: (filters: FilterValue[], search: string) => void;
};

function getStorageKey(module: string) {
  return `qa-saved-filters:${module}`;
}

function loadSavedFilters(module: string): SavedFilter[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(getStorageKey(module));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persistSavedFilters(module: string, filters: SavedFilter[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(getStorageKey(module), JSON.stringify(filters));
}

export function SavedFilters({ module, activeFilters, search, onApply }: SavedFiltersProps) {
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState<SavedFilter[]>(() => loadSavedFilters(module));
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [saveName, setSaveName] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setShowSaveInput(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (showSaveInput && inputRef.current) inputRef.current.focus();
  }, [showSaveInput]);

  const handleSave = () => {
    const name = saveName.trim();
    if (!name) return;
    const newFilter: SavedFilter = {
      id: Date.now().toString(36),
      name,
      filters: activeFilters,
      search,
    };
    const updated = [...saved, newFilter];
    setSaved(updated);
    persistSavedFilters(module, updated);
    setSaveName("");
    setShowSaveInput(false);
  };

  const handleDelete = (id: string) => {
    const updated = saved.filter((f) => f.id !== id);
    setSaved(updated);
    persistSavedFilters(module, updated);
  };

  const handleApply = (filter: SavedFilter) => {
    onApply(filter.filters, filter.search);
    setOpen(false);
  };

  const canSave = activeFilters.length > 0 || search.trim().length > 0;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-semibold transition",
          saved.length > 0
            ? "border-violet-300 bg-violet-50 text-violet-700 hover:bg-violet-100"
            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
        )}
        title="Saved views"
      >
        <BookmarkSimple size={13} weight="bold" />
        Views
        {saved.length > 0 && (
          <span className="ml-0.5 rounded-full bg-violet-200 px-1.5 py-0.5 text-[10px] font-black text-violet-700">
            {saved.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-64 rounded-lg border border-slate-200 bg-white shadow-xl animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
            <span className="text-xs font-bold text-slate-700">Saved Views</span>
            {canSave && (
              <button
                type="button"
                onClick={() => setShowSaveInput(true)}
                className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-800"
              >
                <Plus size={10} weight="bold" />
                Save current
              </button>
            )}
          </div>

          {showSaveInput && (
            <div className="flex items-center gap-1.5 border-b border-slate-100 px-3 py-2">
              <input
                ref={inputRef}
                type="text"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") setShowSaveInput(false); }}
                placeholder="View name..."
                className="h-7 flex-1 rounded-md border border-slate-200 px-2 text-xs outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handleSave}
                disabled={!saveName.trim()}
                className="h-7 rounded-md bg-blue-600 px-2.5 text-[10px] font-bold text-white transition hover:bg-blue-700 disabled:opacity-40"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setShowSaveInput(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={12} weight="bold" />
              </button>
            </div>
          )}

          <div className="max-h-48 overflow-y-auto p-1.5">
            {saved.length === 0 && (
              <p className="px-2 py-4 text-center text-[11px] text-slate-400">
                No saved views yet. Apply filters and save them for quick access.
              </p>
            )}
            {saved.map((filter) => (
              <div
                key={filter.id}
                className="group flex items-center gap-2 rounded-md px-2.5 py-2 transition hover:bg-slate-50"
              >
                <button
                  type="button"
                  onClick={() => handleApply(filter)}
                  className="flex-1 text-left text-xs font-medium text-slate-700"
                >
                  <span className="font-semibold">{filter.name}</span>
                  <span className="ml-1.5 text-[10px] text-slate-400">
                    {filter.filters.length} filter{filter.filters.length !== 1 ? "s" : ""}
                    {filter.search ? " + search" : ""}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(filter.id)}
                  className="shrink-0 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition"
                  title="Delete view"
                >
                  <Trash size={12} weight="bold" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
