"use client";

import { useEffect, useMemo, useRef, useState, useTransition, useCallback, useId } from "react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "./badge";
import { cn } from "@/lib/utils";
import { useDroppable } from "@dnd-kit/core";

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
  todo: { border: "border-gray-300", header: "text-gray-500", dot: "bg-gray-400", drop: "border-gray-400 bg-gray-50/40" },
  doing: { border: "border-blue-400", header: "text-blue-600", dot: "bg-blue-600", drop: "border-blue-400 bg-blue-50/40" },
  done: { border: "border-emerald-400", header: "text-emerald-600", dot: "bg-emerald-600", drop: "border-emerald-400 bg-emerald-50/40" },
  deferred: { border: "border-gray-400", header: "text-gray-600", dot: "bg-gray-500", drop: "border-gray-400 bg-gray-50/40" },
  open: { border: "border-red-400", header: "text-red-600", dot: "bg-red-500", drop: "border-red-400 bg-red-50/40" },
  in_progress: { border: "border-blue-400", header: "text-blue-600", dot: "bg-blue-600", drop: "border-blue-400 bg-blue-50/40" },
  ready_to_retest: { border: "border-violet-400", header: "text-violet-600", dot: "bg-violet-600", drop: "border-violet-400 bg-violet-50/40" },
  closed: { border: "border-emerald-400", header: "text-emerald-600", dot: "bg-emerald-600", drop: "border-emerald-400 bg-emerald-50/40" },
  active: { border: "border-emerald-400", header: "text-emerald-600", dot: "bg-emerald-600", drop: "border-emerald-400 bg-emerald-50/40" },
  archived: { border: "border-gray-400", header: "text-gray-600", dot: "bg-gray-500", drop: "border-gray-400 bg-gray-50/40" },
  draft: { border: "border-amber-400", header: "text-amber-600", dot: "bg-amber-500", drop: "border-amber-400 bg-amber-50/40" },
  passed: { border: "border-emerald-400", header: "text-emerald-600", dot: "bg-emerald-600", drop: "border-emerald-400 bg-emerald-50/40" },
  failed: { border: "border-rose-400", header: "text-rose-600", dot: "bg-rose-500", drop: "border-rose-400 bg-rose-50/40" },
  blocked: { border: "border-amber-400", header: "text-amber-600", dot: "bg-amber-500", drop: "border-amber-400 bg-amber-50/40" },
};

function getAccent(value: string) {
  return columnAccents[value] ?? {
    border: "border-gray-200",
    header: "text-gray-600",
    dot: "bg-gray-400",
    drop: "border-gray-200 bg-gray-50/40",
  };
}

/* ─── Sortable Card ─── */
function SortableCard({
  card,
  onViewRow,
  isDragOverlay = false,
}: {
  card: Row;
  onViewRow: (row: Row) => void;
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
    id: `card-${card.id}`,
    data: { type: "card", card },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => { if (!isDragging) onViewRow(card); }}
      className={cn(
        "cursor-grab  glass-card bg-white p-3 transition-shadow duration-150  hover:shadow-lg active:cursor-grabbing",
        isDragging && "opacity-40 shadow-none",
        isDragOverlay && "shadow-lg scale-105 rotate-[2deg] ring-2 ring-sky-400/60 opacity-100",
      )}
    >
      <div className="mb-2.5 flex items-start justify-between gap-2">
        <span className="truncate text-[11px] font-bold uppercase tracking-[0.15em] text-gray-400">
          {card.code || `#${card.id}`}
        </span>
        <div className="shrink-0">
          {card.priority && <Badge value={String(card.priority)} />}
          {!card.priority && card.severity && <Badge value={String(card.severity)} />}
        </div>
      </div>
      <p className="text-sm font-semibold leading-snug text-gray-800 line-clamp-2">
        {card.title || card.project}
      </p>
      {card.module && (
        <p className="mt-1.5 truncate text-[11px] font-medium text-gray-400">
          {String(card.module)}
        </p>
      )}
    </div>
  );
}

