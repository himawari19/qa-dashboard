"use client";

import { useState, useEffect, useMemo, useRef, useCallback, useLayoutEffect } from "react";
import { PageShell } from "@/components/page-shell";
import { Badge } from "@/components/badge";
import { cn, formatDate } from "@/lib/utils";
import { Lightning, ClipboardText, CaretLeft, CaretRight } from "@phosphor-icons/react";
import {
  DAY_NAMES,
  DAY_PX,
  LABEL_W,
  ROW_H,
  STATUS_COLORS,
  TIMELINE_PREFS_KEY,
  addDays,
  addYears,
  buildSubHeader,
  buildTopHeader,
  deserializeDate,
  diffDays,
  endOfMonth,
  getDayLabel,
  getItemKey,
  getJakartaNow,
  getPeriodWindow,
  getScopedStorageKey,
  getScrollTargetDate,
  overlapsWindow,
  parseDate,
  serializeDate,
  startOfMonth,
  startOfWeek,
  toKey,
  ZOOM_SCALE,
} from "./gantt-helpers";
import type {
  EditModalState,
  GanttData,
  GanttItem,
  HeaderCell,
  Holidays,
  PlanTimelineRow,
  SprintTimelineRow,
  TimelineRow,
  Tooltip,
  ViewMode,
  ZoomLevel,
} from "./gantt-helpers";


