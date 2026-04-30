"use client";

import { useEffect, useState, useTransition } from "react";
import { Badge } from "./badge";
import { cn } from "@/lib/utils";

type Row = Record<string, string | number>;

const columnAccents: Record<string, { border: string; header: string; dot: string; drop: string }> = {
  todo:             { border: "border-slate-300 dark:border-slate-600",    header: "text-slate-500 dark:text-slate-400",    dot: "bg-slate-400",     drop: "border-slate-400 bg-slate-50/40 dark:bg-slate-800/40" },
  doing:            { border: "border-blue-400 dark:border-blue-600",      header: "text-blue-600 dark:text-blue-400",      dot: "bg-blue-600",      drop: "border-blue-400 bg-blue-50/40 dark:bg-blue-900/20" },
  done:             { border: "border-emerald-400 dark:border-emerald-600", header: "text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-600",   drop: "border-emerald-400 bg-emerald-50/40 dark:bg-emerald-900/20" },
  deferred:         { border: "border-slate-400 dark:border-slate-600",    header: "text-slate-600 dark:text-slate-400",    dot: "bg-slate-500",     drop: "border-slate-400 bg-slate-50/40 dark:bg-slate-800/40" },
  open:             { border: "border-red-400 dark:border-red-700",        header: "text-red-600 dark:text-red-400",        dot: "bg-red-500",       drop: "border-red-400 bg-red-50/40 dark:bg-red-900/20" },
  in_progress:      { border: "border-blue-400 dark:border-blue-600",      header: "text-blue-600 dark:text-blue-400",      dot: "bg-blue-600",      drop: "border-blue-400 bg-blue-50/40 dark:bg-blue-900/20" },
  ready_to_retest:  { border: "border-violet-400 dark:border-violet-600",  header: "text-violet-600 dark:text-violet-400",  dot: "bg-violet-600",    drop: "border-violet-400 bg-violet-50/40 dark:bg-violet-900/20" },
  closed:           { border: "border-emerald-400 dark:border-emerald-600", header: "text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-600",   drop: "border-emerald-400 bg-emerald-50/40 dark:bg-emerald-900/20" },
  rejected:         { border: "border-slate-400 dark:border-slate-600",    header: "text-slate-600 dark:text-slate-400",    dot: "bg-slate-500",     drop: "border-slate-400 bg-slate-50/40 dark:bg-slate-800/40" },
};

function getAccent(value: string) {
  return columnAccents[value] ?? {
    border: "border-slate-200 dark:border-slate-700",
    header: "text-slate-600 dark:text-slate-300",
    dot: "bg-slate-400",
    drop: "border-sky-400 bg-sky-50/40 dark:bg-sky-900/20",
  };
}

export function KanbanBoard({
  rows,
  statusOptions,
  onUpdateStatus,
}: {
  rows: Row[];
  statusOptions: { label: string; value: string }[];
  onUpdateStatus: (id: number, newStatus: string) => Promise<void>;
}) {
  const [, startTransition] = useTransition();
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<string | null>(null);
  const [localRows, setLocalRows] = useState(rows);

  useEffect(() => { setLocalRows(rows); }, [rows]);

  function handleDragOver(e: React.DragEvent, statusValue: string) {
    e.preventDefault();
    setDragOverStatus(statusValue);
  }

  function handleDrop(statusValue: string) {
    setDragOverStatus(null);
    if (!draggedId) return;
    setLocalRows((prev) =>
      prev.map((row) => row.id === draggedId ? { ...row, status: statusValue } : row)
    );
    const id = draggedId;
    setDraggedId(null);
    startTransition(() => { void onUpdateStatus(id, statusValue); });
  }

  return (
    <div className="w-full overflow-x-auto pb-4">
      <div className="grid min-w-max grid-flow-col auto-cols-[minmax(17rem,17rem)] gap-4 pb-2">
        {statusOptions.map((status) => {
          const accent = getAccent(status.value);
          const columnCards = localRows.filter((row) => row.status === status.value);
          const isDropTarget = dragOverStatus === status.value && draggedId !== null;

          return (
            <div
              key={status.value}
              className={cn(
                "flex flex-col rounded-md border-2 bg-white dark:bg-slate-800/60 p-4 shadow-sm transition-all duration-200",
                isDropTarget ? accent.drop + " shadow-lg scale-[1.01]" : accent.border,
              )}
              onDragOver={(e) => handleDragOver(e, status.value)}
              onDragLeave={() => setDragOverStatus(null)}
              onDrop={() => handleDrop(status.value)}
            >
              {/* Column header */}
              <div className="mb-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={cn("h-2 w-2 rounded-md shrink-0", accent.dot)} />
                  <h4 className={cn("text-xs font-black uppercase tracking-[0.2em]", accent.header)}>
                    {status.label}
                  </h4>
                </div>
                <span className={cn(
                  "flex h-5 min-w-5 items-center justify-center rounded-md px-1.5 text-[10px] font-black",
                  columnCards.length > 0
                    ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                    : "bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500"
                )}>
                  {columnCards.length}
                </span>
              </div>

              {/* Cards — scrollable, max 10 cards visible */}
              <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[calc(5*7.5rem)] pr-0.5 flex-1">
                {columnCards.map((card) => (
                  <div
                    key={String(card.id)}
                    draggable
                    onDragStart={() => setDraggedId(Number(card.id))}
                    onDragEnd={() => setDraggedId(null)}
                    className={cn(
                      "group cursor-grab rounded-md border bg-white dark:bg-slate-800 p-3.5 shadow-sm transition-all duration-150 shrink-0",
                      "hover:-translate-y-0.5 hover:shadow-md active:cursor-grabbing active:scale-95",
                      draggedId === Number(card.id)
                        ? "opacity-40 scale-95 rotate-1"
                        : "border-slate-200 dark:border-slate-700 hover:border-sky-300 dark:hover:border-sky-600",
                    )}
                  >
                    <div className="mb-2.5 flex items-start justify-between gap-2">
                      <span className="truncate text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">
                        {card.code || `#${card.id}`}
                      </span>
                      <div className="shrink-0">
                        {card.priority && <Badge value={String(card.priority)} />}
                        {!card.priority && card.severity && <Badge value={String(card.severity)} />}
                      </div>
                    </div>
                    <p className="text-sm font-semibold leading-snug text-slate-800 dark:text-slate-100 line-clamp-2">
                      {card.title || card.project}
                    </p>
                    {card.module && (
                      <p className="mt-1.5 text-[10px] font-medium text-slate-400 dark:text-slate-500 truncate">
                        {String(card.module)}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Drop zone — always visible at bottom */}
              <div className={cn(
                "mt-2.5 flex min-h-[4rem] shrink-0 items-center justify-center rounded-md border-2 border-dashed transition-all duration-200",
                isDropTarget
                  ? "border-sky-400 bg-sky-50/60 dark:bg-sky-900/20"
                  : "border-slate-200 dark:border-slate-700 bg-transparent",
              )}>
                <p className={cn(
                  "text-[10px] font-bold uppercase tracking-[0.18em] transition-colors",
                  isDropTarget ? "text-sky-500" : "text-slate-300 dark:text-slate-600"
                )}>
                  {isDropTarget ? "Release to move" : columnCards.length === 0 ? "Empty" : "Drop here"}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
