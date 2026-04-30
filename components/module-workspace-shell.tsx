"use client";

import { KanbanBoard } from "@/components/kanban-board";
import { type Attachment } from "@/components/attachment-uploader";
import { ViewModal } from "@/components/module-view-modal";
import { ModuleWorkspaceHeader } from "@/components/module-workspace-header";
import { ModuleWorkspaceTable } from "@/components/module-workspace-table";
import { ModuleWorkspaceForm } from "@/components/module-workspace-form";
import { ModuleWorkspaceModals } from "@/components/module-workspace-modals";
import type { Dispatch, ReactNode, SetStateAction } from "react";

type Row = Record<string, string | number> & { id: string | number };

type WorkspaceConfig = {
  title: string;
  shortTitle: string;
  description: string;
  fields: any[];
  columns: Array<{ key: string }>;
};

type Props = {
  module: string;
  config: WorkspaceConfig;
  showForm: boolean;
  viewMode: "table" | "kanban";
  hasKanban: boolean;
  pending: boolean;
  refreshing: boolean;
  hiddenFields: string[];
  fieldIcons: Record<string, ReactNode>;
  fieldErrors: Record<string, string>;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
  isViewer: boolean;
  relatedOptions: Record<string, Array<{ label: string; value: string }>>;
  selectValues: Record<string, string>;
  openSelectField: string | null;
  attachments: Attachment[];
  duplicates: Array<{ id: number; code: string; title: string; status: string }>;
  sprintDuplicate: boolean;
  lastSprint: string | null;
  dateWarnings: Record<string, "past" | "future">;
  editingRow: Row | null;
  visibleRows: any[];
  visibleColumns: any[];
  safePage: number;
  totalPages: number;
  totalItems: number;
  statusOptions: Array<{ label: string; value: string }>;
  statusDropdownId: string | number | null;
  pendingDeleteId: string | number | null;
  deleteOpen: boolean;
  reopenOpen: boolean;
  reopenReason: string;
  viewingRow: Row | null;
  onToggleForm: () => void;
  onSetViewMode: (value: "table" | "kanban") => void;
  onImportFile: (file: File) => void;
  onFormChange: () => void;
  onSubmit: (formData: FormData) => void;
  onCancelForm: () => void;
  checkDuplicates: (title: string) => void;
  setOpenSelectField: Dispatch<SetStateAction<string | null>>;
  setSelectValues: Dispatch<SetStateAction<Record<string, string>>>;
  setAttachments: Dispatch<SetStateAction<Attachment[]>>;
  setDateWarnings: Dispatch<SetStateAction<Record<string, "past" | "future">>>;
  setSprintDuplicate: Dispatch<SetStateAction<boolean>>;
  setStatusDropdownId: Dispatch<SetStateAction<string | number | null>>;
  onAdd: () => void;
  onEditRow: (row: any) => void;
  onViewRow: (row: any) => void;
  onDeleteRow: (row: any) => void;
  onReopenRow: (row: any) => void;
  onPrevPage: () => void;
  onNextPage: () => void;
  onUpdateStatus: (id: string | number, status: string) => Promise<void>;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
  onReopenReasonChange: (value: string) => void;
  onReopenCancel: () => void;
  onReopenConfirm: () => void;
  onCloseView: () => void;
  onEditView: () => void;
};

