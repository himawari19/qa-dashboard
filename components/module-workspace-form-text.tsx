"use client";

import Link from "next/link";
import { Badge } from "@/components/badge";
import { AutoResizeTextarea } from "@/components/ui/auto-resize-textarea";
import { cn } from "@/lib/utils";
import { WarningCircle } from "@phosphor-icons/react";
import type { Dispatch, SetStateAction } from "react";
import type { ModuleKey } from "@/lib/modules";
import type { FormField } from "@/components/module-workspace-form-field";

type Row = Record<string, unknown> & { id?: string | number };
type DuplicateRow = { id: string | number; code: string; title: string; status: string };

type Props = {
  module: ModuleKey;
  field: FormField;
  editingRow: Row | null;
  fieldError?: string;
  duplicates: DuplicateRow[];
  sprintDuplicate: boolean;
  lastSprint: string | null;
  checkDuplicates: (title: string) => void;
  setSprintDuplicate: Dispatch<SetStateAction<boolean>>;
};

export function ModuleWorkspaceFormText({
  module,
  field,
  editingRow,
  fieldError,
  duplicates,
  sprintDuplicate,
  lastSprint,
  checkDuplicates,
  setSprintDuplicate,
}: Props) {
  return (
    <div className="space-y-3">
      <AutoResizeTextarea
        name={field.name}
        defaultValue={editingRow ? String(editingRow[field.name] || "") : ""}
        required={field.required}
        placeholder={field.placeholder ?? `Enter ${field.label}`}
        disabled={module === "test-plans" && field.name === "scope"}
        error={!!fieldError}
        onChange={(e) => {
          if (field.name === "title" || field.name === "caseName") {
            checkDuplicates(e.target.value);
          }
          if (field.name === "sprint") {
            const val = e.target.value.trim().toLowerCase();
            if (val.length > 2) {
              fetch("/api/items/sprints")
                .then((r) => r.json())
                .then((data) => {
                  if (Array.isArray(data)) {
                    setSprintDuplicate(data.some((s) => String(s.name || "").trim().toLowerCase() === val));
                  }
                })
                .catch(() => {});
            } else {
              setSprintDuplicate(false);
            }
          }
        }}
        className={cn(field.name === "scope" && module === "test-plans" && "bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 cursor-not-allowed")}
      />
      {field.name === "sprint" && lastSprint && (
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
          <span>
            Last sprint: <span className="font-bold text-slate-700 dark:text-slate-200">{lastSprint}</span>
          </span>
        </div>
      )}
      {field.name === "sprint" && sprintDuplicate && (
        <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50/60 px-3 py-2 animate-in fade-in duration-200 dark:border-amber-800/50 dark:bg-amber-950/20">
          <WarningCircle size={13} weight="bold" className="shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
            Sprint name already exists - you can still continue, but this may link to an existing sprint.
          </p>
        </div>
      )}
      {(field.name === "title" || field.name === "caseName") && duplicates.length > 0 && (
        <div className="animate-in fade-in slide-in-from-top-1 rounded-md border border-amber-200 bg-amber-50/50 p-4 duration-300 dark:border-amber-900/50 dark:bg-amber-950/20">
          <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-400">
            <WarningCircle size={14} weight="bold" />
            Potential Duplicates Found ({duplicates.length})
          </div>
          <div className="space-y-2">
            {duplicates.map((dup) => (
              <Link
                key={dup.id}
                href={`/${module === "tasks" ? "tasks" : "bugs"}?id=${dup.id}`}
                target="_blank"
                className="group flex items-center justify-between gap-3 rounded-md border border-amber-200 bg-white p-2.5 text-xs transition hover:border-amber-400 dark:border-amber-800 dark:bg-slate-900 dark:hover:border-amber-600"
              >
                <div className="min-w-0 flex items-center gap-3">
                  <span className="shrink-0 font-black text-amber-600">{dup.code}</span>
                  <span className="truncate font-medium text-slate-700 dark:text-slate-300">{dup.title}</span>
                </div>
                <Badge value={dup.status} className="shrink-0 text-[10px]" />
              </Link>
            ))}
          </div>
          <p className="mt-3 text-[10px] italic text-amber-600 dark:text-amber-500">
            Please check these items before creating a new one to avoid redundancy.
          </p>
        </div>
      )}
      {fieldError && <p className="text-xs font-semibold text-rose-600">{fieldError}</p>}
    </div>
  );
}
