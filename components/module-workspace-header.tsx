"use client";

import Link from "next/link";
import { Plus, FileXls, FilePdf, UploadSimple } from "@phosphor-icons/react";
import type { ReactNode } from "react";

type WorkspaceHeaderProps = {
  module: string;
  title: string;
  shortTitle: string;
  description: string;
  canAdd: boolean;
  topContent?: ReactNode;
  showForm: boolean;
  viewMode: "table" | "kanban";
  hasKanban: boolean;
  pending: boolean;
  refreshing: boolean;
  onToggleForm: () => void;
  onSetViewMode: (mode: "table" | "kanban") => void;
  onImportFile: (file: File) => void;
};

export function ModuleWorkspaceHeader({
  module,
  title,
  shortTitle,
  description,
  canAdd,
  topContent,
  showForm,
  viewMode,
  hasKanban,
  pending,
  refreshing,
  onToggleForm,
  onSetViewMode,
  onImportFile,
}: WorkspaceHeaderProps) {
  return (
    <>
      <div className="border-b border-slate-200 bg-slate-50 px-6 py-6 dark:border-slate-700 dark:bg-slate-800">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-700 dark:text-blue-400">{shortTitle}</p>
            <h2 className="mt-2 text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{title}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400">{description}</p>
          </div>

          <div className="flex w-full flex-wrap items-center gap-2 xl:w-auto xl:justify-end">
            {canAdd && (
              <button
                type="button"
                onClick={onToggleForm}
                className="inline-flex h-11 items-center gap-2 rounded-md border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm transition duration-200 hover:border-sky-600 hover:bg-sky-600 hover:text-white hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
              >
                <Plus size={16} weight="bold" className="shrink-0" />
                {showForm ? "Hide form" : `Add ${shortTitle}`}
              </button>
            )}

            <Link
              href={`/api/export/${module}`}
              title="Export Excel"
              aria-label="Export Excel"
              className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 shadow-sm transition duration-200 hover:border-sky-600 hover:bg-sky-600 hover:text-white hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            >
              <FileXls size={16} weight="bold" />
            </Link>

            <Link
              href={`/api/export/${module}?format=pdf`}
              title="Print / Export PDF"
              aria-label="Print / Export PDF"
              className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 shadow-sm transition duration-200 hover:border-sky-600 hover:bg-sky-600 hover:text-white hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            >
              <FilePdf size={16} weight="bold" />
            </Link>

            {canAdd && (
              <label
                title="Import Excel"
                aria-label="Import Excel"
                className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 shadow-sm transition duration-200 hover:border-sky-600 hover:bg-sky-600 hover:text-white hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
              >
                <UploadSimple size={16} weight="bold" />
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) onImportFile(file);
                    event.target.value = "";
                  }}
                />
              </label>
            )}
          </div>
        </div>
        {topContent ? <div className="mt-6">{topContent}</div> : null}
      </div>

      {!showForm && (
        <div className="sticky top-0 z-[var(--z-sticky)] space-y-4 border-b border-slate-200 bg-white/95 px-6 py-5 text-sm text-slate-600 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-400 lg:px-6">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              {hasKanban ? (
                <div className="flex h-10 items-center overflow-hidden rounded-md border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
                  <button
                    type="button"
                    onClick={() => onSetViewMode("table")}
                    className={`h-full px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-500 ${
                      viewMode === "table"
                        ? "bg-slate-100 text-slate-900 dark:bg-slate-700 dark:text-slate-100"
                        : "text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-700/50"
                    }`}
                  >
                    Table
                  </button>
                  <button
                    type="button"
                    onClick={() => onSetViewMode("kanban")}
                    className={`h-full border-l border-slate-200 px-4 text-sm font-semibold transition dark:border-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-500 ${
                      viewMode === "kanban"
                        ? "bg-slate-100 text-slate-900 dark:bg-slate-700 dark:text-slate-100"
                        : "text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-700/50"
                    }`}
                  >
                    Kanban
                  </button>
                </div>
              ) : null}
            </div>

            <div className="flex w-full shrink-0 items-center gap-3 xl:ml-auto xl:w-auto">
              {(pending || refreshing) && (
                <span role="status" className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-600">
                  <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Refreshing...
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
