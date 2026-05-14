"use client";

import { useState, useCallback } from "react";
import { ModuleEmptyState } from "@/components/module-empty-state";
import { ModulePagination } from "@/components/module-pagination";
import { ModuleRowActions } from "@/components/module-row-actions";
import { ModuleWorkspaceCell } from "@/components/module-workspace-cell";
import { PAGE_SIZE } from "@/lib/pagination";
import { cn } from "@/lib/utils";
import { ArrowUp, ArrowDown, CheckSquare, Square, MinusSquare, Trash, PencilSimple, DotsSixVertical } from "@phosphor-icons/react";
import type { ModuleKey } from "@/lib/modules";

type RelatedSuite = { id: string; title: string; token?: string; publicToken?: string };

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

export type SortConfig = {
  key: string;
  direction: "asc" | "desc";
} | null;

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
  onAdd: () => void;
  onEditRow: (row: TableRow) => void;
  onViewRow: (row: TableRow) => void;
  onDeleteRow: (row: TableRow) => void;
  onReopenRow: (row: TableRow) => void;
  onPrevPage: () => void;
  onNextPage: () => void;
  onGoToPage?: (page: number) => void;
  sortConfig?: SortConfig;
  onSort?: (key: string) => void;
  selectedIds?: Set<string | number>;
  onToggleSelect?: (id: string | number) => void;
  onToggleSelectAll?: () => void;
  onBulkDelete?: () => void;
  onBulkStatusChange?: (status: string) => void;
  onInlineUpdate?: (rowId: string | number, field: string, value: string) => void;
  statusOptions?: Array<{ value: string; label: string }>;
  priorityOptions?: Array<{ value: string; label: string }>;
  onReorder?: (rowId: string | number, newIndex: number) => void;
  reorderable?: boolean;
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
  onAdd,
  onEditRow,
  onViewRow,
  onDeleteRow,
  onReopenRow,
  onPrevPage,
  onNextPage,
  onGoToPage,
  sortConfig,
  onSort,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onBulkDelete,
  onInlineUpdate,
  statusOptions,
  priorityOptions,
  onReorder,
  reorderable,
}: ModuleWorkspaceTableProps) {
  const hasSelection = selectedIds && selectedIds.size > 0;
  const allSelected = visibleRows.length > 0 && selectedIds && visibleRows.every((row) => selectedIds.has(row.id));
  const someSelected = selectedIds && selectedIds.size > 0 && !allSelected;
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  return (
    <div className="max-w-full overflow-x-auto px-6 pb-32 pt-2">
      {/* Bulk action toolbar */}
      {hasSelection && (
        <div className="mb-3 flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50/80 px-4 py-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
          <span className="text-xs font-bold text-blue-700">
            {selectedIds.size} selected
          </span>
          <div className="h-4 w-px bg-blue-200" />
          {canDelete && onBulkDelete && (
            <button
              type="button"
              onClick={onBulkDelete}
              className="inline-flex items-center gap-1.5 rounded-md border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 hover:border-rose-300"
            >
              <Trash size={14} weight="bold" />
              Delete
            </button>
          )}
          <button
            type="button"
            onClick={onToggleSelectAll}
            className="ml-auto text-xs font-semibold text-blue-600 hover:text-blue-800"
          >
            Clear selection
          </button>
        </div>
      )}

      <table className="w-full min-w-[980px] border-collapse table-auto">
        <thead className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm">
          <tr>
            {/* Drag handle column */}
            {reorderable && onReorder && (
              <th className="border-b border-slate-200/60 w-8" />
            )}
            {/* Checkbox column */}
            {onToggleSelectAll && (
              <th className="border-b border-slate-200/60 px-3 py-3 text-center w-10">
                <button
                  type="button"
                  onClick={onToggleSelectAll}
                  className="inline-flex items-center justify-center text-slate-400 hover:text-blue-600 transition"
                  title={allSelected ? "Deselect all" : "Select all"}
                >
                  {allSelected ? (
                    <CheckSquare size={18} weight="bold" className="text-blue-600" />
                  ) : someSelected ? (
                    <MinusSquare size={18} weight="bold" className="text-blue-500" />
                  ) : (
                    <Square size={18} weight="bold" />
                  )}
                </button>
              </th>
            )}
            <th className="border-b border-slate-200/60 px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.14em] text-slate-600 w-12">
              No.
            </th>
            {visibleColumns.map((column) => (
              <th
                key={column.key}
                className={cn(
                  "border-b border-slate-200/60 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-600",
                  onSort && "cursor-pointer select-none hover:text-blue-600 transition-colors",
                )}
                onClick={() => onSort?.(column.key)}
              >
                <span className="inline-flex items-center gap-1">
                  {column.label}
                  {sortConfig?.key === column.key && (
                    sortConfig.direction === "asc" ? (
                      <ArrowUp size={12} weight="bold" className="text-blue-600" />
                    ) : (
                      <ArrowDown size={12} weight="bold" className="text-blue-600" />
                    )
                  )}
                </span>
              </th>
            ))}
            <th className="border-b border-slate-200/60 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {visibleRows.length === 0 ? (
            <ModuleEmptyState
              shortTitle={shortTitle}
              canAdd={canAdd}
              colSpan={visibleColumns.length + (onToggleSelectAll ? 3 : 2) + (reorderable ? 1 : 0)}
              onAdd={onAdd}
            />
          ) : (
            visibleRows.map((row, index) => (
              <tr
                key={String(row.id)}
                draggable={reorderable && !!onReorder}
                onDragStart={() => { if (reorderable) setDraggedIdx(index); }}
                onDragOver={(e) => { if (reorderable && draggedIdx !== null) { e.preventDefault(); setDragOverIdx(index); } }}
                onDragLeave={() => setDragOverIdx(null)}
                onDrop={() => {
                  if (reorderable && onReorder && draggedIdx !== null && draggedIdx !== index) {
                    onReorder(visibleRows[draggedIdx].id, index);
                  }
                  setDraggedIdx(null);
                  setDragOverIdx(null);
                }}
                onDragEnd={() => { setDraggedIdx(null); setDragOverIdx(null); }}
                className={cn(
                  "bg-transparent align-top transition-all duration-200 hover:bg-slate-50",
                  pendingDeleteId === row.id && "opacity-40 pointer-events-none",
                  selectedIds?.has(row.id) && "bg-blue-50/50",
                  draggedIdx === index && "opacity-50",
                  dragOverIdx === index && "border-t-2 border-blue-400",
                )}
              >
                {/* Drag handle */}
                {reorderable && onReorder && (
                  <td className="border-b border-slate-200/60 px-1 py-3 text-center align-top cursor-grab active:cursor-grabbing">
                    <DotsSixVertical size={14} weight="bold" className="text-slate-300 hover:text-slate-500 transition" />
                  </td>
                )}
                {/* Row checkbox */}
                {onToggleSelect && (
                  <td className="border-b border-slate-200/60 px-3 py-3 text-center align-top">
                    <button
                      type="button"
                      onClick={() => onToggleSelect(row.id)}
                      className="inline-flex items-center justify-center text-slate-400 hover:text-blue-600 transition"
                    >
                      {selectedIds?.has(row.id) ? (
                        <CheckSquare size={16} weight="bold" className="text-blue-600" />
                      ) : (
                        <Square size={16} weight="bold" />
                      )}
                    </button>
                  </td>
                )}
                <td className="relative border-b border-slate-200/60 px-4 py-3 text-center text-xs font-bold text-slate-400 align-top">
                  {(safePage - 1) * PAGE_SIZE + index + 1}
                  {module === "bugs" && row.status !== "fixed" && row.status !== "closed" && row.createdAt && !isNaN(new Date(String(row.createdAt)).getTime()) && (() => {
                    const days = Math.floor((new Date().getTime() - new Date(String(row.createdAt)).getTime()) / (24 * 60 * 60 * 1000));
                    return days > 3 ? (
                      <span
                        className="absolute -top-1 -right-1 rounded-md bg-rose-500 px-1 py-0.5 text-[10px] font-black leading-none text-white shadow-sm"
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
                    onInlineUpdate={onInlineUpdate}
                    statusOptions={statusOptions}
                    priorityOptions={priorityOptions}
                    canEdit={canEdit}
                  />
                ))}
                <td className="border-b border-slate-200/60 px-4 py-3 align-top">
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
        onGoToPage={onGoToPage}
      />
    </div>
  );
}
