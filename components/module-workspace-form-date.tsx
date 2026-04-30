"use client";

import { Clock } from "@phosphor-icons/react";
import type { Dispatch, SetStateAction } from "react";
import { ModernDatePicker } from "@/components/date-picker";
import type { FormField } from "@/components/module-workspace-form-field";

type Row = Record<string, unknown> & { id?: string | number };

type Props = {
  field: FormField;
  editingRow: Row | null;
  dateWarnings: Record<string, "past" | "future">;
  setDateWarnings: Dispatch<SetStateAction<Record<string, "past" | "future">>>;
};

export function ModuleWorkspaceFormDate({ field, editingRow, dateWarnings, setDateWarnings }: Props) {
  return (
    <div className="space-y-1.5">
      <ModernDatePicker
        name={field.name}
        value={editingRow ? String(editingRow[field.name] || "") : ""}
        required={field.required}
        onChange={(val) => {
          if (!val) {
            setDateWarnings((p) => {
              const next = { ...p };
              delete next[field.name];
              return next;
            });
            return;
          }
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const picked = new Date(`${val}T00:00:00`);
          if ((field.name === "dueDate" || field.name === "endDate") && picked < today) {
            setDateWarnings((p) => ({ ...p, [field.name]: "past" }));
          } else {
            setDateWarnings((p) => {
              const next = { ...p };
              delete next[field.name];
              return next;
            });
          }
        }}
      />
      {dateWarnings[field.name] === "past" && (
        <div className="flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50/60 px-3 py-1.5 animate-in fade-in duration-200 dark:border-amber-800/40 dark:bg-amber-950/20">
          <Clock size={11} weight="bold" className="shrink-0 text-amber-600" />
          <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
            This date is in the past - double check before saving.
          </p>
        </div>
      )}
    </div>
  );
}
