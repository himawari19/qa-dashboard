"use client";

import { type Dispatch, type ReactNode, type SetStateAction } from "react";
import { AttachmentUploader, type Attachment } from "@/components/attachment-uploader";
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
  attachments: Attachment[];
  setAttachments: Dispatch<SetStateAction<Attachment[]>>;
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
  setSprintDuplicate: Dispatch<SetStateAction<boolean>>;
  versionSequenceLabel?: string;
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
  attachments,
  setAttachments,
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
  setSprintDuplicate,
  versionSequenceLabel,
}: ModuleWorkspaceFormProps) {
  return (
    <div id="module-form-section" className="rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-6 py-6 shadow-sm">
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
        className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-8 shadow-xl"
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
                    setSprintDuplicate={setSprintDuplicate}
                    versionSequenceLabel={versionSequenceLabel}
                  />
                </label>
              );
            })}
        </div>

        {(module === "bugs" || module === "tasks") && (
          <div className="mt-6">
            <p className="mb-2 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Attachments
            </p>
            <AttachmentUploader value={attachments} onChange={setAttachments} disabled={isViewer} />
            <input type="hidden" name="attachments" value={JSON.stringify(attachments)} />
          </div>
        )}

        <div className="mt-8 flex flex-col gap-3 border-t border-slate-200 pt-10 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={pending}
              style={{ backgroundColor: editingRow ? "#16a34a" : "#2563eb" }}
              className="h-12 rounded-md px-8 text-sm font-bold text-white shadow-md transition duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {pending ? "Processing..." : editingRow ? `Save ${shortTitle}` : `Add ${shortTitle}`}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="h-12 rounded-md border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
