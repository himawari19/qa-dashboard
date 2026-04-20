"use client";

import { useEffect, useState, useTransition } from "react";
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

  useEffect(() => {
    setLocalRows(rows);
  }, [rows]);

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
    <div className="flex w-full gap-5 overflow-x-auto pb-4 snap-x snap-mandatory lg:flex-nowrap flex-col lg:flex-row">
      {statusOptions.map((status) => {
        const columnCards = localRows.filter((row) => row.status === status.value);

        return (
          <div
            key={status.value}
            className="flex w-full lg:min-w-[19rem] snap-start shrink-0 flex-col rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm"
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(status.value)}
          >
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-sm font-black uppercase tracking-[0.22em] text-slate-700">
                {status.label}
              </h4>
              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-slate-100 px-2 text-xs font-black text-slate-600">
                {columnCards.length}
              </span>
            </div>

            <div className="flex flex-1 flex-col gap-3 min-h-[160px]">
              {columnCards.map((card) => (
                <div
                  key={String(card.id)}
                  draggable
                  onDragStart={() => handleDragStart(Number(card.id))}
                  onDragEnd={() => setDraggedId(null)}
                  className={cn(
                    "cursor-grab rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-300 hover:bg-white hover:shadow-md active:cursor-grabbing",
                    draggedId === Number(card.id) && "opacity-50"
                  )}
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">
                      {card.code || `#${card.id}`}
                    </span>
                    <div className="shrink-0">
                      {card.priority && <Badge value={String(card.priority)} />}
                      {!card.priority && card.severity && <Badge value={String(card.severity)} />}
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-slate-800 line-clamp-3">
                    {card.title || card.project}
                  </p>
                </div>
              ))}
              {columnCards.length === 0 && (
                <div className="flex h-full min-h-[10rem] items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Drop here</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
