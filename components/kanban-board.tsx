"use client";

import { useEffect, useRef, useState, useTransition, type DragEvent } from "react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { Badge } from "./badge";
import { cn } from "@/lib/utils";

type Row = Record<string, string | number>;

const columnAccents: Record<string, { border: string; header: string; dot: string; drop: string }> = {
  todo: { border: "border-slate-300 dark:border-slate-600", header: "text-slate-500 dark:text-slate-400", dot: "bg-slate-400", drop: "border-slate-400 bg-slate-50/40 dark:bg-slate-800/40" },
  doing: { border: "border-blue-400 dark:border-blue-600", header: "text-blue-600 dark:text-blue-400", dot: "bg-blue-600", drop: "border-blue-400 bg-blue-50/40 dark:bg-blue-900/20" },
  done: { border: "border-emerald-400 dark:border-emerald-600", header: "text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-600", drop: "border-emerald-400 bg-emerald-50/40 dark:bg-emerald-900/20" },
  deferred: { border: "border-slate-400 dark:border-slate-600", header: "text-slate-600 dark:text-slate-400", dot: "bg-slate-500", drop: "border-slate-400 bg-slate-50/40 dark:bg-slate-800/40" },
  open: { border: "border-red-400 dark:border-red-700", header: "text-red-600 dark:text-red-400", dot: "bg-red-500", drop: "border-red-400 bg-red-50/40 dark:bg-red-900/20" },
  in_progress: { border: "border-blue-400 dark:border-blue-600", header: "text-blue-600 dark:text-blue-400", dot: "bg-blue-600", drop: "border-blue-400 bg-blue-50/40 dark:bg-blue-900/20" },
  ready_to_retest: { border: "border-violet-400 dark:border-violet-600", header: "text-violet-600 dark:text-violet-400", dot: "bg-violet-600", drop: "border-violet-400 bg-violet-50/40 dark:bg-violet-900/20" },
  closed: { border: "border-emerald-400 dark:border-emerald-600", header: "text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-600", drop: "border-emerald-400 bg-emerald-50/40 dark:bg-emerald-900/20" },
  active: { border: "border-emerald-400 dark:border-emerald-600", header: "text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-600", drop: "border-emerald-400 bg-emerald-50/40 dark:bg-emerald-900/20" },
  archived: { border: "border-slate-400 dark:border-slate-600", header: "text-slate-600 dark:text-slate-400", dot: "bg-slate-500", drop: "border-slate-400 bg-slate-50/40 dark:bg-slate-800/40" },
  draft: { border: "border-amber-400 dark:border-amber-600", header: "text-amber-600 dark:text-amber-400", dot: "bg-amber-500", drop: "border-amber-400 bg-amber-50/40 dark:bg-amber-900/20" },
  passed: { border: "border-emerald-400 dark:border-emerald-600", header: "text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-600", drop: "border-emerald-400 bg-emerald-50/40 dark:bg-emerald-900/20" },
  failed: { border: "border-rose-400 dark:border-rose-600", header: "text-rose-600 dark:text-rose-400", dot: "bg-rose-500", drop: "border-rose-400 bg-rose-50/40 dark:bg-rose-900/20" },
  blocked: { border: "border-amber-400 dark:border-amber-600", header: "text-amber-600 dark:text-amber-400", dot: "bg-amber-500", drop: "border-amber-400 bg-amber-50/40 dark:bg-amber-900/20" },
};

function getAccent(value: string) {
  return columnAccents[value] ?? {
    border: "border-slate-200 dark:border-slate-700",
    header: "text-slate-600 dark:text-slate-300",
    dot: "bg-slate-400",
    drop: "border-slate-200 bg-slate-50/40 dark:border-slate-700 dark:bg-slate-800/40",
  };
}

