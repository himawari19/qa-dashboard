export type GanttItem = {
  id: number;
  label: string;
  sublabel?: string;
  owner?: string;
  relatedSprint?: string;
  startDate: string;
  endDate: string;
  status: string;
  type: "sprint" | "plan";
  color: string;
};

export type TimelineRow = GanttItem & {
  depth: 0 | 1;
  progress: number;
  parentKey?: string | null;
};

export type SprintTimelineRow = {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
  goal: string;
};

export type PlanTimelineRow = {
  id: number;
  title: string;
  project: string;
  sprint: string;
  startDate: string;
  endDate: string;
  status: string;
  assignee: string;
};

export type GanttData = {
  sprints: SprintTimelineRow[];
  plans: PlanTimelineRow[];
};

export type ViewMode = "week" | "month" | "year";
export type ZoomLevel = "tight" | "normal" | "wide";

export type Holidays = Record<string, string>;

export const DAY_NAMES = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
export const STATUS_COLORS: Record<string, string> = {
  active: "#2563eb",
  planning: "#6366f1",
  completed: "#059669",
  closed: "#059669",
  draft: "#94a3b8",
  deferred: "#64748b",
};
export const DAY_PX: Record<ViewMode, number> = { week: 160, month: 48, year: 8 };
export const ZOOM_SCALE: Record<ZoomLevel, number> = { tight: 0.8, normal: 1, wide: 1.35 };
export const TIMELINE_PREFS_KEY = "qa_daily_gantt_prefs_v1";
export const LABEL_W = 240;
export const ROW_H = 48;
export const JAKARTA_TIME_ZONE = "Asia/Jakarta";

export type HeaderCell = { label: string; colStart: number; colSpan: number; isToday?: boolean; nonWorkLabel?: string; sublabel?: string };
export type Tooltip = { x: number; y: number; text: string } | null;
export type EditModalState = {
  key: string;
  item: GanttItem;
  startDate: string;
  endDate: string;
};

export function toKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function parseDate(s: string) {
  return new Date(s + "T00:00:00");
}

export function diffDays(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

export function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export function addYears(d: Date, n: number) {
  const r = new Date(d);
  r.setFullYear(r.getFullYear() + n);
  return r;
}

export function startOfWeek(d: Date) {
  const r = new Date(d);
  r.setDate(r.getDate() - ((r.getDay() + 6) % 7));
  return r;
}

export function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

export function getJakartaNow() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: JAKARTA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return new Date(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour),
    Number(map.minute),
    Number(map.second),
  );
}

export function getDayLabel(d: Date, holidays: Holidays = {}): string | null {
  const key = toKey(d);
  if (holidays[key]) return holidays[key];
  const dow = d.getDay();
  if (dow === 0) return "Minggu";
  if (dow === 6) return "Sabtu";
  return null;
}

export function buildTopHeader(viewStart: Date, totalCols: number, mode: ViewMode): HeaderCell[] {
  const cells: HeaderCell[] = [];
  let col = 0;
  while (col < totalCols) {
    const d = addDays(viewStart, col);
    let span: number;
    let label: string;
    if (mode === "week") {
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      span = Math.min(diffDays(d, monthEnd) + 1, totalCols - col);
      label = d.toLocaleString("id-ID", { month: "long", year: "numeric" });
    } else if (mode === "month") {
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      span = Math.min(diffDays(d, monthEnd) + 1, totalCols - col);
      label = d.toLocaleString("id-ID", { month: "long", year: "numeric" }).toUpperCase();
    } else {
      const yearEnd = new Date(d.getFullYear(), 11, 31);
      span = Math.min(diffDays(d, yearEnd) + 1, totalCols - col);
      label = String(d.getFullYear());
    }
    cells.push({ label, colStart: col, colSpan: span });
    col += span;
  }
  return cells;
}

export function buildSubHeader(viewStart: Date, totalCols: number, mode: ViewMode, holidays: Holidays = {}): HeaderCell[] {
  const cells: HeaderCell[] = [];
  const today = getJakartaNow();
  today.setHours(0, 0, 0, 0);

  if (mode === "week") {
    for (let col = 0; col < totalCols; col++) {
      const d = addDays(viewStart, col);
      const nonWorkLabel = getDayLabel(d, holidays) ?? undefined;
      cells.push({
        label: String(d.getDate()),
        sublabel: DAY_NAMES[d.getDay()],
        colStart: col,
        colSpan: 1,
        isToday: d.toDateString() === today.toDateString(),
        nonWorkLabel,
      });
    }
  } else if (mode === "month") {
    for (let col = 0; col < totalCols; col++) {
      const d = addDays(viewStart, col);
      const nonWorkLabel = getDayLabel(d, holidays) ?? undefined;
      cells.push({
        label: String(d.getDate()),
        sublabel: DAY_NAMES[d.getDay()],
        colStart: col,
        colSpan: 1,
        isToday: d.toDateString() === today.toDateString(),
        nonWorkLabel,
      });
    }
  } else {
    let col = 0;
    while (col < totalCols) {
      const d = addDays(viewStart, col);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const span = Math.min(diffDays(d, monthEnd) + 1, totalCols - col);
      const hasToday = d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
      cells.push({ label: d.toLocaleString("id-ID", { month: "short" }), colStart: col, colSpan: span, isToday: hasToday });
      col += span;
    }
  }
  return cells;
}

export function getItemKey(item: GanttItem) {
  return `${item.type}:${item.id}`;
}

export function getPeriodWindow(mode: ViewMode, anchor: Date) {
  if (mode === "week") {
    const start = startOfWeek(anchor);
    return { start, end: addDays(start, 6) };
  }
  if (mode === "month") {
    const start = startOfMonth(anchor);
    return { start, end: endOfMonth(start) };
  }
  const start = new Date(anchor.getFullYear(), 0, 1);
  const end = new Date(anchor.getFullYear(), 12, 0);
  return { start, end };
}

export function getScrollTargetDate(mode: ViewMode, anchor: Date) {
  if (mode === "year") return new Date(anchor.getFullYear(), anchor.getMonth(), 15);
  return anchor;
}

export function serializeDate(d: Date) {
  return toKey(d);
}

export function deserializeDate(value: string) {
  return parseDate(value);
}

export function getScopedStorageKey(base: string, scope: string) {
  return `${base}:${scope}`;
}

export function overlapsWindow(item: Pick<GanttItem, "startDate" | "endDate">, start: Date, end: Date) {
  const itemStart = parseDate(item.startDate);
  const itemEnd = parseDate(item.endDate);
  return itemStart <= end && itemEnd >= start;
}
