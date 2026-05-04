"use client";

import Link from "next/link";
import { Badge } from "@/components/badge";
import { AutoResizeTextarea } from "@/components/ui/auto-resize-textarea";
import { cn } from "@/lib/utils";
import { Info, WarningCircle } from "@phosphor-icons/react";
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
  checkSprintDuplicate: (sprint: string) => void;
  setSprintDuplicate: Dispatch<SetStateAction<boolean>>;
  versionSequenceLabel?: string;
};

function getNextVersion(version: string) {
  const match = version.match(/^(v?)(\d+)\.(\d+)\.(\d+)$/i);
  if (!match) return "";
  const [, prefix, major, minor, patch] = match;
  return `${prefix}${major}.${minor}.${Number(patch) + 1}`;
}

export function ModuleWorkspaceFormText({
  module,
  field,
  editingRow,
  fieldError,
  duplicates,
  sprintDuplicate,
  lastSprint,
  checkDuplicates,
  checkSprintDuplicate,
  setSprintDuplicate,
  versionSequenceLabel,
}: Props) {
  const value = editingRow ? String(editingRow[field.name] || "") : "";
  const isLocked = Boolean(field.readonly);
  const versionValue = versionSequenceLabel?.trim() || "";
  const nextVersion = versionValue ? getNextVersion(versionValue) : "";
  const initialValue = field.helperKind === "version-sequence" && !editingRow && nextVersion ? nextVersion : value;

  if (isLocked) {
    return (
      <div className="flex min-h-12 w-full items-center rounded-md border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/60 px-4 py-3 text-sm text-slate-400 dark:text-slate-500 cursor-not-allowed select-none">
        {value || "—"}
        <input type="hidden" name={field.name} value={value} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <AutoResizeTextarea
          name={field.name}
          defaultValue={initialValue}
          rows={field.kind === "textarea" ? (field.rows ?? 4) : 1}
          required={field.required}
          placeholder={field.placeholder ?? `Enter ${field.label}`}
          disabled={module === "test-plans" && field.name === "scope"}
          error={!!fieldError}
          onChange={(e) => {
            if (field.name === "title" || field.name === "caseName") {
              checkDuplicates(e.target.value);
            }
            if (field.name === "sprint") {
              checkSprintDuplicate(e.target.value);
            }
          }}
          className={cn(
            field.kind === "textarea" ? "min-h-28" : "min-h-12 overflow-y-hidden",
            field.helperKind === "version-sequence" && "pr-10",
            field.name === "scope" && module === "test-plans" && "bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 cursor-not-allowed",
          )}
        />
        {field.helperKind === "version-sequence" && (
          <span
            className="group absolute right-3 top-1/2 -translate-y-1/2 inline-flex h-5 w-5 items-center justify-center rounded-full text-sky-600 outline-none dark:text-sky-300"
          >
            <Info size={14} weight="bold" />
            <span className="pointer-events-none absolute right-0 bottom-full z-20 mb-2 w-max max-w-[240px] translate-y-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-700 opacity-0 shadow-lg transition group-hover:translate-y-0 group-hover:opacity-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
              {versionValue ? (
                <>
                  Based on <span className="font-black">{versionValue}</span>
                  {nextVersion ? (
                    <>
                      {" "}
                      | next <span className="font-black">{nextVersion}</span>
                    </>
                  ) : null}
                </>
              ) : (
                "Version auto-filled from the latest entry."
              )}
            </span>
          </span>
        )}
      </div>
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
