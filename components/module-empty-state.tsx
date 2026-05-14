"use client";

import { FolderOpen, Plus, MagnifyingGlass, Funnel } from "@phosphor-icons/react";

type ModuleEmptyStateProps = {
  shortTitle: string;
  canAdd: boolean;
  colSpan?: number;
  onAdd: () => void;
  hasActiveFilters?: boolean;
};

export function ModuleEmptyState({ shortTitle, canAdd, colSpan = 2, onAdd, hasActiveFilters }: ModuleEmptyStateProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="border border-slate-200 px-4 py-20 text-center">
        <div className="flex flex-col items-center gap-5">
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-sky-400/10 blur-xl scale-150" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 text-slate-400 ring-1 ring-slate-200/80 shadow-sm">
              {hasActiveFilters ? (
                <Funnel size={36} weight="bold" />
              ) : (
                <FolderOpen size={36} weight="bold" />
              )}
            </div>
          </div>
          <div className="space-y-2">
            {hasActiveFilters ? (
              <>
                <p className="text-base font-bold text-slate-700">No matching results</p>
                <p className="max-w-xs text-sm text-slate-500">
                  Try adjusting your filters or search query to find what you&apos;re looking for.
                </p>
              </>
            ) : (
              <>
                <p className="text-base font-bold text-slate-700">No {shortTitle} yet</p>
                <p className="max-w-xs text-sm text-slate-500">
                  Create the first entry to start tracking work in this module.
                </p>
              </>
            )}
          </div>
          {!hasActiveFilters && canAdd && (
            <button
              type="button"
              onClick={onAdd}
              className="mt-1 inline-flex h-10 items-center gap-2 rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 px-5 text-sm font-bold text-white shadow-md shadow-sky-500/20 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-sky-500/30 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
            >
              <Plus size={15} weight="bold" />
              Add {shortTitle}
            </button>
          )}
          {hasActiveFilters && (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-200/60">
                <MagnifyingGlass size={12} weight="bold" />
                Filters active
              </span>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}
