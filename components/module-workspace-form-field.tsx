"use client";

import { type Dispatch, type ReactNode, type SetStateAction } from "react";
import { Note } from "@phosphor-icons/react";
import type { ModuleKey } from "@/lib/modules";
import { ModuleWorkspaceFormDate } from "@/components/module-workspace-form-date";
import { ModuleWorkspaceFormSelect } from "@/components/module-workspace-form-select";
import { ModuleWorkspaceFormText } from "@/components/module-workspace-form-text";

export type FieldOption = { label: string; value: string };

export type FormField =
  | {
      name: string;
      label: string;
      kind: "text" | "url" | "date" | "select";
      placeholder?: string;
      required?: boolean;
      readonly?: boolean;
      rows?: number;
      span?: 1 | 2 | 3;
      options?: FieldOption[];
    }
  | {
      name: string;
      label: string;
      kind: "textarea";
      placeholder?: string;
      required?: boolean;
      rows?: number;
      readonly?: boolean;
      span?: 1 | 2 | 3;
      options?: FieldOption[];
    };

type Row = Record<string, unknown> & { id?: string | number };
type DuplicateRow = { id: string | number; code: string; title: string; status: string };

type Props = {
  module: ModuleKey;
  field: FormField;
  editingRow: Row | null;
  fieldIcons: Record<string, ReactNode>;
  fieldError?: string;
  relatedOptions: Record<string, FieldOption[]>;
  selectValues: Record<string, string>;
  openSelectField: string | null;
  setOpenSelectField: (value: string | null) => void;
  setSelectValues: Dispatch<SetStateAction<Record<string, string>>>;
  duplicates: DuplicateRow[];
  sprintDuplicate: boolean;
  lastSprint: string | null;
  dateWarnings: Record<string, "past" | "future">;
  setDateWarnings: Dispatch<SetStateAction<Record<string, "past" | "future">>>;
  checkDuplicates: (title: string) => void;
  setSprintDuplicate: Dispatch<SetStateAction<boolean>>;
};

export function ModuleWorkspaceFormField({
  module,
  field,
  editingRow,
  fieldIcons,
  fieldError,
  relatedOptions,
  selectValues,
  openSelectField,
  setOpenSelectField,
  setSelectValues,
  duplicates,
  sprintDuplicate,
  lastSprint,
  dateWarnings,
  setDateWarnings,
  checkDuplicates,
  setSprintDuplicate,
}: Props) {
  const Icon = fieldIcons[field.name] || <Note size={16} />;

  return (
    <>
      <span className="flex items-center gap-2 text-[13px] font-bold text-slate-700 dark:text-slate-300">
        {Icon}
        {field.label}
        {field.required && <span className="text-rose-500">*</span>}
      </span>
      {"readonly" in field && field.readonly ? (
        <div className="flex min-h-12 w-full items-center rounded-md border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/60 px-4 py-3 text-sm text-slate-400 dark:text-slate-500 cursor-not-allowed select-none">
          {editingRow ? String(editingRow[field.name] || "—") : "—"}
          <input type="hidden" name={field.name} value={editingRow ? String(editingRow[field.name] || "") : ""} />
        </div>
      ) : field.kind === "select" ? (
        <ModuleWorkspaceFormSelect
          field={field}
          editingRow={editingRow}
          fieldError={fieldError}
          relatedOptions={relatedOptions}
          selectValues={selectValues}
          openSelectField={openSelectField}
          setOpenSelectField={setOpenSelectField}
          setSelectValues={setSelectValues}
        />
      ) : field.kind === "date" ? (
        <ModuleWorkspaceFormDate field={field} editingRow={editingRow} dateWarnings={dateWarnings} setDateWarnings={setDateWarnings} />
      ) : (
        <ModuleWorkspaceFormText
          module={module}
          field={field}
          editingRow={editingRow}
          fieldError={fieldError}
          duplicates={duplicates}
          sprintDuplicate={sprintDuplicate}
          lastSprint={lastSprint}
          checkDuplicates={checkDuplicates}
          setSprintDuplicate={setSprintDuplicate}
        />
      )}
    </>
  );
}
