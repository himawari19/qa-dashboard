"use client";

import { useEffect, useMemo, useRef, useState, useTransition, type DragEvent } from"react";
import { CaretLeft, CaretRight } from"@phosphor-icons/react";
import { Badge } from"./badge";
import { cn } from"@/lib/utils";

type Row = Record<string, string | number>;

function getRowOrder(row: Row) {
 const raw = row.sortOrder ?? row.SortOrder ?? row.order ?? row.Order ?? row.position ?? row.Position ?? 0;
 const parsed = Number(raw);
 return Number.isFinite(parsed) ? parsed : 0;
}

function getRowStatus(row: Row) {
 return String(
  row.status ??
  row.Status ??
  row.state ??
  row.State ??
  row.currentStatus ??
  row.CurrentStatus ??
  "",
 );
}

function normalizeStatus(value: string) {
 return String(value ?? "").trim().toLowerCase().replace(/\s+/g, "_");
}

function buildStatusAliases(statusOptions: { label: string; value: string }[]) {
 const aliases = new Map<string, string>();
 for (const status of statusOptions) {
  const raw = String(status.value ?? "");
  aliases.set(normalizeStatus(raw), raw);
  aliases.set(normalizeStatus(status.label), raw);
 }
 aliases.set(normalizeStatus("idea"), "todo");
 aliases.set(normalizeStatus("triage"), "todo");
 aliases.set(normalizeStatus("ready"), "doing");
 aliases.set(normalizeStatus("in progress"), "doing");
 aliases.set(normalizeStatus("in_progress"), "doing");
 return aliases;
}

const columnAccents: Record<string, { border: string; header: string; dot: string; drop: string }> = {
 todo: { border:"border-slate-300", header:"text-slate-500", dot:"bg-slate-400", drop:"border-slate-400 bg-slate-50/40" },
 doing: { border:"border-blue-400", header:"text-blue-600", dot:"bg-blue-600", drop:"border-blue-400 bg-blue-50/40" },
 done: { border:"border-emerald-400", header:"text-emerald-600", dot:"bg-emerald-600", drop:"border-emerald-400 bg-emerald-50/40" },
 deferred: { border:"border-slate-400", header:"text-slate-600", dot:"bg-slate-500", drop:"border-slate-400 bg-slate-50/40" },
 open: { border:"border-red-400", header:"text-red-600", dot:"bg-red-500", drop:"border-red-400 bg-red-50/40" },
 in_progress: { border:"border-blue-400", header:"text-blue-600", dot:"bg-blue-600", drop:"border-blue-400 bg-blue-50/40" },
 ready_to_retest: { border:"border-violet-400", header:"text-violet-600", dot:"bg-violet-600", drop:"border-violet-400 bg-violet-50/40" },
 closed: { border:"border-emerald-400", header:"text-emerald-600", dot:"bg-emerald-600", drop:"border-emerald-400 bg-emerald-50/40" },
 active: { border:"border-emerald-400", header:"text-emerald-600", dot:"bg-emerald-600", drop:"border-emerald-400 bg-emerald-50/40" },
 archived: { border:"border-slate-400", header:"text-slate-600", dot:"bg-slate-500", drop:"border-slate-400 bg-slate-50/40" },
 draft: { border:"border-amber-400", header:"text-amber-600", dot:"bg-amber-500", drop:"border-amber-400 bg-amber-50/40" },
 passed: { border:"border-emerald-400", header:"text-emerald-600", dot:"bg-emerald-600", drop:"border-emerald-400 bg-emerald-50/40" },
 failed: { border:"border-rose-400", header:"text-rose-600", dot:"bg-rose-500", drop:"border-rose-400 bg-rose-50/40" },
 blocked: { border:"border-amber-400", header:"text-amber-600", dot:"bg-amber-500", drop:"border-amber-400 bg-amber-50/40" },
};

