"use client";

import { KanbanBoard } from"@/components/kanban-board";
import { type Attachment } from"@/components/attachment-uploader";
import { ViewModal } from"@/components/module-view-modal";
import { ModuleWorkspaceHeader } from"@/components/module-workspace-header";
import { ModuleWorkspaceTable } from"@/components/module-workspace-table";
import { ModuleWorkspaceForm } from"@/components/module-workspace-form";
import { ModuleWorkspaceModals } from"@/components/module-workspace-modals";
import type { Dispatch, ReactNode, SetStateAction } from"react";
import { getModuleWorkspaceIcon } from"@/components/module-workspace-utils";

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
 topContent?: ReactNode;
 showForm: boolean;
 viewMode:"table" |"kanban";
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
 dateWarnings: Record<string,"past" |"future">;
 editingRow: Row | null;
 visibleRows: any[];
 visibleColumns: any[];
 safePage: number;
 totalPages: number;
 totalItems: number;
 statusOptions: Array<{ label: string; value: string }>;
 pendingDeleteId: string | number | null;
 deleteOpen: boolean;
 reopenOpen: boolean;
 reopenReason: string;
 viewingRow: Row | null;
 onToggleForm: () => void;
 onSetViewMode: (value:"table" |"kanban") => void;
 onImportFile: (file: File) => void;
 onFormChange: () => void;
 onSubmit: (formData: FormData) => void;
 onCancelForm: () => void;
 checkDuplicates: (title: string) => void;
 checkSprintDuplicate: (sprint: string) => void;
 setOpenSelectField: Dispatch<SetStateAction<string | null>>;
 setSelectValues: Dispatch<SetStateAction<Record<string, string>>>;
 setAttachments: Dispatch<SetStateAction<Attachment[]>>;
 setDateWarnings: Dispatch<SetStateAction<Record<string,"past" |"future">>>;
 setSprintDuplicate: Dispatch<SetStateAction<boolean>>;
 versionSequenceLabel?: string;
 versionSequenceDefaultValue?: string;
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
 search: string;
 onSearchChange: (value: string) => void;
};

export function ModuleWorkspaceShell({
 module,
 config,
 topContent,
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
 checkSprintDuplicate,
 setOpenSelectField,
 setSelectValues,
 setAttachments,
 setDateWarnings,
 setSprintDuplicate,
 versionSequenceLabel,
 versionSequenceDefaultValue,
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
 search,
 onSearchChange,
}: Props) {
 return (
 <>
 <section className={showForm ?"overflow-visible rounded-2xl bg-white shadow-sm ring-1 ring-slate-200" :"overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200"}>
 <ModuleWorkspaceHeader
 module={module as any}
 title={config.title}
 shortTitle={config.shortTitle}
 description={config.description}
 icon={getModuleWorkspaceIcon(module as any)}
 canAdd={canAdd}
 topContent={topContent}
 showForm={showForm}
 viewMode={viewMode}
 hasKanban={hasKanban}
 pending={pending}
 refreshing={refreshing}
 onToggleForm={onToggleForm}
 onSetViewMode={onSetViewMode}
 onImportFile={onImportFile}
 search={search}
 onSearchChange={onSearchChange}
 />

 {!showForm && module ==="test-suites" ? <div className="border-b border-slate-200/60 px-6 py-4" /> : null}

 {showForm ? (
 <ModuleWorkspaceForm
 key={`${module}-${editingRow?.id ??"new"}`}
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
 duplicates={duplicates}
 sprintDuplicate={sprintDuplicate}
 lastSprint={lastSprint}
 dateWarnings={dateWarnings}
 setDateWarnings={setDateWarnings}
 onFormChange={onFormChange}
 onSubmit={onSubmit}
 onCancel={onCancelForm}
 checkDuplicates={checkDuplicates}
 checkSprintDuplicate={checkSprintDuplicate}
 versionSequenceLabel={versionSequenceLabel}
 versionSequenceDefaultValue={versionSequenceDefaultValue}
 />
 ) : null}

 {!showForm && viewMode ==="table" ? (
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
 onAdd={onAdd}
 onEditRow={onEditRow}
 onViewRow={onViewRow}
 onDeleteRow={onDeleteRow}
 onReopenRow={onReopenRow}
 onPrevPage={onPrevPage}
 onNextPage={onNextPage}
 />
 ) : !showForm ? (
 <div className="overflow-hidden bg-transparent border-t border-slate-200/60 p-5">
 <KanbanBoard rows={visibleRows} statusOptions={statusOptions} onUpdateStatus={onUpdateStatus} onViewRow={onViewRow} />
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
