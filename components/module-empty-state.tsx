"use client";

import { FolderOpen, Plus } from "@phosphor-icons/react";

type ModuleEmptyStateProps = {
  shortTitle: string;
  canAdd: boolean;
  colSpan?: number;
  onAdd: () => void;
};

export function ModuleEmptyState({ shortTitle, canAdd, colSpan = 2, onAdd }: ModuleEmptyStateProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="border border-slate-200 dark:border-slate-700/40 px-4 py-20 text-center">
        <div className="flex flex-col items-center gap-5">
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-sky-400/10 dark:bg-sky-400/5 blur-xl scale-150" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700/80 text-slate-400 dark:text-slate-500 ring-1 ring-slate-200/80 dark:ring-slate-600/40 shadow-sm">
              <FolderOpen size={36} weight="bold" />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-base font-bold text-slate-700 dark:text-slate-200">No {shortTitle} yet</p>
            <p className="max-w-xs text-sm text-slate-500 dark:text-slate-400">
              Create the first entry to start tracking work in this module.
            </p>
          </div>
          {canAdd && (
            <button
              type="button"
              onClick={onAdd}
              className="mt-1 inline-flex h-10 items-center gap-2 rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 px-5 text-sm font-bold text-white shadow-md shadow-sky-500/20 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-sky-500/30 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
            >
              <Plus size={15} weight="bold" />
              Add {shortTitle}
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