function getAccent(value: string) {
 return columnAccents[value] ?? {
 border:"border-slate-200",
 header:"text-slate-600",
 dot:"bg-slate-400",
 drop:"border-slate-200 bg-slate-50/40",
 };
}

export function KanbanBoard({
 rows,
 statusOptions,
 onUpdateStatus,
 onViewRow,
 wipLimits = {},
}: {
 rows: Row[];
 statusOptions: { label: string; value: string }[];
 onUpdateStatus: (id: number, newStatus: string, sortOrder?: number) => Promise<void>;
 onViewRow: (row: Row) => void;
 wipLimits?: Record<string, number>;
}) {
 const [, startTransition] = useTransition();
 const [draggedId, setDraggedId] = useState<number | null>(null);
 const [dragOverCardId, setDragOverCardId] = useState<number | null>(null);
 const [dragOverStatus, setDragOverStatus] = useState<string | null>(null);
 const [localRows, setLocalRows] = useState(rows);
 const scrollRef = useRef<HTMLDivElement>(null);
 const [canScrollLeft, setCanScrollLeft] = useState(false);
 const [canScrollRight, setCanScrollRight] = useState(false);
 const statusAliases = useMemo(() => buildStatusAliases(statusOptions), [statusOptions]);

 useEffect(() => {
 setLocalRows(rows);
 }, [rows]);

 useEffect(() => {
 setLocalRows((prev) => {
  let changed = false;
  const next = prev.map((row) => {
    const canonical = statusAliases.get(normalizeStatus(getRowStatus(row)));
    if (canonical && canonical !== row.status) {
     changed = true;
     return { ...row, status: canonical };
    }
    return row;
   });
   return changed ? next : prev;
  });
 }, [statusAliases]);

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

 function moveRow(sourceId: number, targetStatus: string, targetId: number | null, placeAfter = false) {
  let movedOrder = 0;
  setLocalRows((prev) => {
   const draggedRow = prev.find((row) => Number(row.id) === sourceId);
   if (!draggedRow) return prev;
   const nextStatus = targetStatus || String(getRowStatus(draggedRow));
   const remaining = prev.filter((row) => Number(row.id) !== sourceId);
   const moved = { ...draggedRow, status: nextStatus };
   const targetIndex = targetId ? remaining.findIndex((row) => Number(row.id) === targetId) : -1;
   const insertIndex = targetIndex < 0 ? remaining.length : placeAfter ? targetIndex + 1 : targetIndex;
   const next = [...remaining.slice(0, insertIndex), moved, ...remaining.slice(insertIndex)];
   const ordered = next.map((row, index) => ({ ...row, sortOrder: index + 1 } as Row & { sortOrder: number }));
   const dragged = ordered.find((row) => Number(row.id) === sourceId);
   movedOrder = Number(dragged?.sortOrder ?? 0);
   return ordered;
  });
  return movedOrder;
 }

 function handleDrop(statusValue: string) {
 setDragOverStatus(null);
 if (!draggedId) return;
 const sortOrder = moveRow(draggedId, statusValue, null);
 const id = draggedId;
 setDraggedId(null);
 startTransition(() => {
  void onUpdateStatus(id, statusValue, sortOrder);
 });
}

 function handleCardDragOver(e: DragEvent, cardId: number, statusValue: string) {
  e.preventDefault();
  setDragOverStatus(statusValue);
  setDragOverCardId(cardId);
 }

 function handleCardDrop(e: DragEvent, cardId: number, statusValue: string) {
  e.preventDefault();
  if (!draggedId || draggedId === cardId) return;
  const targetRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
  const shouldInsertAfter = e.clientY > targetRect.top + targetRect.height / 2;
  const sortOrder = moveRow(draggedId, statusValue, cardId, shouldInsertAfter);
  const id = draggedId;
  setDraggedId(null);
  setDragOverCardId(null);
  setDragOverStatus(null);
  startTransition(() => {
   void onUpdateStatus(id, statusValue, sortOrder);
  });
 }

 const orderedRows = useMemo(() => localRows.slice().sort((left, right) => getRowOrder(left) - getRowOrder(right)), [localRows]);

 function scrollByAmount(delta: number) {
 const el = scrollRef.current;
 if (!el) return;
 el.scrollBy({ left: delta, behavior:"smooth" });
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
            const columnCards = orderedRows.filter((row) => statusAliases.get(normalizeStatus(getRowStatus(row))) === status.value);
 const isDropTarget = dragOverStatus === status.value && draggedId !== null;
 const wipLimit = wipLimits[status.value];
 const isOverWip = wipLimit !== undefined && columnCards.length > wipLimit;

 return (
 <div
 key={status.value}
 className={cn(
"flex flex-col rounded-2xl glass-card p-4 transition-all duration-300 border-t-4",
 isDropTarget ? accent.drop +" shadow-xl scale-[1.02]" : accent.border,
 isOverWip && "ring-2 ring-amber-400/60",
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
 <div className="flex items-center gap-1.5">
 {wipLimit !== undefined && (
 <span className={cn(
 "text-[10px] font-bold",
 isOverWip ? "text-amber-600" : "text-slate-400",
 )}>
 {columnCards.length}/{wipLimit}
 </span>
 )}
 <Badge value={String(columnCards.length)} />
 {isOverWip && (
 <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[9px] font-black text-amber-700" title="Over WIP limit">
 WIP
 </span>
 )}
 </div>
 </div>

 <div className="flex flex-col gap-2.5">
 {columnCards.map((card) => (
 <div
 key={card.id}
 draggable
 onClick={() => onViewRow(card)}
 onDragStart={() => setDraggedId(Number(card.id))}
 onDragOver={(e) => handleCardDragOver(e, Number(card.id), status.value)}
 onDrop={(e) => handleCardDrop(e, Number(card.id), status.value)}
 onDragEnd={() => {
 setDraggedId(null);
 setDragOverStatus(null);
 setDragOverCardId(null);
 }}
 className={cn("cursor-pointer rounded-xl glass-card bg-white p-3 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg", dragOverCardId === Number(card.id) ? "ring-2 ring-sky-400" : "")}
 >
 <div className="mb-2.5 flex items-start justify-between gap-2">
 <span className="truncate text-[11px] font-black uppercase tracking-[0.15em] text-slate-400">
 {card.code ||`#${card.id}`}
 </span>
 <div className="shrink-0">
 {card.priority && <Badge value={String(card.priority)} />}
 {!card.priority && card.severity && <Badge value={String(card.severity)} />}
 </div>
 </div>
 <p className="text-sm font-semibold leading-snug text-slate-800 line-clamp-2">
 {card.title || card.project}
 </p>
 {card.module && (
 <p className="mt-1.5 truncate text-[11px] font-medium text-slate-400">
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
 ?"border-sky-400 bg-sky-500/10"
 :"border-slate-200/60 bg-transparent",
 )}
 >
 <p
 className={cn(
"text-[11px] font-bold uppercase tracking-[0.18em] transition-colors",
 isDropTarget ?"text-sky-500" :"text-slate-300",
 )}
 >
 {isDropTarget ?"Release to move" : columnCards.length === 0 ?"Empty" :"Drop here"}
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
 className="absolute left-2 top-1/2 z-20 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full glass-card text-slate-700 shadow-xl transition-all hover:scale-110 hover:bg-slate-100"
 aria-label="Scroll left"
 >
 <CaretLeft size={17} weight="bold" className="text-slate-700" />
 </button>
 ) : null}
 {canScrollRight ? (
 <button
 type="button"
 onClick={() => scrollByAmount(320)}
 className="absolute right-2 top-1/2 z-20 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full glass-card text-slate-700 shadow-xl transition-all hover:scale-110 hover:bg-slate-100"
 aria-label="Scroll right"
 >
 <CaretRight size={17} weight="bold" className="text-slate-700" />
 </button>
 ) : null}
 </div>
 );
}
