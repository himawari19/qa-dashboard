"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn, formatDisplayText, formatRelativeTime } from "@/lib/utils";
import { getRoleLabel } from "@/lib/roles";
import { HighlightText } from "@/components/highlight-text";
import { Badge } from "@/components/badge";
import { ClockCounterClockwise, Note, PencilSimple, X, CircleNotch, ArrowSquareOut, Image as ImageIcon } from "@phosphor-icons/react";
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

/** Fields that should render as badges */
const BADGE_FIELDS = ["status", "priority", "severity", "bugType", "typeCase", "environment", "result"];

/** Fields considered "metadata" (short, shown in compact grid) */
const METADATA_FIELDS = ["project", "projectName", "sprint", "date", "startDate", "endDate", "dueDate", "assignee", "tester", "developer", "version", "tcId", "code", "caseName", "email", "role", "skills", "category", "module", "moduleName", "feature", "relatedFeature", "suggestedDev", "createdBy", "relatedItems", "traceability", "testPlanId", "testPlanTitle", "testSuiteId", "attendees", "whatTested"];

/** Image file extensions for evidence preview */
const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".bmp"];

function isImageUrl(url: string): boolean {
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    return IMAGE_EXTENSIONS.some((ext) => pathname.endsWith(ext));
  } catch {
    return IMAGE_EXTENSIONS.some((ext) => url.toLowerCase().endsWith(ext));
  }
}

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