export function ModuleWorkspaceShell({
  module,
  config,
  showForm,
  viewMode,
  hasKanban,
  pending,
  refreshing,
  hiddenFields,
  fieldIcons,
  fieldErrors,
  canAdd,
  canEdit,
  canDelete,
  isViewer,
  relatedOptions,
  selectValues,
  openSelectField,
  attachments,
  duplicates,
  sprintDuplicate,
  lastSprint,
  dateWarnings,
  editingRow,
  visibleRows,
  visibleColumns,
  safePage,
  totalPages,
  totalItems,
  statusOptions,
  statusDropdownId,
  pendingDeleteId,
  deleteOpen,
  reopenOpen,
  reopenReason,
  viewingRow,
  onToggleForm,
  onSetViewMode,
  onImportFile,
  onFormChange,
  onSubmit,
  onCancelForm,
  checkDuplicates,
  setOpenSelectField,
  setSelectValues,
  setAttachments,
  setDateWarnings,
  setSprintDuplicate,
  setStatusDropdownId,
  onAdd,
  onEditRow,
  onViewRow,
  onDeleteRow,
  onReopenRow,
  onPrevPage,
  onNextPage,
  onUpdateStatus,
  onDeleteConfirm,
  onDeleteCancel,
  onReopenReasonChange,
  onReopenCancel,
  onReopenConfirm,
  onCloseView,
  onEditView,
}: Props) {
  return (
    <>
      <section className="border border-[#c9d7e3] overflow-hidden rounded-md bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <ModuleWorkspaceHeader
          module={module as any}
          title={config.title}
          shortTitle={config.shortTitle}
          description={config.description}
          canAdd={canAdd}
          showForm={showForm}
          viewMode={viewMode}
          hasKanban={hasKanban}
          pending={pending}
          refreshing={refreshing}
          onToggleForm={onToggleForm}
          onSetViewMode={onSetViewMode}
          onImportFile={onImportFile}
        />
        {showForm ? (
          <ModuleWorkspaceForm
            module={module as any}
            shortTitle={config.shortTitle}
            fields={config.fields}
            editingRow={editingRow}
            hiddenFields={hiddenFields}
            fieldIcons={fieldIcons}
            fieldErrors={fieldErrors}
            canAdd={canAdd}
            canEdit={canEdit}
            pending={pending}
            isViewer={isViewer}
            relatedOptions={relatedOptions}
            selectValues={selectValues}
            openSelectField={openSelectField}
            setOpenSelectField={setOpenSelectField}
            setSelectValues={setSelectValues}
            attachments={attachments as any}
            setAttachments={setAttachments as any}
            duplicates={duplicates}
            sprintDuplicate={sprintDuplicate}
            lastSprint={lastSprint}
            dateWarnings={dateWarnings}
            setDateWarnings={setDateWarnings}
            onFormChange={onFormChange}
            onSubmit={onSubmit}
            onCancel={onCancelForm}
            checkDuplicates={checkDuplicates}
            setSprintDuplicate={setSprintDuplicate}
          />
        ) : null}

        {!showForm && viewMode === "table" ? (
          <ModuleWorkspaceTable
            module={module as any}
            shortTitle={config.shortTitle}
            visibleRows={visibleRows}
            visibleColumns={visibleColumns}
            safePage={safePage}
            totalPages={totalPages}
            totalItems={totalItems}
            canAdd={canAdd}
            canEdit={canEdit}
            canDelete={canDelete}
            pendingDeleteId={pendingDeleteId}
            statusOptions={statusOptions}
            statusDropdownId={statusDropdownId}
            setStatusDropdownId={setStatusDropdownId}
            onAdd={onAdd}
            onEditRow={onEditRow}
            onViewRow={onViewRow}
            onDeleteRow={onDeleteRow}
            onReopenRow={onReopenRow}
            onPrevPage={onPrevPage}
            onNextPage={onNextPage}
            onUpdateStatus={onUpdateStatus}
          />
        ) : !showForm ? (
          <div className="overflow-hidden bg-slate-50 dark:bg-slate-800/50 border-t border-[#d9e2ea] dark:border-slate-700 p-5">
            <KanbanBoard rows={visibleRows} statusOptions={statusOptions} onUpdateStatus={onUpdateStatus} />
          </div>
        ) : null}
      </section>

      <ModuleWorkspaceModals
        deleteOpen={deleteOpen}
        onDeleteConfirm={onDeleteConfirm}
        onDeleteCancel={onDeleteCancel}
        reopenOpen={reopenOpen}
        reopenReason={reopenReason}
        onReopenReasonChange={onReopenReasonChange}
        onReopenCancel={onReopenCancel}
        onReopenConfirm={onReopenConfirm}
      />

      {viewingRow && (
        <ViewModal
          row={viewingRow}
          config={config as any}
          fieldIcons={fieldIcons as any}
          onClose={onCloseView}
          onEdit={onEditView}
          canEdit={canEdit}
        />
      )}
    </>
  );
}