// ─── component ───────────────────────────────────────────────────────────────
export default function GanttPage() {
  const [data, setData] = useState<GanttData | null>(null);
  const [holidays, setHolidays] = useState<Holidays>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "sprint" | "plan">("all");
  const [viewMode, setViewMode] = useState<ViewMode>("year");
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>("normal");
  const [focusDate, setFocusDate] = useState(() => {
    const d = getJakartaNow();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [viewportRange, setViewportRange] = useState<{ start: Date; end: Date } | null>(null);
  const [tooltip, setTooltip] = useState<Tooltip>(null);
  const [editModal, setEditModal] = useState<EditModalState | null>(null);
  const [hoveredItemKey, setHoveredItemKey] = useState<string | null>(null);
  const [now, setNow] = useState(() => getJakartaNow());
  const [timelineViewportWidth, setTimelineViewportWidth] = useState(0);
  const [visibleRowWindow, setVisibleRowWindow] = useState({ start: 0, end: 24 });
  const [storageScopeKey, setStorageScopeKey] = useState("global");
  const bodyRef = useRef<HTMLDivElement>(null);
  const rowAreaRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const isSyncingScrollRef = useRef(false);
  const scrollFrameRef = useRef<number | null>(null);
  const viewportRangeTimerRef = useRef<number | null>(null);
  const visibleRowWindowKeyRef = useRef<string>("");
  const dataRef = useRef<GanttData | null>(null);
  const currentYear = focusDate.getFullYear();

  useEffect(() => {
    fetch(`/api/gantt?year=${currentYear}`).then(r => r.json()).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, [currentYear]);

  useEffect(() => {
    fetch(`/api/gantt/holidays?year=${currentYear}`).then(r => r.json()).then(setHolidays).catch(() => {});
  }, [currentYear]);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    const tick = () => setNow(getJakartaNow());
    tick();
    const timer = window.setInterval(tick, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/profile")
      .then((response) => response.ok ? response.json() : null)
      .then((profile) => {
        if (cancelled || !profile) return;
        const scopeParts = [profile.username, profile.company, profile.id].filter(Boolean);
        setStorageScopeKey(scopeParts.join(":") || "global");
      })
      .catch(() => {
        if (!cancelled) setStorageScopeKey("global");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const rawPrefs = window.localStorage.getItem(getScopedStorageKey(TIMELINE_PREFS_KEY, storageScopeKey));
        if (rawPrefs) {
          const prefs = JSON.parse(rawPrefs) as Partial<{
            filter: "all" | "sprint" | "plan";
            viewMode: ViewMode;
            zoomLevel: ZoomLevel;
            focusDate: string;
          }>;
          if (prefs.filter) setFilter(prefs.filter);
          if (prefs.viewMode) setViewMode(prefs.viewMode);
          if (prefs.zoomLevel) setZoomLevel(prefs.zoomLevel);
          if (prefs.focusDate) {
            const parsed = deserializeDate(prefs.focusDate);
            if (!Number.isNaN(parsed.getTime())) setFocusDate(parsed);
          }
        }

      } catch {
        // Ignore malformed local storage and fall back to defaults.
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [storageScopeKey]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        getScopedStorageKey(TIMELINE_PREFS_KEY, storageScopeKey),
        JSON.stringify({
          filter,
          viewMode,
          zoomLevel,
          focusDate: serializeDate(focusDate),
        }),
      );
    } catch {
      // Ignore storage quota or privacy-blocked environments.
    }
  }, [filter, focusDate, storageScopeKey, viewMode, zoomLevel]);

  useLayoutEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const update = () => setTimelineViewportWidth(el.clientWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [loading]);

  const items: GanttItem[] = useMemo(() => {
    if (!data) return [];
    const result: GanttItem[] = [];
    if (filter !== "plan") {
      for (const s of data.sprints) {
        if (!s.startDate || !s.endDate) continue;
        result.push({
          id: s.id,
          label: s.name,
          sublabel: s.goal,
          startDate: s.startDate,
          endDate: s.endDate,
          status: s.status,
          type: "sprint",
          color: STATUS_COLORS[s.status] ?? "#94a3b8",
        });
      }
    }
    if (filter !== "sprint") {
      for (const p of data.plans) {
        if (!p.startDate || !p.endDate) continue;
        result.push({
          id: p.id,
          label: p.title,
          sublabel: p.project,
          relatedSprint: p.sprint,
          owner: p.assignee,
          startDate: p.startDate,
          endDate: p.endDate,
          status: p.status,
          type: "plan",
          color: STATUS_COLORS[p.status] ?? "#94a3b8",
        });
      }
    }
    return result.sort((a, b) => a.startDate.localeCompare(b.startDate));
  }, [data, filter]);

  const periodWindow = useMemo(() => getPeriodWindow(viewMode, focusDate), [focusDate, viewMode]);
  const periodStart = periodWindow.start;
  const periodEnd = periodWindow.end;

  const displayItems = useMemo(() => {
    return items.filter((item) => overlapsWindow(item, periodStart, periodEnd));
  }, [items, periodEnd, periodStart]);

  const sprintKeyByName = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of displayItems) {
      if (item.type === "sprint") {
        map.set(item.label, getItemKey(item));
      }
    }
    return map;
  }, [displayItems]);

  const visibleSprintCount = displayItems.filter((item) => item.type === "sprint").length;
  const visiblePlanCount = displayItems.filter((item) => item.type === "plan").length;
  const yearScrollTarget = useMemo(() => getScrollTargetDate(viewMode, focusDate), [focusDate, viewMode]);

  const timelineRows = useMemo<TimelineRow[]>(() => {
    return displayItems.map((item) => {
      const progress = item.status === "completed" || item.status === "closed"
        ? 100
        : item.status === "active"
          ? 68
          : item.status === "planning"
            ? 24
            : item.status === "draft"
              ? 12
              : 0;
      const parentKey = item.relatedSprint ? sprintKeyByName.get(item.relatedSprint) ?? null : null;
      return {
        ...item,
        depth: item.type === "plan" && parentKey ? 1 : 0,
        progress,
        parentKey,
      };
    });
  }, [displayItems, sprintKeyByName]);
  const totalRowHeight = timelineRows.length * ROW_H;
  const visibleTimelineRows = useMemo(() => {
    const start = Math.max(0, Math.min(visibleRowWindow.start, timelineRows.length));
    const end = Math.max(start, Math.min(visibleRowWindow.end, timelineRows.length));
    return timelineRows.slice(start, end).map((item, idx) => ({ item, idx: start + idx }));
  }, [timelineRows, visibleRowWindow.end, visibleRowWindow.start]);

  const viewStart = periodStart;

  const totalCols = useMemo(() => {
    return diffDays(periodStart, periodEnd) + 1;
  }, [periodEnd, periodStart]);

  const baseDayPx = Math.round(DAY_PX[viewMode] * ZOOM_SCALE[zoomLevel]);
  const dayPx = useMemo(() => {
    if (!timelineViewportWidth || totalCols <= 0) return baseDayPx;
    return Math.max(baseDayPx, Math.ceil(timelineViewportWidth / totalCols));
  }, [baseDayPx, timelineViewportWidth, totalCols]);
  const totalWidth = totalCols * dayPx;

  const rowGeometry = useMemo(() => {
    return timelineRows.map((item, idx) => {
      const s = diffDays(viewStart, parseDate(item.startDate));
      const e = diffDays(viewStart, parseDate(item.endDate));
      const left = Math.max(0, s) * dayPx;
      const right = Math.min(totalCols, e + 1) * dayPx;
      const width = Math.max(dayPx, right - left);
      return {
        item,
        idx,
        left,
        right,
        width,
        top: idx * ROW_H + 10,
        centerY: idx * ROW_H + ROW_H / 2,
      };
    });
  }, [dayPx, timelineRows, totalCols, viewStart]);
  const rowGeometryByKey = useMemo(() => {
    return new Map(rowGeometry.map((row) => [getItemKey(row.item), row]));
  }, [rowGeometry]);
  const visibleRowGeometry = useMemo(() => {
    const start = Math.max(0, Math.min(visibleRowWindow.start, rowGeometry.length));
    const end = Math.max(start, Math.min(visibleRowWindow.end, rowGeometry.length));
    return rowGeometry.slice(start, end);
  }, [rowGeometry, visibleRowWindow.end, visibleRowWindow.start]);
  const visibleRowGeometryByKey = useMemo(() => {
    return new Map(visibleRowGeometry.map((row) => [getItemKey(row.item), row]));
  }, [visibleRowGeometry]);
  const hoveredRow = useMemo(() => {
    if (!hoveredItemKey) return null;
    return rowGeometryByKey.get(hoveredItemKey) ?? null;
  }, [hoveredItemKey, rowGeometryByKey]);
  const hoveredParentKey = hoveredRow?.item.parentKey ?? null;
  const hoveredDescendantKeys = useMemo(() => {
    if (!hoveredItemKey) return new Set<string>();
    const keys = new Set<string>([hoveredItemKey]);
    for (const row of timelineRows) {
      if (row.parentKey === hoveredItemKey) keys.add(getItemKey(row));
    }
    if (hoveredParentKey) keys.add(hoveredParentKey);
    return keys;
  }, [hoveredItemKey, hoveredParentKey, timelineRows]);
  const conflictMap = useMemo(() => {
    const map = new Map<string, number>();
    for (let i = 0; i < timelineRows.length; i++) {
      const a = timelineRows[i];
      const aStart = parseDate(a.startDate);
      const aEnd = parseDate(a.endDate);
      for (let j = i + 1; j < timelineRows.length; j++) {
        const b = timelineRows[j];
        if (a.type !== b.type && a.owner !== b.owner) continue;
        const bStart = parseDate(b.startDate);
        const bEnd = parseDate(b.endDate);
        if (aStart <= bEnd && aEnd >= bStart) {
          const aKey = getItemKey(a);
          const bKey = getItemKey(b);
          map.set(aKey, (map.get(aKey) ?? 0) + 1);
          map.set(bKey, (map.get(bKey) ?? 0) + 1);
        }
      }
    }
    return map;
  }, [timelineRows]);
  const conflictItemCount = useMemo(() => {
    return Array.from(conflictMap.values()).filter((count) => count > 0).length;
  }, [conflictMap]);

  const currentTimeOffset = useMemo(() => {
    const currentKey = toKey(now);
    const periodStartKey = toKey(periodStart);
    const periodEndKey = toKey(periodEnd);
    if (currentKey < periodStartKey || currentKey > periodEndKey) return -1;
    const currentDay = parseDate(currentKey);
    const dayOffset = diffDays(viewStart, currentDay);
    return dayOffset * dayPx;
  }, [dayPx, now, periodEnd, periodStart, viewStart]);

  const topHeader = useMemo(() => buildTopHeader(viewStart, totalCols, viewMode), [viewStart, totalCols, viewMode]);
  const subHeader = useMemo(() => buildSubHeader(viewStart, totalCols, viewMode, holidays), [viewStart, totalCols, viewMode, holidays]);

  // non-workday backgrounds (week mode only)
  const nonWorkdayCols = useMemo(() => {
    if (viewMode !== "week") return [];
    return Array.from({ length: totalCols }, (_, col) => {
      const label = getDayLabel(addDays(viewStart, col), holidays);
      return label ? { col, label } : null;
    }).filter(Boolean) as { col: number; label: string }[];
  }, [viewStart, totalCols, viewMode, holidays]);

  const syncTimelineScroll = useCallback((source: "body" | "header") => {
    const body = bodyRef.current;
    const hdr = headerRef.current;
    if (!body || !hdr || isSyncingScrollRef.current) return;

    isSyncingScrollRef.current = true;
    const left = source === "body" ? body.scrollLeft : hdr.scrollLeft;
    body.scrollLeft = left;
    hdr.scrollLeft = left;

    const firstVisible = Math.max(0, Math.floor(left / dayPx));
    const visibleDays = Math.max(1, Math.ceil(body.clientWidth / dayPx));
    const start = addDays(viewStart, firstVisible);
    const end = addDays(start, visibleDays);
    if (viewportRangeTimerRef.current !== null) {
      window.clearTimeout(viewportRangeTimerRef.current);
    }
    viewportRangeTimerRef.current = window.setTimeout(() => {
      setViewportRange({ start, end });
      viewportRangeTimerRef.current = null;
    }, 120);
    window.requestAnimationFrame(() => {
      isSyncingScrollRef.current = false;
    });
  }, [dayPx, viewStart]);

  // sync header with body scroll
  useEffect(() => {
    const body = bodyRef.current;
    const hdr = headerRef.current;
    if (!body || !hdr) return;
    const scheduleSync = (source: "body" | "header") => {
      if (scrollFrameRef.current !== null) return;
      scrollFrameRef.current = window.requestAnimationFrame(() => {
        scrollFrameRef.current = null;
        syncTimelineScroll(source);
      });
    };
    const onBodyScroll = () => scheduleSync("body");
    const onHeaderScroll = () => scheduleSync("header");
    body.addEventListener("scroll", onBodyScroll, { passive: true });
    hdr.addEventListener("scroll", onHeaderScroll, { passive: true });
    syncTimelineScroll("body");
    return () => {
      if (scrollFrameRef.current !== null) {
        window.cancelAnimationFrame(scrollFrameRef.current);
        scrollFrameRef.current = null;
      }
      if (viewportRangeTimerRef.current !== null) {
        window.clearTimeout(viewportRangeTimerRef.current);
        viewportRangeTimerRef.current = null;
      }
      body.removeEventListener("scroll", onBodyScroll);
      hdr.removeEventListener("scroll", onHeaderScroll);
    };
  }, [syncTimelineScroll, loading]);

  const updateVisibleRowWindow = useCallback(() => {
    const el = rowAreaRef.current;
    if (!el || timelineRows.length === 0) return;

    const rect = el.getBoundingClientRect();
    const viewTop = window.scrollY;
    const viewBottom = viewTop + window.innerHeight;
    const areaTop = rect.top + viewTop;
    const areaHeight = totalRowHeight;
    const intersectionTop = Math.max(viewTop, areaTop);
    const intersectionBottom = Math.min(viewBottom, areaTop + areaHeight);

    const buffer = 6;
    const start = Math.max(0, Math.floor((intersectionTop - areaTop) / ROW_H) - buffer);
    const end = Math.min(timelineRows.length, Math.ceil((intersectionBottom - areaTop) / ROW_H) + buffer);
    const key = `${start}:${end}`;
    if (visibleRowWindowKeyRef.current === key) return;
    visibleRowWindowKeyRef.current = key;
    setVisibleRowWindow({ start, end });
  }, [timelineRows.length, totalRowHeight]);

  useEffect(() => {
    const handle = () => {
      window.requestAnimationFrame(updateVisibleRowWindow);
    };

    handle();
    window.addEventListener("scroll", handle, { passive: true });
    window.addEventListener("resize", handle, { passive: true });

    const el = rowAreaRef.current;
    let observer: ResizeObserver | null = null;
    if (el) {
      observer = new ResizeObserver(handle);
      observer.observe(el);
    }

    return () => {
      window.removeEventListener("scroll", handle);
      window.removeEventListener("resize", handle);
      observer?.disconnect();
    };
  }, [updateVisibleRowWindow, loading]);

  const scrollToDate = useCallback((d: Date, behavior: ScrollBehavior = "auto", align: "start" | "center" = "start") => {
    const body = bodyRef.current;
    if (!body) return;

    const rawOffset = diffDays(viewStart, d) * dayPx;
    const viewportWidth = timelineViewportWidth || body.clientWidth;
    const centeredOffset = rawOffset - (viewportWidth / 2) + (dayPx / 2);
    const offset = align === "center" ? centeredOffset : rawOffset;

    body.scrollTo({ left: Math.max(0, offset), behavior });
  }, [dayPx, timelineViewportWidth, viewStart]);

  const navPrev = useCallback(() => {
    setFocusDate((current) => addYears(current, -1));
  }, []);

  const navNext = useCallback(() => {
    setFocusDate((current) => addYears(current, 1));
  }, []);

  const focusTimelineItem = useCallback((item: TimelineRow, behavior: ScrollBehavior = "smooth") => {
    const start = parseDate(item.startDate);
    const end = parseDate(item.endDate);
    const center = addDays(start, Math.max(0, Math.floor(diffDays(start, end) / 2)));
    setFocusDate(center);
    scrollToDate(center, behavior, viewMode === "year" ? "center" : "start");
  }, [scrollToDate, viewMode]);

  useLayoutEffect(() => {
    if (loading || displayItems.length === 0 || !timelineViewportWidth) return;
    window.requestAnimationFrame(() => {
      scrollToDate(yearScrollTarget, "auto", viewMode === "year" ? "center" : "start");
    });
  }, [displayItems.length, loading, scrollToDate, timelineViewportWidth, viewMode, yearScrollTarget]);

  return (
    <PageShell
      title="Gantt / Timeline"
      eyebrow="Reports"
      crumbs={[{ label: "Dashboard", href: "/" }, { label: "Reports" }, { label: "Gantt / Timeline" }]}
      actions={
        <div className="flex items-center gap-2 flex-wrap">
          {/* Type filter */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Filter by</label>
            <div className="relative">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as "all" | "sprint" | "plan")}
                className="h-9 min-w-[170px] appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-9 text-xs font-bold text-slate-700 shadow-sm outline-none transition hover:bg-slate-50 focus:border-sky-300 dark:border-white/10 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <option value="all">All items</option>
                <option value="sprint">Sprints only</option>
                <option value="plan">Test plans only</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-slate-400">
                <CaretRight size={12} weight="bold" className="rotate-90" />
              </div>
            </div>
            <p className="text-[10px] text-slate-400">Use this to filter by item type.</p>
          </div>
          <div className="h-5 w-px bg-slate-200 dark:bg-white/10" />
          {/* View mode */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
            {(["week", "month", "year"] as const).map(m => (
              <button key={m} onClick={() => setViewMode(m)}
                className={cn("h-7 rounded-md px-3 text-xs font-bold capitalize transition",
                  viewMode === m ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                )}>
                {m}
              </button>
            ))}
          </div>
          <div className="h-5 w-px bg-slate-200 dark:bg-white/10" />
          {/* Zoom */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
            {(["tight", "normal", "wide"] as const).map(z => (
              <button key={z} onClick={() => setZoomLevel(z)}
                className={cn("h-7 rounded-md px-3 text-xs font-bold capitalize transition",
                  zoomLevel === z ? "bg-emerald-600 text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                )}>
                {z}
              </button>
            ))}
          </div>
          <div className="h-5 w-px bg-slate-200 dark:bg-white/10" />
          {/* Quick navigation */}
          <div className="flex items-center gap-1">
            <button onClick={navPrev}
              className="h-8 w-8 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition"
              title="Go to previous year">
              <CaretLeft size={14} weight="bold" />
            </button>
            <button onClick={navNext}
              className="h-8 w-8 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition"
              title="Go to next year">
              <CaretRight size={14} weight="bold" />
            </button>
          </div>
        </div>
      }
    >
      {editModal && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[2px]"
          onClick={() => setEditModal(null)}
        >
          <div
            className="w-full max-w-2xl rounded-3xl border border-slate-200/80 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-slate-950"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Date details</p>
                <h3 className="mt-2 text-xl font-black text-slate-900 dark:text-white">{editModal.item.label}</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Read-only data from test plans and test suites.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditModal(null)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-sm hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300"
              >
                Close
              </button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Type</p>
                <p className="mt-2 text-sm font-bold text-slate-900 dark:text-white">
                  {editModal.item.type === "sprint" ? "Sprint" : "Test Plan"}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Status</p>
                <div className="mt-2">
                  <Badge value={editModal.item.status} />
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Duration</p>
                <p className="mt-2 text-sm font-bold text-slate-900 dark:text-white">
                  {Math.max(1, diffDays(parseDate(editModal.startDate), parseDate(editModal.endDate)) + 1)} hari
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">ID</p>
                <p className="mt-2 text-sm font-bold text-slate-900 dark:text-white">#{editModal.item.id}</p>
              </div>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Start</p>
                <p className="mt-2 text-sm font-bold text-slate-900 dark:text-white">{formatDate(editModal.startDate)}</p>
              </div>
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">End</p>
                <p className="mt-2 text-sm font-bold text-slate-900 dark:text-white">{formatDate(editModal.endDate)}</p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Summary</p>
                <p className="mt-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {editModal.item.sublabel || "No additional summary."}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Related</p>
                <div className="mt-2 space-y-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
                  <p>
                    <span className="text-slate-500 dark:text-slate-400">Owner:</span>{" "}
                    {editModal.item.owner || "-"}
                  </p>
                  <p>
                    <span className="text-slate-500 dark:text-slate-400">Sprint:</span>{" "}
                    {editModal.item.relatedSprint || "-"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating tooltip */}
      {tooltip && (
        <div className="fixed z-[100] pointer-events-none px-2.5 py-1.5 rounded-lg bg-slate-900 text-white text-[11px] font-semibold shadow-xl whitespace-nowrap border border-white/10"
          style={{ left: tooltip.x + 14, top: tooltip.y - 36 }}>
          {tooltip.text}
          <div className="absolute left-3 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-slate-900" />
        </div>
      )}

      {loading && (
        <div className="glass-card overflow-hidden animate-pulse">
          <div className="h-12 bg-slate-100 dark:bg-slate-800" />
          {[...Array(6)].map((_, i) => <div key={i} className="h-12 border-t border-slate-100 dark:border-white/5 bg-white dark:bg-slate-900" />)}
        </div>
      )}

      {!loading && displayItems.length === 0 && (
        <div className="glass-card p-12 text-center">
          <p className="text-sm font-semibold text-slate-500">No items in the current period.</p>
          <p className="text-xs text-slate-400 mt-1">Only records that overlap the current range are shown.</p>
        </div>
      )}

      {!loading && displayItems.length > 0 && (
        <>
          <div className="mb-4 grid gap-3 lg:grid-cols-[1.4fr_0.9fr]">
            <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/80">
              <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
                  <Lightning size={18} weight="bold" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">How to use</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Drag a bar left or right to shift both start and end dates together.</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              <span className="rounded-full bg-slate-100 px-2.5 py-1 dark:bg-white/5">Click a bar to view details</span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 dark:bg-white/5">Data follows test plans</span>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/80">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Total items</p>
                <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{displayItems.length}</p>
              </div>
              <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/80">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Type mix</p>
                <p className="mt-2 text-sm font-bold text-slate-900 dark:text-white">{visibleSprintCount} sprints / {visiblePlanCount} plans</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Bars are read-only in this view.</p>
              </div>
              <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/80">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Overlap</p>
                <p className="mt-2 text-sm font-bold text-slate-900 dark:text-white">{conflictItemCount} item</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Items with potential date conflicts.</p>
              </div>
            </div>
          </div>
          {viewportRange && (
            <div className="mb-3 flex items-center justify-between rounded-2xl border border-slate-200/70 bg-white/80 px-4 py-3 text-xs font-semibold text-slate-500 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-400">
              <span>Showing {formatDate(viewportRange.start)} - {formatDate(viewportRange.end)}</span>
              <span>Swipe to shift the period</span>
            </div>
          )}
        <div className="glass-card relative overflow-hidden flex flex-col">
          {/* ── sticky header ── */}
          <div className="flex border-b-2 border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/80 sticky top-0 z-20 shadow-sm">
            {/* Label column header */}
            <div className="shrink-0 flex items-end px-4 pb-2 pt-3 border-r-2 border-slate-200 dark:border-white/10" style={{ width: LABEL_W }}>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Item</span>
            </div>

            {/* Scrollable header (mirrors body scroll) */}
            <div ref={headerRef} className="flex-1 overflow-x-auto overflow-y-hidden select-none" style={{ scrollBehavior: "auto" }}>
              <div style={{ width: totalWidth, minWidth: totalWidth, position: "relative" }}>

                {/* Weekend/holiday tint in header */}
                {nonWorkdayCols.map(({ col }) => (
                  <div key={`hnwd-${col}`} className="absolute top-0 bottom-0 bg-rose-400/[0.06] dark:bg-rose-400/[0.05] pointer-events-none"
                    style={{ left: col * dayPx, width: dayPx }} />
                ))}

                {viewMode === "month" && (
                  <div className="absolute left-2 top-1 z-[3] rounded-full bg-indigo-600/10 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-[0.22em] text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
                    {periodStart.toLocaleString("id-ID", { month: "long", year: "numeric" }).toUpperCase()}
                  </div>
                )}

                {/* Top row: month / quarter / year */}
                <div className="relative h-7 border-b border-slate-200 dark:border-white/8">
                  {topHeader.map((h, i) => (
                    <div key={i}
                      className="absolute top-0 bottom-0 flex items-center border-l border-slate-300/60 dark:border-white/10 pl-2 overflow-hidden"
                      style={{ left: h.colStart * dayPx, width: h.colSpan * dayPx }}>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 whitespace-nowrap">{h.label}</span>
                    </div>
                  ))}
                </div>

                {/* Sub row: day / week / month */}
                <div className="relative h-8">
                  {subHeader.map((h, i) => (
                    <div key={i}
                      className={cn(
                        "absolute top-0 bottom-0 flex flex-col items-center justify-center border-l overflow-hidden cursor-default",
                        h.isToday
                          ? "bg-sky-500/10 border-sky-400/60 dark:border-sky-500/50"
                          : h.nonWorkLabel
                            ? "bg-rose-400/[0.07] border-rose-300/50 dark:border-rose-700/40"
                            : "border-slate-200/70 dark:border-white/6"
                      )}
                      style={{ left: h.colStart * dayPx, width: h.colSpan * dayPx }}
                      onMouseMove={h.nonWorkLabel ? (e) => setTooltip({ x: e.clientX, y: e.clientY, text: h.nonWorkLabel! }) : undefined}
                      onMouseLeave={h.nonWorkLabel ? () => setTooltip(null) : undefined}
                    >
                      <span className={cn("text-[11px] font-bold leading-none",
                        h.isToday ? "text-sky-600 dark:text-sky-400"
                          : h.nonWorkLabel ? "text-rose-500 dark:text-rose-400"
                          : "text-slate-600 dark:text-slate-300"
                      )}>{h.label}</span>
                      {h.sublabel && (
                        <span className={cn("text-[9px] leading-none mt-0.5",
                          h.isToday ? "text-sky-500/70" : h.nonWorkLabel ? "text-rose-400/70" : "text-slate-400"
                        )}>{h.sublabel}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── body ── */}
          <div ref={rowAreaRef} className="flex relative" style={{ height: totalRowHeight }}>

            {/* Fixed label column */}
            <div className="relative shrink-0 border-r-2 border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 z-10" style={{ width: LABEL_W, height: totalRowHeight }}>
              {visibleTimelineRows.map(({ item, idx }) => (
                <div key={`lbl-${item.type}-${item.id}`}
                  className={cn(
                    "absolute left-0 right-0 flex items-center gap-2.5 px-3 border-b border-slate-100 dark:border-white/5 transition-colors",
                    item.depth === 1 && "pl-8",
                    idx % 2 === 1 ? "bg-slate-50/60 dark:bg-white/[0.015]" : "bg-white dark:bg-slate-900"
                  )}
                  style={{ top: idx * ROW_H, height: ROW_H }}>
                  <div className="shrink-0 h-6 w-6 rounded-md flex items-center justify-center text-white shadow-sm" style={{ backgroundColor: item.color }}>
                    {item.type === "sprint" ? <Lightning size={11} weight="bold" /> : <ClipboardText size={11} weight="bold" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-bold text-slate-800 dark:text-white truncate leading-tight">{item.label}</p>
                    {item.sublabel && (
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">
                        {item.sublabel}
                        {item.relatedSprint ? ` • ${item.relatedSprint}` : ""}
                      </p>
                    )}
                  </div>
                  <Badge value={item.status} />
                </div>
              ))}
            </div>

            {/* Scrollable bar area */}
            <div ref={bodyRef} className="relative flex-1 overflow-x-auto overflow-y-hidden" style={{ scrollBehavior: "auto", height: totalRowHeight }}>
              <div style={{ width: totalWidth, minWidth: totalWidth, position: "relative", height: totalRowHeight }}>

                {/* Weekend/holiday column tints */}
                {nonWorkdayCols.map(({ col, label }) => (
                  <div key={`nwd-${col}`}
                    className="absolute top-0 bottom-0 bg-rose-400/[0.06] dark:bg-rose-400/[0.05] pointer-events-auto cursor-default z-[1]"
                    style={{ left: col * dayPx, width: dayPx }}
                    onMouseMove={(e) => setTooltip({ x: e.clientX, y: e.clientY, text: label })}
                    onMouseLeave={() => setTooltip(null)}
                  />
                ))}

                {/* Current time line */}
                {currentTimeOffset >= 0 && currentTimeOffset <= totalWidth && (
                  <div className="absolute top-0 bottom-0 w-0.5 bg-sky-500/60 z-20 pointer-events-none" style={{ left: currentTimeOffset }}>
                    <div className="absolute -top-0 left-1/2 -translate-x-1/2 h-full" />
                  </div>
                )}

                {/* Alternating row backgrounds + grid lines */}
                {visibleTimelineRows.map(({ idx }) => (
                  <div key={`bg-${idx}`}
                    className={cn("absolute left-0 right-0 border-b border-slate-100 dark:border-white/5",
                      idx % 2 === 1 ? "bg-slate-50/60 dark:bg-white/[0.015]" : "bg-transparent"
                    )}
                    style={{ top: idx * ROW_H, height: ROW_H }}
                  />
                ))}

                {/* Period dividers */}
                {subHeader.map((h, i) => (
                  <div key={`div-${i}`}
                    className={cn("absolute top-0 bottom-0 w-px pointer-events-none z-[2]",
                      h.isToday ? "bg-sky-400/30" : "bg-slate-200/60 dark:bg-white/6"
                    )}
                    style={{ left: h.colStart * dayPx }}
                  />
                ))}

                <svg className="absolute inset-0 z-[3] pointer-events-none" width={totalWidth} height={totalRowHeight}>
                  {visibleRowGeometry.map((row) => {
                    if (!row.item.parentKey) return null;
                    const parent = visibleRowGeometryByKey.get(row.item.parentKey) ?? rowGeometryByKey.get(row.item.parentKey);
                    if (!parent) return null;
                    const lineKey = getItemKey(row.item);
                    const isRelated = !hoveredItemKey || hoveredDescendantKeys.has(lineKey) || hoveredDescendantKeys.has(row.item.parentKey);
                    const x1 = parent.left + parent.width;
                    const y1 = parent.centerY;
                    const x2 = row.left;
                    const y2 = row.centerY;
                    const midX = Math.max(x1 + 24, x2 - 24);
                    const curve = `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;
                    return (
                      <g key={`dep-${row.idx}`}>
                        <path d={curve} fill="none" stroke={row.item.color} strokeOpacity={isRelated ? 0.55 : 0.14} strokeWidth={isRelated ? 2 : 1.2} strokeDasharray="4 4" />
                        <circle cx={x2} cy={y2} r={isRelated ? 3.5 : 2.5} fill={row.item.color} fillOpacity={isRelated ? 0.75 : 0.25} />
                      </g>
                    );
                  })}
                </svg>

                {/* Bars */}
                {visibleRowGeometry.map((row) => {
                  const item = row.item;
                  const durationDays = Math.max(1, diffDays(parseDate(item.startDate), parseDate(item.endDate)) + 1);
                  const dateRange = `${formatDate(item.startDate)} – ${formatDate(item.endDate)} · ${durationDays} hari`;
                  const itemKey = getItemKey(item);
                  const isHovered = hoveredItemKey === itemKey;
                  const isRelated = hoveredDescendantKeys.has(itemKey);
                  const isConflicted = (conflictMap.get(itemKey) ?? 0) > 0;

                  return (
                    <div key={`bar-${item.type}-${item.id}`}
                      className="absolute z-[5] flex items-center"
                      style={{ top: row.top, height: ROW_H - 20, left: row.left, width: row.width }}>
                      <div
                        className={cn(
                          "w-full h-full rounded-md flex items-center px-2.5 overflow-hidden select-none group/bar relative transition-all cursor-pointer",
                          item.depth === 1 ? "rounded-l-none border-l-0" : "",
                          hoveredItemKey && !isRelated ? "opacity-20 saturate-50" : "opacity-100",
                          isRelated && !isHovered ? "shadow-[0_6px_18px_rgba(15,23,42,0.10)]" : "",
                          isHovered ? "ring-2 ring-sky-400/50 brightness-95" : "hover:brightness-95",
                        )}
                        style={{ backgroundColor: item.color + "20", border: `1.5px solid ${item.color}50` }}
                        onClick={() => {
                          setEditModal({ key: itemKey, item, startDate: item.startDate, endDate: item.endDate });
                          focusTimelineItem(item);
                        }}
                        onMouseMove={(e) => {
                          setHoveredItemKey(itemKey);
                          setTooltip({ x: e.clientX, y: e.clientY, text: `${item.label}  ·  ${dateRange}` });
                        }}
                        onMouseLeave={() => {
                          setHoveredItemKey(null);
                          setTooltip(null);
                        }}
                      >
                        {/* Left accent */}
                        <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-md" style={{ backgroundColor: item.color }} />
                        {item.depth === 1 && (
                          <div className="mr-2 h-6 w-4 shrink-0">
                            <div className="h-full w-px bg-slate-300/80 dark:bg-white/10" />
                            <div className="absolute mt-3 h-px w-4 bg-slate-300/80 dark:bg-white/10" />
                          </div>
                        )}
                        <span className={cn("text-[11px] font-bold truncate whitespace-nowrap", item.depth === 1 ? "pl-0" : "pl-1.5")} style={{ color: item.color }}>
                          {row.width > 80 ? item.label : row.width > 20 ? "·" : ""}
                        </span>
                        {row.width > 160 && (
                          <span className="ml-1.5 text-[9px] opacity-60 truncate whitespace-nowrap" style={{ color: item.color }}>
                            {formatDate(item.startDate)} – {formatDate(item.endDate)}
                          </span>
                        )}
                        <div className="ml-auto flex items-center gap-2 pl-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/60 dark:bg-white/10">
                            <div className="h-full rounded-full" style={{ width: `${row.item.progress}%`, backgroundColor: item.color }} />
                          </div>
                          {isConflicted && (
                            <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500/15 px-1 text-[9px] font-black text-amber-600 dark:bg-amber-400/15 dark:text-amber-300" title="Potential overlap">
                              !
                            </span>
                          )}
                          <span className="text-[9px] font-semibold uppercase tracking-widest opacity-60" style={{ color: item.color }}>
                            {item.type === "sprint" ? "Phase" : "Task"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}

              </div>
            </div>
          </div>

          {/* ── legend ── */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 px-4 py-3 border-t-2 border-slate-100 dark:border-white/8 bg-slate-50/80 dark:bg-slate-900/50">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500">
              <div className="h-3.5 w-0.5 rounded-full bg-sky-500/60 shrink-0" /> Hari Ini
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500">
              <div className="h-3.5 w-3.5 rounded bg-rose-400/15 border border-rose-300/50 shrink-0" /> Weekend / Libur Nasional
            </div>
            <div className="h-3 w-px bg-slate-300 dark:bg-white/10 mx-1" />
            {Object.entries(STATUS_COLORS).map(([status, color]) => (
              <div key={status} className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 capitalize">
                <div className="h-3.5 w-5 rounded" style={{ backgroundColor: color + "20", border: `1.5px solid ${color}60`, borderLeft: `3px solid ${color}` }} />
                {status}
              </div>
            ))}
          </div>

        </div>
      </>
      )}
    </PageShell>
  );
}
