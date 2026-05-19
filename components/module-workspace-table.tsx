"use client";

import { useState, useMemo, useId } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ModuleEmptyState } from "@/components/module-empty-state";
import { ModulePagination } from "@/components/module-pagination";
import { ModuleRowActions } from "@/components/module-row-actions";
import { ModuleWorkspaceCell } from "@/components/module-workspace-cell";
import { PAGE_SIZE } from "@/lib/pagination";
import { cn } from "@/lib/utils";
import { CheckSquare, Square, MinusSquare, Trash, DotsSixVertical } from "@phosphor-icons/react";
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

/* ─── Sortable Table Row ─── */
function SortableRow({
  row,
  index,
  module,
  safePage,
  visibleColumns,
  reorderable,
  onReorder,
  pendingDeleteId,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  canEdit,
  canDelete,
  onViewRow,
  onEditRow,
  onReopenRow,
  onDeleteRow,
  onInlineUpdate,
  statusOptions,
  priorityOptions,
  isDragOverlay = false,
}: {
  row: TableRow;
  index: number;
  module: ModuleKey;
  safePage: number;
  visibleColumns: Column[];
  reorderable?: boolean;
  onReorder?: (rowId: string | number, newIndex: number) => void;
  pendingDeleteId: string | number | null;
  selectedIds?: Set<string | number>;
  onToggleSelect?: (id: string | number) => void;
  onToggleSelectAll?: () => void;
  canEdit: boolean;
  canDelete: boolean;
  onViewRow: (row: TableRow) => void;
  onEditRow: (row: TableRow) => void;
  onReopenRow: (row: TableRow) => void;
  onDeleteRow: (row: TableRow) => void;
  onInlineUpdate?: (rowId: string | number, field: string, value: string) => void;
  statusOptions?: Array<{ value: string; label: string }>;
  priorityOptions?: Array<{ value: string; label: string }>;
  isDragOverlay?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `row-${row.id}`,
    disabled: !reorderable || !onReorder,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={cn(
        "align-top transition-colors duration-150",
        index % 2 === 0 ? "bg-transparent" : "bg-slate-50/50",
        "hover:bg-blue-50/40",
        pendingDeleteId === row.id && "opacity-40 pointer-events-none",
        selectedIds?.has(row.id) && "bg-blue-50/60",
        isDragging && "opacity-30 bg-slate-100",
        isDragOverlay && "shadow-2xl bg-white opacity-100 ring-2 ring-sky-400/50",
      )}
      {...attributes}
    >
      {/* Drag handle */}
      {reorderable && onReorder && (
        <td className="border-b border-slate-200/60 px-1 py-3 text-center align-top">
          <span
            {...listeners}
            className="inline-flex cursor-grab active:cursor-grabbing touch-none"
          >
            <DotsSixVertical size={14} weight="bold" className="text-slate-300 hover:text-slate-500 transition" />
          </span>
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
      <td className="border-b border-slate-200/60 px-4 py-3 text-center text-xs font-bold text-slate-400 align-top">
        <div className="flex flex-col items-center gap-1">
          <span>{(safePage - 1) * PAGE_SIZE + index + 1}</span>
          {module === "bugs" && row.status !== "fixed" && row.status !== "closed" && row.createdAt && !isNaN(new Date(String(row.createdAt)).getTime()) && (() => {
            const days = Math.floor((new Date().getTime() - new Date(String(row.createdAt)).getTime()) / (24 * 60 * 60 * 1000));
            return days > 3 ? (
              <span
                className="rounded-md bg-rose-500 px-1 py-0.5 text-[10px] font-black leading-none text-white shadow-sm"
                title={`Stale Bug (${days} days old)`}
              >
                {days}d
              </span>
            ) : null;
          })()}
        </div>
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
  );
}

/* ─── Main Table ─── */
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
  const dndId = useId();
  const hasSelection = selectedIds && selectedIds.size > 0;
  const allSelected = visibleRows.length > 0 && selectedIds && visibleRows.every((row) => selectedIds.has(row.id));
  const someSelected = selectedIds && selectedIds.size > 0 && !allSelected;
  const [activeRow, setActiveRow] = useState<TableRow | null>(null);
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  const sortableIds = useMemo(
    () => visibleRows.map((row) => `row-${row.id}`),
    [visibleRows],
  );

  function handleDragStart(event: DragStartEvent) {
    const id = String(event.active.id).replace("row-", "");
    const idx = visibleRows.findIndex((r) => String(r.id) === id);
    if (idx >= 0) {
      setActiveRow(visibleRows[idx]);
      setActiveIndex(idx);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveRow(null);
    setActiveIndex(-1);

    if (!over || active.id === over.id) return;

    const activeId = String(active.id).replace("row-", "");
    const overId = String(over.id).replace("row-", "");
    const oldIndex = visibleRows.findIndex((r) => String(r.id) === activeId);
    const newIndex = visibleRows.findIndex((r) => String(r.id) === overId);

    if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return;

    if (onReorder) {
      onReorder(visibleRows[oldIndex].id, newIndex);
    }
  }

  const tableContent = (
    <table className="w-full min-w-[980px] border-collapse table-auto">
      <thead className="sticky top-0 z-10 bg-slate-200">
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
          <th className="border-b border-slate-200/60 px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.14em] text-slate-700 w-12">
            No.
          </th>
          {visibleColumns.map((column) => (
            <th
              key={column.key}
              className="border-b border-slate-200/60 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-700"
            >
              {column.label}
            </th>
          ))}
          <th className="border-b border-slate-200/60 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-700">
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
          <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
            {visibleRows.map((row, index) => (
              <SortableRow
                key={row.id}
                row={row}
                index={index}
                module={module}
                safePage={safePage}
                visibleColumns={visibleColumns}
                reorderable={reorderable}
                onReorder={onReorder}
                pendingDeleteId={pendingDeleteId}
                selectedIds={selectedIds}
                onToggleSelect={onToggleSelect}
                onToggleSelectAll={onToggleSelectAll}
                canEdit={canEdit}
                canDelete={canDelete}
                onViewRow={onViewRow}
                onEditRow={onEditRow}
                onReopenRow={onReopenRow}
                onDeleteRow={onDeleteRow}
                onInlineUpdate={onInlineUpdate}
                statusOptions={statusOptions}
                priorityOptions={priorityOptions}
              />
            ))}
          </SortableContext>
        )}
      </tbody>
    </table>
  );

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

      {reorderable && onReorder ? (
        <DndContext
          id={dndId}
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {tableContent}
          <DragOverlay dropAnimation={{
            duration: 250,
            easing: "cubic-bezier(0.25, 1, 0.5, 1)",
          }}>
            {activeRow ? (
              <table className="w-full min-w-[980px] border-collapse table-auto">
                <tbody>
                  <SortableRow
                    row={activeRow}
                    index={activeIndex}
                    module={module}
                    safePage={safePage}
                    visibleColumns={visibleColumns}
                    reorderable={reorderable}
                    onReorder={onReorder}
                    pendingDeleteId={null}
                    selectedIds={selectedIds}
                    onToggleSelect={onToggleSelect}
                    onToggleSelectAll={onToggleSelectAll}
                    canEdit={canEdit}
                    canDelete={canDelete}
                    onViewRow={() => {}}
                    onEditRow={() => {}}
                    onReopenRow={() => {}}
                    onDeleteRow={() => {}}
                    onInlineUpdate={undefined}
                    statusOptions={statusOptions}
                    priorityOptions={priorityOptions}
                    isDragOverlay
                  />
                </tbody>
              </table>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        tableContent
      )}

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
