"use client";

import { type Dispatch, type ReactNode, type SetStateAction } from "react";
import { cn } from "@/lib/utils";
import { ModuleWorkspaceFormField, type FieldOption, type FormField } from "@/components/module-workspace-form-field";
import type { ModuleKey } from "@/lib/modules";

type Row = Record<string, unknown> & { id?: string | number };
type DuplicateRow = { id: string | number; code: string; title: string; status: string };

type ModuleWorkspaceFormProps = {
  module: ModuleKey;
  shortTitle: string;
  fields: FormField[];
  editingRow: Row | null;
  hiddenFields: string[];
  fieldIcons: Record<string, ReactNode>;
  fieldErrors: Record<string, string>;
  canAdd: boolean;
  canEdit: boolean;
  pending: boolean;
  isViewer: boolean;
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
  onFormChange: () => void;
  onSubmit: (formData: FormData) => void;
  onCancel: () => void;
  checkDuplicates: (title: string) => void;
  checkSprintDuplicate: (sprint: string) => void;
  versionSequenceLabel?: string;
  versionSequenceDefaultValue?: string;
};

export function ModuleWorkspaceForm({
  module,
  shortTitle,
  fields,
  editingRow,
  hiddenFields,
  fieldIcons,
  fieldErrors,
  canAdd,
  canEdit,
  pending,
  isViewer,
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
  onFormChange,
  onSubmit,
  onCancel,
  checkDuplicates,
  checkSprintDuplicate,
  versionSequenceLabel,
  versionSequenceDefaultValue,
}: ModuleWorkspaceFormProps) {
  return (
    <div id="module-form-section" className="rounded-2xl border-t border-slate-200/60 dark:border-white/10 bg-transparent px-6 py-6 mb-6">
      <div className="mb-6 grid gap-3 sm:flex sm:items-center sm:justify-between">
        <div>
          <h3 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            {editingRow ? `Edit ${shortTitle}` : `Create New ${shortTitle}`}
          </h3>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
            {editingRow ? "Update existing data." : "Fill in new data with a consistent format for import/export and tracking."}
          </p>
        </div>
      </div>

      <form
        id={`${module}-form`}
        className="rounded-2xl glass-card bg-white p-8 shadow-2xl"
        onChange={onFormChange}
        onSubmit={(event) => {
          event.preventDefault();
          if (!canAdd && !editingRow) return;
          if (!canEdit && editingRow) return;
          onSubmit(new FormData(event.currentTarget));
        }}
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {fields
            .filter((field) => !(module === "test-plans" && field.name === "assignee"))
            .filter((field) => !hiddenFields.includes(field.name))
            .map((field) => {
              const spanClass =
                field.span === 3 ? "md:col-span-3" :
                field.span === 2 ? "md:col-span-2" :
                "md:col-span-1";

              return (
                <label key={field.name} className={cn("flex flex-col gap-2.5", spanClass)}>
                  <ModuleWorkspaceFormField
                    module={module}
                    field={field}
                    editingRow={editingRow}
                    fieldIcons={fieldIcons}
                    fieldError={fieldErrors[field.name]}
                    relatedOptions={relatedOptions}
                    selectValues={selectValues}
                    openSelectField={openSelectField}
                    setOpenSelectField={setOpenSelectField}
                    setSelectValues={setSelectValues}
                    duplicates={duplicates}
                    sprintDuplicate={sprintDuplicate}
                    lastSprint={lastSprint}
                    dateWarnings={dateWarnings}
                    setDateWarnings={setDateWarnings}
                  checkDuplicates={checkDuplicates}
                  checkSprintDuplicate={checkSprintDuplicate}
                  versionSequenceLabel={versionSequenceLabel}
                  versionSequenceDefaultValue={versionSequenceDefaultValue}
                />
                </label>
              );
            })}
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-slate-200 pt-10 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={pending}
              className={cn(
                "h-12 rounded-lg px-8 text-sm font-bold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50",
                "bg-emerald-600 hover:bg-emerald-500",
              )}
            >
              {pending ? "Processing..." : editingRow ? `Save ${shortTitle}` : `Add ${shortTitle}`}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="h-12 rounded-lg glass-card px-5 text-sm font-bold text-slate-700 transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
