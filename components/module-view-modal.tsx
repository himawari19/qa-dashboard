"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn, formatDisplayText } from "@/lib/utils";
import { getRoleLabel } from "@/lib/roles";
import { HighlightText } from "@/components/highlight-text";
import { Note, PencilSimple, X } from "@phosphor-icons/react";

type FieldConfig = {
  name: string;
  label: string;
  kind: string;
  options?: Array<{ label: string; value: string }>;
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
};

export function ViewModal({ row, config, fieldIcons, onClose, onEdit, canEdit }: ViewModalProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", keyHandler);
    return () => document.removeEventListener("keydown", keyHandler);
  }, [onClose]);

  const displayFields = config.fields.filter(
    (field) => row[field.name] !== undefined && row[field.name] !== null && String(row[field.name]).trim() !== "",
  );

  function renderNotes(value: string) {
    const lines = value.split(/\r?\n/).filter(Boolean);
    return (
      <div className="space-y-2 text-xs leading-relaxed text-slate-800 dark:text-slate-200">
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
        className="relative flex max-h-[85vh] w-full max-w-xl flex-col rounded-2xl bg-white shadow-2xl animate-in slide-in-from-bottom-4 duration-300 sm:slide-in-from-bottom-0 dark:bg-slate-900"
      >
        <div className="flex items-center justify-between border-b border-slate-200/60 px-4 py-3 dark:border-white/10">
          <div className="min-w-0 flex-1 pr-3">
            <div className="flex items-start gap-2">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700 ring-1 ring-blue-100 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-400/20">
                <Note size={16} weight="bold" />
              </div>
              <div className="min-w-0">
                <p className="mb-0.5 text-[9px] font-black uppercase tracking-widest text-blue-500">{config.shortTitle}</p>
                <h2 className="truncate text-sm font-black leading-snug text-slate-900 dark:text-white">
                  {String(row.title || row.caseName || row.name || "Detail")}
                </h2>
                {row.code && (
                  <p className="text-[10px] font-semibold text-slate-400">{String(row.code)}</p>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            aria-label="Close"
          >
            <X size={14} weight="bold" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
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
                    "rounded-xl bg-blue-50 dark:bg-blue-950/30 px-3 py-2",
                    isLong ? "sm:col-span-2" : "",
                  )}
                >
                  <div className="mb-1 flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-slate-400">
                    {Icon}
                    {field.label}
                  </div>
                  {field.name === "evidence" && displayValue.startsWith("http") ? (
                    <a href={displayValue} target="_blank" rel="noreferrer" className="break-all text-xs text-blue-600 hover:underline">
                      {displayValue}
                    </a>
                  ) : field.name === "role" ? (
                    <HighlightText text={getRoleLabel(String(row[field.name] ?? ""))} query="" />
                  ) : field.name === "notes" ? (
                    renderNotes(displayValue || "-")
                  ) : (
                    <p className={cn("whitespace-pre-wrap break-words text-xs leading-relaxed text-slate-800 dark:text-slate-200", !isLong && "font-semibold")}>
                      <HighlightText text={displayValue || "-"} query="" />
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200/60 px-4 py-3 dark:border-white/10">
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
