"use client";

import { CaretDown } from "@phosphor-icons/react";
import type { Dispatch, SetStateAction } from "react";
import { cn } from "@/lib/utils";
import type { FieldOption, FormField } from "@/components/module-workspace-form-field";

type Row = Record<string, unknown> & { id?: string | number };

type Props = {
  field: FormField;
  editingRow: Row | null;
  fieldError?: string;
  relatedOptions: Record<string, FieldOption[]>;
  selectValues: Record<string, string>;
  openSelectField: string | null;
  setOpenSelectField: (value: string | null) => void;
  setSelectValues: Dispatch<SetStateAction<Record<string, string>>>;
};

export function ModuleWorkspaceFormSelect({
  field,
  editingRow,
  fieldError,
  relatedOptions,
  selectValues,
  openSelectField,
  setOpenSelectField,
  setSelectValues,
}: Props) {
  return (
    <div className="relative" data-custom-select>
      <input type="hidden" name={field.name} value={selectValues[field.name] ?? ""} readOnly />
      <button
        type="button"
        onClick={() => setOpenSelectField(openSelectField === field.name ? null : field.name)}
        className={cn(
          "flex min-h-12 w-full items-center justify-between gap-3 rounded-md border bg-slate-50 dark:bg-slate-800 px-4 py-3 text-left text-sm text-slate-800 dark:text-slate-200 outline-none transition focus:bg-white dark:focus:bg-slate-700 focus:shadow-[0_0_0_4px_rgba(56,189,248,0.1)]",
          fieldError ? "border-rose-400 focus:border-rose-400" : "border-slate-200 dark:border-slate-600 focus:border-blue-300",
        )}
      >
        <span className="whitespace-normal break-words">
          {(() => {
            const options = relatedOptions[field.name] ?? field.options ?? [];
            const current = options.find((opt) => opt.value === String(selectValues[field.name] ?? ""));
            return current?.label || `Select ${field.label}`;
          })()}
        </span>
        <CaretDown size={14} weight="bold" className="shrink-0 text-slate-400" />
      </button>
      {openSelectField === field.name && (
        <div className="absolute left-0 top-full z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-md border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800">
          {(relatedOptions[field.name] ?? field.options ?? []).map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                setSelectValues((p) => ({ ...p, [field.name]: option.value }));
                setOpenSelectField(null);
              }}
              className={cn(
                "block w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700",
                selectValues[field.name] === option.value && "bg-slate-100 dark:bg-slate-700",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
