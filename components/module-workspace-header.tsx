"use client";

import Link from"next/link";
import { Plus, FileXls, FilePdf, UploadSimple, MagnifyingGlass, Table, Kanban } from"@phosphor-icons/react";
import type { ReactNode } from"react";

type WorkspaceHeaderProps = {
 module: string;
 title: string;
 shortTitle: string;
 description: string;
 icon?: ReactNode;
 canAdd: boolean;
 topContent?: ReactNode;
 showForm: boolean;
 viewMode:"table" |"kanban";
 hasKanban: boolean;
 pending: boolean;
 refreshing: boolean;
 onToggleForm: () => void;
 onSetViewMode: (mode:"table" |"kanban") => void;
 onImportFile: (file: File) => void;
 search: string;
 onSearchChange: (value: string) => void;
};

export function ModuleWorkspaceHeader({
 module,
 title,
 shortTitle,
 description,
 icon,
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
 search,
 onSearchChange,
}: WorkspaceHeaderProps) {
 return (
 <>
 <div className="border-b border-slate-200/60 bg-transparent px-6 py-5">
 <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
 <div className="max-w-3xl">
 <div className="flex items-center gap-3">
 {icon ? (
 <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
 {icon}
 </div>
 ) : null}
 <div className="min-w-0">
 <h2 className="text-2xl font-bold tracking-tight md:text-3xl text-slate-900">{title}</h2>
 </div>
 </div>
 <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{description}</p>
 </div>

 {!showForm ? (
 <div className="flex w-full min-w-0 flex-wrap items-center gap-2 xl:w-auto xl:flex-1 xl:justify-end">
 <div className="relative w-full min-w-0 md:w-64 xl:max-w-64">
 <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
 <MagnifyingGlass size={16} weight="bold" />
 </div>
 <input
 type="text"
 value={search}
 onChange={(e) => onSearchChange(e.target.value)}
 placeholder={`Search ${shortTitle.toLowerCase()}...`}
 className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-4 text-sm outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
 />
 </div>

 {canAdd && (
 <button
 type="button"
 onClick={onToggleForm}
 className="inline-flex h-10 items-center gap-2 rounded-lg bg-white border border-slate-200 px-5 text-sm font-bold text-slate-700 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:bg-emerald-500 hover:text-white hover:border-emerald-500"
 >
 <Plus size={18} weight="bold" className="shrink-0" />
 Add {shortTitle}
 </button>
 )}
 <Link
 href={`/api/export/${module}`}
 title="Export Excel"
 aria-label="Export Excel"
 className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-600 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:bg-blue-500 hover:text-white hover:border-blue-500"
 >
 <FileXls size={18} weight="bold" />
 </Link>

 <Link
 href={`/api/export/${module}?format=pdf`}
 title="Print / Export PDF"
 aria-label="Print / Export PDF"
 className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-600 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:bg-blue-500 hover:text-white hover:border-blue-500"
 >
 <FilePdf size={18} weight="bold" />
 </Link>

 {canAdd && (
 <label
 title="Import Excel"
 aria-label="Import Excel"
 className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-600 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:bg-blue-500 hover:text-white hover:border-blue-500"
 >
 <UploadSimple size={18} weight="bold" />
 <input
 type="file"
 accept=".xlsx,.xls"
 className="hidden"
 onChange={(event) => {
 const file = event.target.files?.[0];
 if (file) onImportFile(file);
 event.target.value ="";
 }}
 />
 </label>
 )}

 {topContent ? <div className="flex w-full basis-full flex-col items-end">{topContent}</div> : null}
 </div>
 ) : null}
 </div>
 </div>
 {!showForm && (
 <div className="sticky top-0 z-[var(--z-sticky)] space-y-4 border-b border-slate-200/60 bg-white px-6 py-5 text-sm text-slate-600 backdrop-blur-xl lg:px-6">
 <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
 <div className="flex flex-wrap items-center gap-3">
 {hasKanban ? (
 <div className="flex h-10 items-center overflow-hidden rounded-lg glass-card">
 <button
 type="button"
 onClick={() => onSetViewMode("table")}
 className={`h-full px-4 text-sm font-bold transition-colors focus-visible:outline-none ${
 viewMode ==="table"
 ?"bg-slate-200 text-slate-900"
 :"text-slate-600 hover:bg-slate-100/50"
 }`}
 >
 <span className="inline-flex items-center gap-1.5">
 <Table size={16} weight="bold" />
 Table
 </span>
 </button>
 <button
 type="button"
 onClick={() => onSetViewMode("kanban")}
 className={`h-full border-l border-slate-200/60 px-4 text-sm font-bold transition-colors focus-visible:outline-none ${
 viewMode ==="kanban"
 ?"bg-slate-200 text-slate-900"
 :"text-slate-600 hover:bg-slate-100/50"
 }`}
 >
 <span className="inline-flex items-center gap-1.5">
 <Kanban size={16} weight="bold" />
 Kanban
 </span>
 </button>
 </div>
 ) : null}
 </div>

 <div className="flex w-full min-w-0 shrink-0 items-center gap-3 xl:ml-auto xl:w-auto xl:justify-end">
 {(pending || refreshing) && (
 <span role="status" className="flex items-center gap-1.5 text-xs font-semibold text-blue-600">
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
