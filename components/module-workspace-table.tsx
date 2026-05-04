"use client";

import { ModuleEmptyState } from "@/components/module-empty-state";
import { ModulePagination } from "@/components/module-pagination";
import { ModuleRowActions } from "@/components/module-row-actions";
import { ModuleWorkspaceCell } from "@/components/module-workspace-cell";
import { PAGE_SIZE } from "@/lib/pagination";
import { cn } from "@/lib/utils";
import type { ModuleKey } from "@/lib/modules";

type RelatedSuite = { id: string; title: string; token?: string };

type TableRow = {
  id: string | number;
  status?: string;
  createdAt?: string | number;
  relatedSuites?: RelatedSuite[];
  projectRowSpan?: number;
  testPlanRowSpan?: number;
  [key: string]: string | number | boolean | null | undefined | RelatedSuite[] | unknown;
};

type Column = {
  key: string;
  label: string;
  tone?: "priority" | "severity" | "status";
  multiline?: boolean;
  link?: boolean;
  internalLink?: (row: TableRow) => string;
};

type ModuleWorkspaceTableProps = {
  module: ModuleKey;
  shortTitle: string;
  visibleRows: TableRow[];
  visibleColumns: Column[];
  safePage: number;
  totalPages: number;
  totalItems: number;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
  pendingDeleteId: string | number | null;
  statusOptions: Array<{ label: string; value: string }>;
  statusDropdownId: string | number | null;
  setStatusDropdownId: (value: string | number | null) => void;
  onAdd: () => void;
  onEditRow: (row: TableRow) => void;
  onViewRow: (row: TableRow) => void;
  onDeleteRow: (row: TableRow) => void;
  onReopenRow: (row: TableRow) => void;
  onPrevPage: () => void;
  onNextPage: () => void;
  onUpdateStatus: (id: string | number, value: string) => void | Promise<void>;
};

export function ModuleWorkspaceTable({
  module,
  shortTitle,
  visibleRows,
  visibleColumns,
  safePage,
  totalPages,
  totalItems,
  canAdd,
  canEdit,
  canDelete,
  pendingDeleteId,
  statusOptions,
  statusDropdownId,
  setStatusDropdownId,
  onAdd,
  onEditRow,
  onViewRow,
  onDeleteRow,
  onReopenRow,
  onPrevPage,
  onNextPage,
  onUpdateStatus,
}: ModuleWorkspaceTableProps) {
  return (
    <div className="max-w-full overflow-x-auto px-6 pb-32 pt-6">
      <table className="w-full min-w-[980px] border-collapse table-auto">
        <thead className="bg-slate-100 dark:bg-slate-800">
          <tr>
            <th className="border border-[#d9e2ea] dark:border-slate-700 px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600 dark:text-slate-400 w-12">
              No.
            </th>
            {visibleColumns.map((column) => (
              <th
                key={column.key}
                className="border border-[#d9e2ea] dark:border-slate-700 px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600 dark:text-slate-400"
              >
                {column.label}
              </th>
            ))}
            <th className="border border-[#d9e2ea] dark:border-slate-700 px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600 dark:text-slate-400">
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {visibleRows.length === 0 ? (
            <ModuleEmptyState
              shortTitle={shortTitle}
              canAdd={canAdd}
              colSpan={visibleColumns.length + 2}
              onAdd={onAdd}
            />
          ) : (
            visibleRows.map((row, index) => (
              <tr
                key={String(row.id)}
                className={cn(
                  "bg-white dark:bg-slate-900 align-top transition-colors even:bg-slate-50/70 dark:even:bg-slate-800/50",
                  pendingDeleteId === row.id && "opacity-40 pointer-events-none",
                )}
              >
                <td className="relative border border-[#d9e2ea] dark:border-slate-700 px-3 py-2 text-center text-xs font-bold text-slate-400 align-top">
                  {(safePage - 1) * PAGE_SIZE + index + 1}
                  {module === "bugs" && row.status !== "fixed" && row.status !== "closed" && row.createdAt && !isNaN(new Date(String(row.createdAt)).getTime()) && (() => {
                    const days = Math.floor((new Date().getTime() - new Date(String(row.createdAt)).getTime()) / (24 * 60 * 60 * 1000));
                    return days > 3 ? (
                      <span
                        className="absolute -top-1 -right-1 rounded-md bg-rose-500 px-1 py-0.5 text-[9px] font-black leading-none text-white shadow-sm"
                        title={`Stale Bug (${days} days old)`}
                      >
                        {days}d
                      </span>
                    ) : null;
                  })()}
                </td>
                {visibleColumns.map((column) => (
                  <ModuleWorkspaceCell
                    key={column.key}
                    module={module}
                    row={row}
                    column={column}
                    value={row[column.key]}
                    statusOptions={statusOptions}
                    canEdit={canEdit}
                    statusDropdownId={statusDropdownId}
                    index={index}
                    visibleRowsLength={visibleRows.length}
                    setStatusDropdownId={setStatusDropdownId}
                    onUpdateStatus={onUpdateStatus}
                  />
                ))}
                <td className="border border-[#d9e2ea] dark:border-slate-700 px-3 py-2 align-top">
                  <ModuleRowActions
                    module={module}
                    row={row}
                    canEdit={canEdit}
                    canDelete={canDelete}
                    onView={() => onViewRow(row)}
                    onEdit={() => onEditRow(row)}
                    onReopen={() => onReopenRow(row)}
                    onDelete={() => onDeleteRow(row)}
                  />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      <ModulePagination
        page={safePage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={PAGE_SIZE}
        onPrev={onPrevPage}
        onNext={onNextPage}
      />
    </div>
  );
}
