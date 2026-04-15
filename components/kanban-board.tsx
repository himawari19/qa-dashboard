"use client";

import { useState, useTransition } from "react";
import { Badge } from "./badge";
import { cn } from "@/lib/utils";

type Row = Record<string, string | number>;

export function KanbanBoard({
  rows,
  statusOptions,
  onUpdateStatus,
}: {
  rows: Row[];
  statusOptions: { label: string; value: string }[];
  onUpdateStatus: (id: number, newStatus: string) => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();
  const [draggedId, setDraggedId] = useState<number | null>(null);
  
  // Local optimistic state for instant UI update
  const [localRows, setLocalRows] = useState(rows);

  // Sync when props change
  if (rows !== localRows && !isPending) {
    setLocalRows(rows);
  }

  function handleDragStart(id: number) {
    setDraggedId(id);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault(); // Necessary to allow dropping
  }

  function handleDrop(statusValue: string) {
    if (!draggedId) return;

    // Optimistic update
    setLocalRows((prev) =>
      prev.map((row) =>
        row.id === draggedId ? { ...row, status: statusValue } : row
      )
    );

    startTransition(() => {
      void onUpdateStatus(draggedId, statusValue);
      setDraggedId(null);
    });
  }

  return (
    <div className="flex w-full gap-4 overflow-x-auto pb-4">
      {statusOptions.map((status) => {
        const columnCards = localRows.filter((row) => row.status === status.value);

        return (
          <div
            key={status.value}
            className="flex w-80 shrink-0 flex-col rounded-md bg-slate-100 p-3"
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(status.value)}
          >
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                {status.label}
              </h4>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600">
                {columnCards.length}
              </span>
            </div>

            <div className="flex flex-1 flex-col gap-3 min-h-[150px]">
              {columnCards.map((card) => (
                <div
                  key={String(card.id)}
                  draggable
                  onDragStart={() => handleDragStart(Number(card.id))}
                  onDragEnd={() => setDraggedId(null)}
                  className={cn(
                    "cursor-grab rounded border border-slate-200 bg-white p-3 shadow-sm transition hover:border-sky-300 active:cursor-grabbing",
                    draggedId === Number(card.id) && "opacity-50"
                  )}
                >
                  <div className="mb-2 flex items-start justify-between">
                    <span className="text-xs font-semibold tracking-wider text-slate-500">
                      {card.code || `#${card.id}`}
                    </span>
                    {card.priority && <Badge value={String(card.priority)} />}
                    {!card.priority && card.severity && <Badge value={String(card.severity)} />}
                  </div>
                  <p className="text-sm font-medium text-slate-800 line-clamp-3">
                    {card.title || card.project}
                  </p>
                </div>
              ))}
              {columnCards.length === 0 && (
                <div className="flex h-full items-center justify-center rounded border-2 border-dashed border-slate-300 p-4">
                  <p className="text-xs font-medium text-slate-400">Drop here</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
