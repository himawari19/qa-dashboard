"use client";

import { useState, useRef, useEffect } from "react";
import { SlidersHorizontal, Eye, EyeSlash } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

type Column = {
  key: string;
  label: string;
};

type ColumnVisibilityToggleProps = {
  allColumns: Column[];
  visibleKeys: string[];
  onToggle: (key: string) => void;
  onReset: () => void;
};

export function ColumnVisibilityToggle({
  allColumns,
  visibleKeys,
  onToggle,
  onReset,
}: ColumnVisibilityToggleProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const hiddenCount = allColumns.length - visibleKeys.length;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        title="Toggle columns"
        className={cn(
          "inline-flex h-10 w-10 items-center justify-center rounded-lg border shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md",
          hiddenCount > 0
            ? "border-blue-300 bg-blue-50 text-blue-600 hover:bg-blue-100"
            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
        )}
      >
        <SlidersHorizontal size={18} weight="bold" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-lg border border-slate-200 bg-white shadow-xl animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
            <span className="text-xs font-bold text-slate-700">Columns</span>
            <button
              type="button"
              onClick={onReset}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800"
            >
              Reset
            </button>
          </div>
          <div className="max-h-64 overflow-y-auto p-1.5">
            {allColumns.map((col) => {
              const visible = visibleKeys.includes(col.key);
              return (
                <button
                  key={col.key}
                  type="button"
                  onClick={() => onToggle(col.key)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-xs font-medium transition",
                    visible ? "text-slate-700 hover:bg-slate-50" : "text-slate-400 hover:bg-slate-50",
                  )}
                >
                  {visible ? (
                    <Eye size={14} weight="bold" className="text-blue-600" />
                  ) : (
                    <EyeSlash size={14} weight="bold" className="text-slate-400" />
                  )}
                  {col.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
