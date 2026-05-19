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
      <td colSpan={colSpan} className="px-4 py-24 text-center">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="absolute inset-0 rounded-3xl bg-sky-400/10 blur-2xl scale-[2]" />
            <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-slate-50 to-slate-100 text-slate-300 ring-1 ring-slate-200/60 shadow-sm">
              {hasActiveFilters ? (
                <Funnel size={44} weight="bold" />
              ) : (
                <FolderOpen size={44} weight="bold" />
              )}
            </div>
          </div>
          <div className="space-y-2">
            {hasActiveFilters ? (
              <>
                <p className="text-lg font-bold text-slate-700">No matching results</p>
                <p className="max-w-sm text-sm text-slate-500 leading-relaxed">
                  Try adjusting your filters or search query to find what you&apos;re looking for.
                </p>
              </>
            ) : (
              <>
                <p className="text-lg font-bold text-slate-700">No {shortTitle} yet</p>
                <p className="max-w-sm text-sm text-slate-500 leading-relaxed">
                  Create the first entry to start tracking work in this module.
                </p>
              </>
            )}
          </div>
          {!hasActiveFilters && canAdd && (
            <button
              type="button"
              onClick={onAdd}
              className="mt-2 inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-6 text-sm font-bold text-white shadow-md shadow-sky-500/20 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-sky-500/30 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
            >
              <Plus size={16} weight="bold" />
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
