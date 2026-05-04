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
      <td colSpan={colSpan} className="border border-slate-200 px-4 py-20 text-center dark:border-slate-700">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 ring-1 ring-slate-200 dark:ring-slate-700">
            <FolderOpen size={32} weight="bold" />
          </div>
          <div className="space-y-1.5">
            <p className="text-base font-bold text-slate-700 dark:text-slate-200">No {shortTitle} yet</p>
            <p className="max-w-xs text-sm text-slate-500 dark:text-slate-400">
              Create the first entry to start tracking work in this module.
            </p>
          </div>
          {canAdd && (
            <button
              type="button"
              onClick={onAdd}
              className="mt-1 inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-sky-600 hover:bg-sky-600 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <Plus size={14} weight="bold" />
              Add {shortTitle}
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