export function KanbanBoard({
  rows,
  statusOptions,
  onUpdateStatus,
  onViewRow,
}: {
  rows: Row[];
  statusOptions: { label: string; value: string }[];
  onUpdateStatus: (id: number, newStatus: string) => Promise<void>;
  onViewRow: (row: Row) => void;
}) {
  const [, startTransition] = useTransition();
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<string | null>(null);
  const [localRows, setLocalRows] = useState(rows);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    setLocalRows(rows);
  }, [rows]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
    const left = el.scrollLeft;
    setCanScrollLeft(left > 8);
    setCanScrollRight(left < maxScroll - 8);
  }, [localRows, statusOptions.length]);

  function handleDragOver(e: DragEvent, statusValue: string) {
    e.preventDefault();
    setDragOverStatus(statusValue);
  }

  function handleDrop(statusValue: string) {
    setDragOverStatus(null);
    if (!draggedId) return;
    setLocalRows((prev) => prev.map((row) => (row.id === draggedId ? { ...row, status: statusValue } : row)));
    const id = draggedId;
    setDraggedId(null);
    startTransition(() => {
      void onUpdateStatus(id, statusValue);
    });
  }

  function scrollByAmount(delta: number) {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: delta, behavior: "smooth" });
  }

  function syncScrollState() {
    const el = scrollRef.current;
    if (!el) return;
    const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
    const left = el.scrollLeft;
    setCanScrollLeft(left > 8);
    setCanScrollRight(left < maxScroll - 8);
  }

  return (
    <div className="relative w-full">
      <div
        ref={scrollRef}
        className="w-full overflow-x-auto pb-4 scroll-smooth"
        onScroll={syncScrollState}
      >
        <div className="grid min-w-max grid-flow-col auto-cols-[minmax(17rem,17rem)] gap-4 pb-2">
          {statusOptions.map((status) => {
            const accent = getAccent(status.value);
            const columnCards = localRows.filter((row) => row.status === status.value);
            const isDropTarget = dragOverStatus === status.value && draggedId !== null;

            return (
              <div
                key={status.value}
                className={cn(
                  "flex flex-col rounded-2xl glass-card p-4 transition-all duration-300 border-t-4",
                  isDropTarget ? accent.drop + " shadow-xl scale-[1.02]" : accent.border,
                )}
                onDragOver={(e) => handleDragOver(e, status.value)}
                onDragLeave={() => setDragOverStatus(null)}
                onDrop={() => handleDrop(status.value)}
              >
                <div className="mb-4 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={cn("h-2 w-2 rounded-md shrink-0", accent.dot)} />
                    <h4 className={cn("text-xs font-black uppercase tracking-[0.2em]", accent.header)}>
                      {status.label}
                    </h4>
                  </div>
                  <Badge value={String(columnCards.length)} />
                </div>

                <div className="flex flex-col gap-2.5">
                  {columnCards.map((card) => (
                    <div
                      key={card.id}
                      draggable
                      onClick={() => onViewRow(card)}
                      onDragStart={() => setDraggedId(Number(card.id))}
                      onDragEnd={() => {
                        setDraggedId(null);
                        setDragOverStatus(null);
                      }}
                      className="cursor-pointer rounded-xl glass-card bg-white dark:bg-slate-800/60 p-3 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
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
                        <p className="mt-1.5 truncate text-[10px] font-medium text-slate-400 dark:text-slate-500">
                          {String(card.module)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                <div
                  className={cn(
                    "mt-2.5 flex min-h-[4rem] shrink-0 items-center justify-center rounded-xl border-2 border-dashed transition-all duration-300",
                    isDropTarget
                      ? "border-sky-400 bg-sky-500/10 dark:bg-sky-400/10"
                      : "border-slate-200/60 dark:border-white/10 bg-transparent",
                  )}
                >
                  <p
                    className={cn(
                      "text-[10px] font-bold uppercase tracking-[0.18em] transition-colors",
                      isDropTarget ? "text-sky-500" : "text-slate-300 dark:text-slate-600",
                    )}
                  >
                    {isDropTarget ? "Release to move" : columnCards.length === 0 ? "Empty" : "Drop here"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {canScrollLeft ? (
        <button
          type="button"
          onClick={() => scrollByAmount(-320)}
          className="absolute left-2 top-1/2 z-20 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full glass-card text-slate-700 shadow-xl transition-all hover:scale-110 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Scroll left"
        >
          <CaretLeft size={17} weight="bold" className="text-slate-700 dark:text-slate-100" />
        </button>
      ) : null}
      {canScrollRight ? (
        <button
          type="button"
          onClick={() => scrollByAmount(320)}
          className="absolute right-2 top-1/2 z-20 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full glass-card text-slate-700 shadow-xl transition-all hover:scale-110 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Scroll right"
        >
          <CaretRight size={17} weight="bold" className="text-slate-700 dark:text-slate-100" />
        </button>
      ) : null}
    </div>
  );
}
