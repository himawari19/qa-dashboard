"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn, formatDisplayText, formatRelativeTime } from "@/lib/utils";
import { getRoleLabel } from "@/lib/roles";
import { HighlightText } from "@/components/highlight-text";
import { ClockCounterClockwise, Note, PencilSimple, X, CircleNotch } from "@phosphor-icons/react";
import { CopyLinkButton } from "@/components/copy-link-button";

type FieldConfig = {
  name: string;
  label: string;
  kind: string;
  options?: Array<{ label: string; value: string }>;
};

/** Available tabs in the detail view modal */
const VIEW_MODAL_TABS = ["details", "activity"] as const;
const DEFAULT_TAB = "details";

type ActivityEntry = {
  id: number;
  action: string;
  summary: string;
  createdAt: string;
};

type ViewModalProps = {
  row: Record<string, string | number>;
  config: {
    shortTitle: string;
    fields: FieldConfig[];
  };
  fieldIcons: Record<string, ReactNode>;
  onClose: () => void;
  onEdit: () => void;
  canEdit: boolean;
  module: string;
  initialTab?: string | null;
  onTabChange?: (tab: string) => void;
};

function isValidTab(tab: string | null | undefined): tab is string {
  if (!tab) return false;
  return (VIEW_MODAL_TABS as readonly string[]).includes(tab);
}

function ActivityTab({ module, itemId }: { module: string; itemId: string | number }) {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/activity/${module}/${itemId}`)
      .then((r) => r.json())
      .then((d) => { setEntries(d.entries || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [module, itemId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <CircleNotch size={24} weight="bold" className="animate-spin text-blue-500" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
          <ClockCounterClockwise size={24} weight="bold" />
        </div>
        <p className="text-sm font-semibold text-slate-600">No activity yet</p>
        <p className="text-xs text-slate-400">Changes to this item will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {entries.map((entry) => (
        <div key={entry.id} className="flex items-start gap-3 rounded-lg px-2 py-2.5 transition hover:bg-slate-50">
          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            <ClockCounterClockwise size={12} weight="bold" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-slate-500">
                {entry.action}
              </span>
              <span className="text-[10px] text-slate-400" title={entry.createdAt}>
                {formatRelativeTime(entry.createdAt)}
              </span>
            </div>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-700">{entry.summary}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ViewModal({ row, config, fieldIcons, onClose, onEdit, canEdit, module, initialTab, onTabChange }: ViewModalProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<string>(() => {
    return isValidTab(initialTab) ? initialTab : DEFAULT_TAB;
  });

  useEffect(() => {
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", keyHandler);
    return () => document.removeEventListener("keydown", keyHandler);
  }, [onClose]);

  // Sync initialTab when it changes externally
  useEffect(() => {
    if (isValidTab(initialTab) && initialTab !== activeTab) {
      setActiveTab(initialTab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTab]);

  const handleTabChange = (tab: string) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    onTabChange?.(tab);
  };

  const displayFields = config.fields.filter(
    (field) => row[field.name] !== undefined && row[field.name] !== null && String(row[field.name]).trim() !== "",
  );

  function renderNotes(value: string) {
    const lines = value.split(/\r?\n/).filter(Boolean);
    return (
      <div className="space-y-2 text-xs leading-relaxed text-slate-800">
        {lines.map((line, index) => {
          const match = line.match(/^(\d+\.\s*)?(?:\*\*)?(.+?)(?:\*\*)?:\s*(.+)$/);
          if (match) {
            const [, prefix = "", title, body] = match;
            return (
              <p key={`${index}-${title}`} className="whitespace-pre-wrap break-words">
                <span className="font-semibold">{prefix}</span>
                <span className="font-bold">{title}:</span> {body}
              </p>
            );
          }
          return (
            <p key={`${index}-${line}`} className="whitespace-pre-wrap break-words">
              {line}
            </p>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 backdrop-blur-sm animate-in fade-in duration-200 sm:items-center"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={ref}
        className="relative flex max-h-[85vh] w-full max-w-xl flex-col rounded-2xl bg-white shadow-2xl animate-in slide-in-from-bottom-4 duration-300 sm:slide-in-from-bottom-0"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200/60 px-4 py-3">
          <div className="min-w-0 flex-1 pr-3">
            <div className="flex items-start gap-2">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700 ring-1 ring-blue-100">
                <Note size={16} weight="bold" />
              </div>
              <div className="min-w-0">
                <p className="mb-0.5 text-[10px] font-black uppercase tracking-widest text-blue-500">{config.shortTitle}</p>
                <h2 className="truncate text-sm font-black leading-snug text-slate-900">
                  {String(row.title || row.caseName || row.name || "Detail")}
                </h2>
                {row.code && (
                  <p className="text-[11px] font-semibold text-slate-400">{String(row.code)}</p>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <CopyLinkButton module={module} itemId={row.id} activeTab={activeTab} />
            <button
              onClick={onClose}
              className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label="Close"
            >
              <X size={14} weight="bold" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200/60 px-4">
          {VIEW_MODAL_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => handleTabChange(tab)}
              className={cn(
                "relative px-3 py-2.5 text-xs font-bold capitalize transition",
                activeTab === tab
                  ? "text-blue-700"
                  : "text-slate-500 hover:text-slate-700",
              )}
            >
              {tab === "activity" ? "Activity" : "Details"}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-blue-600" />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {activeTab === "details" && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {displayFields.map((field) => {
                const value = String(row[field.name] ?? "");
                const isLong = field.kind === "textarea" || value.length > 120 || ["description", "notes", "content", "scope", "goal", "preconditions", "stepsToReproduce", "expectedResult", "actualResult"].includes(field.name);
                const Icon = fieldIcons[field.name] ?? <Note size={16} className="text-slate-400" />;
                const displayValue =
                  field.kind === "select"
                    ? field.options?.find(
                        (opt) => opt.value === value || opt.label.toLowerCase() === value.toLowerCase(),
                      )?.label ?? formatDisplayText(value)
                    : value;

                return (
                  <div
                    key={field.name}
                    className={cn(
                      "rounded-xl bg-blue-50 px-3 py-2",
                      isLong ? "sm:col-span-2" : "",
                    )}
                  >
                    <div className="mb-1 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {Icon}
                      {field.label}
                    </div>
                    {field.name === "evidence" && displayValue.startsWith("http") ? (
                      <a href={displayValue} target="_blank" rel="noreferrer" className="break-all text-xs text-blue-600 hover:underline">
                        {displayValue}
                      </a>
                    ) : field.name === "role" ? (
                      <HighlightText text={getRoleLabel(String(row[field.name] ?? ""), String(row.company ?? ""))} query="" />
                    ) : field.name === "notes" ? (
                      renderNotes(displayValue || "-")
                    ) : (
                      <p className={cn("whitespace-pre-wrap break-words text-xs leading-relaxed text-slate-800", !isLong && "font-semibold")}>
                        <HighlightText text={displayValue || "-"} query="" />
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === "activity" && (
            <ActivityTab module={module} itemId={row.id} />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-200/60 px-4 py-3">
          {canEdit && (
            <button
              onClick={onEdit}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-emerald-600 px-4 text-xs font-bold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-500 hover:shadow-md"
            >
              <PencilSimple size={12} weight="bold" />
              Edit
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