/** Lightbox for image preview */
function ImageLightbox({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70  p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div className="relative max-h-[90vh] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 flex h-8 w-8 items-center justify-center  bg-white text-gray-600 shadow-lg transition hover:bg-gray-100"
        >
          <X size={14} weight="bold" />
        </button>
        <img src={src} alt="Evidence preview" className="max-h-[85vh] max-w-full  object-contain shadow-md" />
      </div>
    </div>
  );
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
        <div className="flex h-14 w-14 items-center justify-center  bg-gray-100 text-gray-400">
          <ClockCounterClockwise size={24} weight="bold" />
        </div>
        <p className="text-sm font-semibold text-gray-600">No activity yet</p>
        <p className="text-xs text-gray-400">Changes to this item will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {entries.map((entry) => (
        <div key={entry.id} className="flex items-start gap-3  px-2 py-2.5 transition hover:bg-gray-50">
          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center  bg-blue-100 text-blue-600">
            <ClockCounterClockwise size={12} weight="bold" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <span className=" bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-gray-500">
                {entry.action}
              </span>
              <span className="text-[10px] text-gray-400" title={entry.createdAt}>
                {formatRelativeTime(entry.createdAt)}
              </span>
            </div>
            <p className="mt-0.5 text-xs leading-relaxed text-gray-700">{entry.summary}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ViewModal({ row, config, fieldIcons, onClose, onEdit, canEdit, module, initialTab, onTabChange }: ViewModalProps) {
  const ref = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<string>(() => {
    return isValidTab(initialTab) ? initialTab : DEFAULT_TAB;
  });
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (lightboxSrc) { setLightboxSrc(null); return; }
        onClose();
      }
    };
    document.addEventListener("keydown", keyHandler);
    return () => document.removeEventListener("keydown", keyHandler);
  }, [onClose, lightboxSrc]);

  // Sync initialTab when it changes externally
  useEffect(() => {
    if (isValidTab(initialTab) && initialTab !== activeTab) {
      setActiveTab(initialTab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTab]);

  // Track scroll for sticky header shadow
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handler = () => setScrolled(el.scrollTop > 4);
    el.addEventListener("scroll", handler, { passive: true });
    return () => el.removeEventListener("scroll", handler);
  }, []);

  const handleTabChange = (tab: string) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    onTabChange?.(tab);
  };

  const displayFields = config.fields.filter(
    (field) => row[field.name] !== undefined && row[field.name] !== null && String(row[field.name]).trim() !== "",
  );

  // Separate fields into metadata (short) and content (long)
  const metadataFields = displayFields.filter(
    (f) => METADATA_FIELDS.includes(f.name) || BADGE_FIELDS.includes(f.name),
  );
  const contentFields = displayFields.filter(
    (f) => !METADATA_FIELDS.includes(f.name) && !BADGE_FIELDS.includes(f.name),
  );

  // Determine if modal should be wider (many fields or long content)
  const hasLongContent = contentFields.some(
    (f) => f.kind === "textarea" || String(row[f.name] ?? "").length > 200,
  );
  const modalMaxWidth = hasLongContent || displayFields.length > 8 ? "max-w-2xl" : "max-w-xl";

  function renderNotes(value: string) {
    const lines = value.split(/\r?\n/).filter(Boolean);
    return (
      <div className="space-y-2 text-xs leading-relaxed text-gray-800">
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

  function renderEvidence(value: string) {
    if (!value.startsWith("http")) {
      return <p className="text-xs text-gray-800 font-semibold break-all">{value}</p>;
    }

    if (isImageUrl(value)) {
      return (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setLightboxSrc(value)}
            className="group relative block w-full overflow-hidden  border border-gray-200 bg-gray-50 transition hover:border-blue-300 "
          >
            <img
              src={value}
              alt="Evidence"
              className="h-32 w-full object-cover transition group-"
              loading="lazy"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/20">
              <div className=" bg-white/90 p-2 opacity-0 shadow-lg transition group-hover:opacity-100">
                <ArrowSquareOut size={16} weight="bold" className="text-gray-700" />
              </div>
            </div>
          </button>
          <a href={value} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline">
            <ArrowSquareOut size={11} weight="bold" /> Open in new tab
          </a>
        </div>
      );
    }

    return (
      <a href={value} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 break-all text-xs text-blue-600 hover:underline">
        <ArrowSquareOut size={12} weight="bold" className="shrink-0" />
        {value}
      </a>
    );
  }

  function renderFieldValue(field: FieldConfig) {
    const value = String(row[field.name] ?? "");
    const displayValue =
      field.kind === "select"
        ? field.options?.find(
            (opt) => opt.value === value || opt.label.toLowerCase() === value.toLowerCase(),
          )?.label ?? formatDisplayText(value)
        : value;

    // Badge fields (status, priority, etc.)
    if (BADGE_FIELDS.includes(field.name)) {
      return <Badge value={value} displayValue={displayValue} />;
    }

    // Evidence with image preview
    if (field.name === "evidence") {
      return renderEvidence(displayValue);
    }

    // Role field
    if (field.name === "role") {
      return <HighlightText text={getRoleLabel(String(row[field.name] ?? ""), String(row.company ?? ""))} query="" />;
    }

    // Notes with structured rendering
    if (field.name === "notes") {
      return renderNotes(displayValue || "-");
    }

    // Long text fields
    const isLong = field.kind === "textarea" || value.length > 120 || ["description", "notes", "content", "scope", "goal", "preconditions", "stepsToReproduce", "expectedResult", "actualResult", "actionItems", "testStep", "preCondition"].includes(field.name);

    return (
      <p className={cn("whitespace-pre-wrap break-words text-xs leading-relaxed text-gray-800", !isLong && "font-semibold")}>
        <HighlightText text={displayValue || "-"} query="" />
      </p>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4  animate-in fade-in duration-150 sm:items-center"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Lightbox */}
      {lightboxSrc && <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}

      <div
        ref={ref}
        className={cn(
          "relative flex max-h-[85vh] w-full flex-col  bg-white shadow-md animate-in slide-in-from-bottom-4 duration-150 sm:slide-in-from-bottom-0",
          modalMaxWidth,
        )}
      >
        {/* Header */}
        <div className={cn(
          "flex items-center justify-between border-b border-gray-200/60 px-5 py-3.5 transition-shadow duration-150",
          scrolled && "shadow-sm",
        )}>
          <div className="min-w-0 flex-1 pr-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center  bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-sm">
                <Note size={18} weight="bold" />
              </div>
              <div className="min-w-0">
                <p className="mb-0.5 text-[11px] font-bold uppercase tracking-widest text-blue-500">{config.shortTitle}</p>
                <h2 className="truncate text-base font-bold leading-snug text-gray-900">
                  {String(row.title || row.caseName || row.name || "Detail")}
                </h2>
                {row.code && (
                  <p className="text-[11px] font-semibold text-gray-400">{String(row.code)}</p>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <CopyLinkButton module={module} itemId={row.id} activeTab={activeTab} />
            <button
              onClick={onClose}
              className=" p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
              aria-label="Close"
            >
              <X size={16} weight="bold" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200/60 px-5">
          {VIEW_MODAL_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => handleTabChange(tab)}
              className={cn(
                "relative px-3 py-2.5 text-xs font-bold capitalize transition",
                activeTab === tab
                  ? "text-blue-700"
                  : "text-gray-500 hover:text-gray-700",
              )}
            >
              {tab === "activity" ? "Activity" : "Details"}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5  bg-blue-600" />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4">
          {activeTab === "details" && (
            <div className="space-y-4">
              {/* Metadata section: compact grid for short fields */}
              {metadataFields.length > 0 && (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {metadataFields.map((field) => {
                    const Icon = fieldIcons[field.name] ?? <Note size={14} className="text-gray-400" />;
                    return (
                      <div
                        key={field.name}
                        className=" bg-gray-50 px-3 py-2 ring-1 ring-gray-100"
                      >
                        <div className="mb-1 flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-gray-400">
                          {Icon}
                          {field.label}
                        </div>
                        {renderFieldValue(field)}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Divider between metadata and content */}
              {metadataFields.length > 0 && contentFields.length > 0 && (
                <div className="border-t border-gray-100" />
              )}

              {/* Content section: full-width for long text fields */}
              {contentFields.length > 0 && (
                <div className="space-y-3">
                  {contentFields.map((field) => {
                    const Icon = fieldIcons[field.name] ?? <Note size={16} className="text-gray-400" />;
                    const value = String(row[field.name] ?? "");
                    const isLong = field.kind === "textarea" || value.length > 120 || ["description", "notes", "content", "scope", "goal", "preconditions", "stepsToReproduce", "expectedResult", "actualResult", "actionItems", "testStep", "preCondition"].includes(field.name);

                    return (
                      <div
                        key={field.name}
                        className={cn(
                          " px-4 py-3",
                          field.name === "expectedResult" ? "bg-emerald-50 ring-1 ring-emerald-100"
                          : field.name === "actualResult" ? "bg-rose-50 ring-1 ring-rose-100"
                          : field.name === "testStep" || field.name === "stepsToReproduce" ? "bg-blue-50 ring-1 ring-blue-100"
                          : field.name === "preCondition" || field.name === "preconditions" ? "bg-amber-50 ring-1 ring-amber-100"
                          : "bg-gray-50 ring-1 ring-gray-100",
                        )}
                      >
                        <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-gray-500">
                          {Icon}
                          {field.label}
                        </div>
                        {renderFieldValue(field)}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === "activity" && (
            <ActivityTab module={module} itemId={row.id} />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-gray-200/60 px-5 py-3">
          {canEdit && (
            <button
              onClick={onEdit}
              className="inline-flex h-8 items-center gap-1.5  bg-emerald-600 px-4 text-xs font-bold text-white transition-all duration-150  hover:bg-emerald-500 "
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
