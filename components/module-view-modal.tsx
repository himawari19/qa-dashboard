"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { HighlightText } from "@/components/highlight-text";

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 backdrop-blur-sm animate-in fade-in duration-200 sm:items-center"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={ref}
        className="relative flex max-h-[85vh] w-full max-w-xl flex-col rounded-xl border border-slate-200 bg-white shadow-2xl animate-in slide-in-from-bottom-4 duration-300 dark:border-slate-700 dark:bg-slate-900 sm:slide-in-from-bottom-0"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
          <div className="min-w-0 flex-1 pr-3">
            <p className="mb-0.5 text-[9px] font-black uppercase tracking-widest text-blue-500">{config.shortTitle}</p>
            <h2 className="truncate text-sm font-black leading-snug text-slate-900 dark:text-white">
              {String(row.title || row.caseName || row.name || "Detail")}
            </h2>
            {row.code && (
              <p className="text-[10px] font-semibold text-slate-400">{String(row.code)}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {displayFields.map((field) => {
              const value = String(row[field.name] ?? "");
              const isLong = field.kind === "textarea" || value.length > 120 || ["description", "notes", "content", "scope", "goal", "preconditions", "stepsToReproduce", "expectedResult", "actualResult"].includes(field.name);
              const Icon = fieldIcons[field.name] ?? <span />;

              return (
                <div
                  key={field.name}
                  className={cn(
                    "rounded-md border border-slate-100 bg-slate-50/60 px-3 py-2 dark:border-slate-800 dark:bg-slate-800/40",
                    isLong ? "sm:col-span-2" : "",
                  )}
                >
                  <div className="mb-1 flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-slate-400">
                    {Icon}
                    {field.label}
                  </div>
                  {field.name === "evidence" && value.startsWith("http") ? (
                    <a href={value} target="_blank" rel="noreferrer" className="break-all text-xs text-blue-600 hover:underline">
                      {value}
                    </a>
                  ) : (
                    <p className={cn("whitespace-pre-wrap break-words text-xs leading-relaxed text-slate-800 dark:text-slate-200", !isLong && "font-semibold")}>
                      <HighlightText text={value || "-"} query="" />
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-4 py-3 dark:border-slate-800">
          <button
            onClick={onClose}
            className="h-8 rounded-md border border-slate-200 px-4 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Close
          </button>
          {canEdit && (
            <button
              onClick={onEdit}
              className="h-8 rounded-md bg-blue-600 px-4 text-xs font-bold text-white transition hover:bg-blue-700"
            >
              Edit
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