/* ─── Droppable Column ─── */
function KanbanColumn({
  status,
  cards,
  isOver,
  wipLimit,
  onViewRow,
}: {
  status: { label: string; value: string };
  cards: Row[];
  isOver: boolean;
  wipLimit?: number;
  onViewRow: (row: Row) => void;
}) {
  const accent = getAccent(status.value);
  const isOverWip = wipLimit !== undefined && cards.length > wipLimit;

  const { setNodeRef } = useDroppable({
    id: `column-${status.value}`,
    data: { type: "column", status: status.value },
  });

  const cardIds = useMemo(() => cards.map((c) => `card-${c.id}`), [cards]);

  return (
    <div
      className={cn(
        "flex flex-col  glass-card p-4 transition-all duration-150 border-t-4",
        isOver ? accent.drop + " shadow-md scale-[1.02]" : accent.border,
        isOverWip && "ring-2 ring-amber-400/60",
      )}
    >
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={cn("h-2 w-2  shrink-0", accent.dot)} />
          <h4 className={cn("text-xs font-bold uppercase tracking-[0.2em]", accent.header)}>
            {status.label}
          </h4>
        </div>
        <div className="flex items-center gap-1.5">
          {wipLimit !== undefined && (
            <span className={cn(
              "text-[10px] font-bold",
              isOverWip ? "text-amber-600" : "text-gray-400",
            )}>
              {cards.length}/{wipLimit}
            </span>
          )}
          <Badge value={String(cards.length)} />
          {isOverWip && (
            <span className=" bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-700" title="Over WIP limit">
              WIP
            </span>
          )}
        </div>
      </div>

      <div ref={setNodeRef} className="flex flex-col gap-2.5 min-h-[4rem]">
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          {cards.map((card) => (
            <SortableCard key={card.id} card={card} onViewRow={onViewRow} />
          ))}
        </SortableContext>

        {cards.length === 0 && !isOver && (
          <div className="flex min-h-[4rem] items-center justify-center  border-2 border-dashed border-gray-200/60">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-300">
              Empty
            </p>
          </div>
        )}
        {isOver && (
          <div className="flex min-h-[4rem] items-center justify-center  border-2 border-dashed border-sky-400 bg-sky-500/10 transition-all duration-150">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-500">
              Release to move
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main Board ─── */
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
  const dndId = useId();
  const [, startTransition] = useTransition();
  const [localRows, setLocalRows] = useState(rows);
  const [activeCard, setActiveCard] = useState<Row | null>(null);
  const [overColumnId, setOverColumnId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const statusAliases = useMemo(() => buildStatusAliases(statusOptions), [statusOptions]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

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

  const orderedRows = useMemo(
    () => localRows.slice().sort((a, b) => getRowOrder(a) - getRowOrder(b)),
    [localRows],
  );

  // Find which column a card belongs to
  const findColumnOfCard = useCallback(
    (cardId: string) => {
      const numId = Number(cardId.replace("card-", ""));
      const row = orderedRows.find((r) => Number(r.id) === numId);
      if (!row) return null;
      return statusAliases.get(normalizeStatus(getRowStatus(row))) ?? null;
    },
    [orderedRows, statusAliases],
  );

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    const card = active.data.current?.card as Row | undefined;
    if (card) setActiveCard(card);
  }

  function handleDragOver(event: DragOverEvent) {
    const { over } = event;
    if (!over) {
      setOverColumnId(null);
      return;
    }

    // Determine which column we're over
    if (over.data.current?.type === "column") {
      setOverColumnId(over.data.current.status as string);
    } else if (over.data.current?.type === "card") {
      const col = findColumnOfCard(String(over.id));
      setOverColumnId(col);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveCard(null);
    setOverColumnId(null);

    if (!over) return;

    const activeId = Number(String(active.id).replace("card-", ""));
    const activeRow = orderedRows.find((r) => Number(r.id) === activeId);
    if (!activeRow) return;

    const activeStatus = statusAliases.get(normalizeStatus(getRowStatus(activeRow))) ?? "";

    let targetStatus: string;
    let targetCardId: number | null = null;

    if (over.data.current?.type === "column") {
      targetStatus = over.data.current.status as string;
    } else if (over.data.current?.type === "card") {
      targetCardId = Number(String(over.id).replace("card-", ""));
      targetStatus = findColumnOfCard(String(over.id)) ?? activeStatus;
    } else {
      return;
    }

    // Compute new order
    let movedOrder = 0;
    setLocalRows((prev) => {
      const draggedRow = prev.find((row) => Number(row.id) === activeId);
      if (!draggedRow) return prev;

      // Get cards in target column (sorted)
      const targetColumnCards = prev
        .filter((row) => {
          const s = statusAliases.get(normalizeStatus(getRowStatus(row)));
          return s === targetStatus && Number(row.id) !== activeId;
        })
        .sort((a, b) => getRowOrder(a) - getRowOrder(b));

      // Determine insert position
      let insertIndex = targetColumnCards.length; // default: end
      if (targetCardId !== null && targetCardId !== activeId) {
        const idx = targetColumnCards.findIndex((r) => Number(r.id) === targetCardId);
        if (idx >= 0) insertIndex = idx;
      }

      // Build new column order
      const moved = { ...draggedRow, status: targetStatus };
      const newColumnCards = [
        ...targetColumnCards.slice(0, insertIndex),
        moved,
        ...targetColumnCards.slice(insertIndex),
      ];

      // Rebuild all rows with updated sortOrder
      const otherRows = prev.filter((row) => {
        const s = statusAliases.get(normalizeStatus(getRowStatus(row)));
        return s !== targetStatus && Number(row.id) !== activeId;
      });

      const allRows: Row[] = [
        ...otherRows,
        ...newColumnCards.map((row, i) => ({ ...row, sortOrder: i + 1 }) as Row),
      ];

      const dragged = allRows.find((row) => Number(row.id) === activeId);
      movedOrder = Number(dragged?.sortOrder ?? 0);
      return allRows;
    });

    startTransition(() => {
      void onUpdateStatus(activeId, targetStatus, movedOrder);
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
      <DndContext
        id={dndId}
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div
          ref={scrollRef}
          className="w-full overflow-x-auto pb-4 scroll-smooth"
          onScroll={syncScrollState}
        >
          <div className="grid min-w-max grid-flow-col auto-cols-[minmax(17rem,17rem)] gap-4 pb-2">
            {statusOptions.map((status) => {
              const columnCards = orderedRows.filter(
                (row) => statusAliases.get(normalizeStatus(getRowStatus(row))) === status.value,
              );
              const isOver = overColumnId === status.value && activeCard !== null;

              return (
                <KanbanColumn
                  key={status.value}
                  status={status}
                  cards={columnCards}
                  isOver={isOver}
                  wipLimit={wipLimits[status.value]}
                  onViewRow={onViewRow}
                />
              );
            })}
          </div>
        </div>

        {/* Drag Overlay - the floating card that follows cursor */}
        <DragOverlay dropAnimation={{
          duration: 250,
          easing: "cubic-bezier(0.25, 1, 0.5, 1)",
        }}>
          {activeCard ? (
            <SortableCard card={activeCard} onViewRow={() => {}} isDragOverlay />
          ) : null}
        </DragOverlay>
      </DndContext>

      {canScrollLeft ? (
        <button
          type="button"
          onClick={() => scrollByAmount(-320)}
          className="absolute left-2 top-1/2 z-20 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center  glass-card text-gray-700 shadow-md transition-all  hover:bg-gray-100"
          aria-label="Scroll left"
        >
          <CaretLeft size={17} weight="bold" className="text-gray-700" />
        </button>
      ) : null}
      {canScrollRight ? (
        <button
          type="button"
          onClick={() => scrollByAmount(320)}
          className="absolute right-2 top-1/2 z-20 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center  glass-card text-gray-700 shadow-md transition-all  hover:bg-gray-100"
          aria-label="Scroll right"
        >
          <CaretRight size={17} weight="bold" className="text-gray-700" />
        </button>
      ) : null}
    </div>
  );
}
