"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Clock,
  User,
  Users,
  CaretDown,
  CaretUp,
  SpinnerGap,
  Bug,
  Kanban,
  Checks,
  ClipboardText,
  PlayCircle,
} from "@phosphor-icons/react";
import { cn, formatDisplayText } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────

interface ActivityEntry {
  id: number;
  entityType: string;
  entityId: string;
  action: string;
  summary: string;
  createdAt: string;
}

interface CollapsedGroup {
  count: number;
  action: string;
  entityType: string;
  actor: string;
  entries: ActivityEntry[];
  startTime: string;
  endTime: string;
}

interface ActivityFeedResponse {
  entries: ActivityEntry[];
  collapsed: CollapsedGroup[];
}

// ── Entity Icon Map ────────────────────────────────────────────────────────

const ENTITY_ICON: Record<string, React.ReactNode> = {
  Task: <Kanban size={12} weight="bold" className="text-blue-500" />,
  Bug: <Bug size={12} weight="bold" className="text-rose-500" />,
  TestCase: <Checks size={12} weight="bold" className="text-emerald-500" />,
  TestSuite: <ClipboardText size={12} weight="bold" className="text-indigo-500" />,
  Session: <PlayCircle size={12} weight="bold" className="text-amber-500" />,
};

// ── Main Component ─────────────────────────────────────────────────────────

export function ActivityFeedFilter() {
  const [scope, setScope] = useState<"my" | "team">("team");
  const [data, setData] = useState<ActivityFeedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  const savedScrollRef = useRef<number>(0);

  const fetchActivity = useCallback(async (selectedScope: "my" | "team") => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard/activity?scope=${selectedScope}`);
      if (!res.ok) throw new Error("Failed to fetch activity");
      const json: ActivityFeedResponse = await res.json();
      setData(json);
    } catch {
      setData({ entries: [], collapsed: [] });
    } finally {
      setLoading(false);
      // Restore scroll position after data renders
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = savedScrollRef.current;
        }
      });
    }
  }, []);

  useEffect(() => {
    fetchActivity(scope);
  }, [fetchActivity, scope]);

  const handleToggle = (newScope: "my" | "team") => {
    if (newScope === scope) return;
    // Save scroll position before fetching new data
    savedScrollRef.current = scrollRef.current?.scrollTop ?? 0;
    setScope(newScope);
    setExpandedGroups(new Set());
  };

  const toggleGroupExpand = (groupKey: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupKey)) {
        next.delete(groupKey);
      } else {
        next.add(groupKey);
      }
      return next;
    });
  };

  const hasEntries = data && (data.entries.length > 0 || data.collapsed.length > 0);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      {/* Header with toggle */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-700">
          Recent Activity
        </h3>
        <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-0.5">
          <button
            onClick={() => handleToggle("team")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-bold transition-all",
              scope === "team"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            <Users size={12} weight="bold" />
            Team Activity
          </button>
          <button
            onClick={() => handleToggle("my")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-bold transition-all",
              scope === "my"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            <User size={12} weight="bold" />
            My Activity
          </button>
        </div>
      </div>

      {/* Content area */}
      <div ref={scrollRef} className="max-h-80 overflow-y-auto pr-1">
        {loading ? (
          <LoadingState />
        ) : !hasEntries ? (
          <EmptyState scope={scope} />
        ) : (
          <div className="space-y-1.5">
            {/* Collapsed groups */}
            {data.collapsed.map((group, i) => {
              const groupKey = `${group.action}-${group.entityType}-${group.actor}-${group.startTime}`;
              const isExpanded = expandedGroups.has(groupKey);
              return (
                <CollapsedActivityEntry
                  key={groupKey}
                  group={group}
                  isExpanded={isExpanded}
                  onToggle={() => toggleGroupExpand(groupKey)}
                />
              );
            })}

            {/* Individual entries */}
            {data.entries.map((entry) => (
              <ActivityEntryRow key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ── Sub-Components ─────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-2">
      <SpinnerGap size={24} weight="bold" className="animate-spin text-slate-400" />
      <p className="text-xs font-semibold">Loading activity...</p>
    </div>
  );
}

function EmptyState({ scope }: { scope: "my" | "team" }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-2">
      <Clock size={28} weight="bold" className="text-slate-300" />
      <p className="text-xs font-semibold">
        No activity found for {scope === "my" ? "your" : "team"} filter.
      </p>
    </div>
  );
}

function CollapsedActivityEntry({
  group,
  isExpanded,
  onToggle,
}: {
  group: CollapsedGroup;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const displayEntries = group.entries.slice(0, 50);
  const remainingCount = group.entries.length > 50 ? group.entries.length - 50 : 0;

  return (
    <div className="rounded-lg border border-slate-100">
      {/* Collapsed summary row */}
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-2.5 px-3 py-2 hover:bg-slate-50 transition rounded-lg text-left"
      >
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-blue-200 bg-blue-50">
          {ENTITY_ICON[group.entityType] ?? (
            <Clock size={11} className="text-slate-400" weight="bold" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-slate-700 leading-tight">
            {group.count} {formatDisplayText(group.entityType)}{" "}
            {group.action} by {group.actor}
          </p>
          <p className="text-[10px] text-slate-400">
            {formatTimeRange(group.startTime, group.endTime)}
          </p>
        </div>
        <div className="shrink-0 text-slate-400">
          {isExpanded ? (
            <CaretUp size={11} weight="bold" />
          ) : (
            <CaretDown size={11} weight="bold" />
          )}
        </div>
      </button>

      {/* Expanded entries */}
      {isExpanded && (
        <div className="border-t border-slate-100 px-3 py-1.5 space-y-0.5">
          {displayEntries.map((entry) => (
            <ActivityEntryRow key={entry.id} entry={entry} compact />
          ))}
          {remainingCount > 0 && (
            <p className="text-[10px] font-semibold text-slate-400 text-center py-1">
              +{remainingCount} more entries
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function ActivityEntryRow({
  entry,
  compact = false,
}: {
  entry: ActivityEntry;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "animate-activity-fade-in flex items-center gap-2.5 border-b border-slate-50 last:border-0",
        compact ? "py-1" : "py-1.5"
      )}
    >
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full border",
          compact ? "h-5 w-5" : "h-6 w-6",
          entry.action === "create"
            ? "border-emerald-200 bg-emerald-50"
            : entry.action === "delete"
            ? "border-rose-200 bg-rose-50"
            : "border-slate-200 bg-slate-50"
        )}
      >
        {ENTITY_ICON[entry.entityType] ?? (
          <Clock size={compact ? 9 : 11} className="text-slate-400" weight="bold" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "font-semibold text-slate-700 truncate leading-tight",
            compact ? "text-[11px]" : "text-[11px]"
          )}
        >
          {entry.summary}
        </p>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-slate-400">
            {formatDisplayText(entry.entityType)}
          </span>
          <span className="text-[10px] text-slate-300">·</span>
          <span className="text-[10px] text-slate-400">
            {entry.createdAt?.slice(0, 16).replace("T", " ")}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Utilities ──────────────────────────────────────────────────────────────

function formatTimeRange(startTime: string, endTime: string): string {
  const start = startTime?.slice(0, 16).replace("T", " ");
  const end = endTime?.slice(11, 16); // just time portion
  if (start && end) return `${start} – ${end}`;
  return start || "";
}
