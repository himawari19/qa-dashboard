"use client";

import { useState, useTransition, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { type ModuleKey, moduleConfigs } from "@/lib/modules";
import { toast } from "@/components/ui/toast";
import { Breadcrumb } from "@/components/breadcrumb";
import { type Attachment } from "@/components/attachment-uploader";
import { PAGE_SIZE, getFieldIcons, getModuleWorkspaceCrumbs, getModuleWorkspacePermissions, getPreferredColumnOrder } from "@/components/module-workspace-utils";
import { useModuleWorkspaceActions } from "@/components/use-module-workspace-actions";
import { ModuleWorkspaceShell } from "@/components/module-workspace-shell";


type Row = Record<string, string | number> & { id: string | number };

export function ModuleWorkspace({
  module,
  rows,
  relatedOptions = {},
  initialFormValues = {},
  hiddenFields = [],
  user = null,
}: {
  module: ModuleKey;
  rows: Row[];
  relatedOptions?: Record<string, Array<{ label: string; value: string }>>;
  initialFormValues?: Record<string, string>;
  hiddenFields?: string[];
  user?: any;
}) {
  const config = moduleConfigs[module];
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");
  const [editingRow, setEditingRow] = useState<Row | null>(null);
  const [deleteId, setDeleteId] = useState<string | number | null>(null);
  const [duplicates, setDuplicates] = useState<{ id: number; code: string; title: string; status: string }[]>([]);
  const [lastSprint, setLastSprint] = useState<string | null>(null);
  const [sprintDuplicate, setSprintDuplicate] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [dateWarnings, setDateWarnings] = useState<Record<string, "past" | "future">>({});
  const [reopenId, setReopenId] = useState<number | null>(null);
  const [reopenReason, setReopenReason] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [formDirty, setFormDirty] = useState(false);
  const [viewingRow, setViewingRow] = useState<Row | null>(null);
  const [statusDropdownId, setStatusDropdownId] = useState<string | number | null>(null);
  const [openSelectField, setOpenSelectField] = useState<string | null>(null);
  const [selectValues, setSelectValues] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  // Undo delete
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | number | null>(null);
  const { canAdd, canEdit, canDelete, isViewer } = useMemo(
    () => getModuleWorkspacePermissions(String(user?.role || "user")),
    [user?.role],
  );

  // Reset page when search/filter changes
  const statusField = config.fields.find((f) => f.name === "status");
  const statusOptions = statusField && "options" in statusField ? statusField.options : [];
  const hasKanban = statusOptions.length > 0 && (module === "tasks" || module === "bugs" || module === "test-cases" || module === "sprints");

  const priorityField = config.fields.find((f) => f.name === "priority");
  const priorityOptions = priorityField && "options" in priorityField ? priorityField.options : [];
  const severityField = config.fields.find((f) => f.name === "severity");
  const severityOptions = severityField && "options" in severityField ? severityField.options : [];

  const fieldIcons = useMemo(() => getFieldIcons(), []);

  const filteredRows = useMemo(() => rows, [rows]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visibleRows = filteredRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const preferredColumnOrder = useMemo(() => getPreferredColumnOrder(module), [module]);
  const defaultVisibleColumns = config.columns
    .filter((column) => preferredColumnOrder.includes(column.key))
    .sort((a, b) => preferredColumnOrder.indexOf(a.key) - preferredColumnOrder.indexOf(b.key));
  const visibleColumns = useMemo(
    () => defaultVisibleColumns.length > 0 ? defaultVisibleColumns : config.columns.slice(0, Math.min(6, config.columns.length)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [module]
  );
  const crumbs = useMemo(() => getModuleWorkspaceCrumbs(module, config.title), [config.title, module]);

  const actionArgs = {
    module,
    configFields: config.fields,
    rows,
    initialFormValues,
    router,
    toast,
    startTransition,
    showForm,
    editingRow,
    deleteId,
    pendingDeleteId,
    undoTimerRef,
    formDirty,
    statusDropdownId,
    openSelectField,
    setSelectValues,
    setRefreshing,
    setShowForm,
    setEditingRow,
    setViewingRow,
    setFieldErrors,
    setDuplicates,
    setSprintDuplicate,
    setLastSprint,
    setAttachments,
    setDateWarnings,
    setFormDirty,
    setStatusDropdownId,
    setOpenSelectField,
    setPendingDeleteId,
    setDeleteId,
  } satisfies Parameters<typeof useModuleWorkspaceActions>[0];

  const {
    refreshPage,
    openFormEditor,
    closeFormEditor,
    handleFormSubmit,
    onImport,
    onUpdateStatus,
    performSingleDelete,
    checkDuplicates,
  } = useModuleWorkspaceActions(actionArgs);

  return (
    <div className="space-y-6">
      <div className="animate-in fade-in slide-in-from-top-2 duration-500">
        <Breadcrumb crumbs={crumbs} />
      </div>
      <ModuleWorkspaceShell
        module={module}
        config={config as any}
        showForm={showForm}
        viewMode={viewMode}
        hasKanban={hasKanban}
        pending={pending}
        refreshing={refreshing}
        hiddenFields={hiddenFields}
        fieldIcons={fieldIcons}
        fieldErrors={fieldErrors}
        canAdd={canAdd}
        canEdit={canEdit}
        canDelete={canDelete}
        isViewer={isViewer}
        relatedOptions={relatedOptions}
        selectValues={selectValues}
        openSelectField={openSelectField}
        attachments={attachments as any}
        duplicates={duplicates}
        sprintDuplicate={sprintDuplicate}
        lastSprint={lastSprint}
        dateWarnings={dateWarnings}
        editingRow={editingRow}
        visibleRows={visibleRows}
        visibleColumns={visibleColumns}
        safePage={safePage}
        totalPages={totalPages}
        totalItems={filteredRows.length}
        statusOptions={statusOptions}
        statusDropdownId={statusDropdownId}
        pendingDeleteId={pendingDeleteId}
        deleteOpen={deleteId !== null}
        reopenOpen={reopenId !== null}
        reopenReason={reopenReason}
        viewingRow={viewingRow}
        onToggleForm={() => {
          if (showForm) closeFormEditor();
          else openFormEditor();
        }}
        onSetViewMode={setViewMode}
        onImportFile={(file) => {
          startTransition(() => {
            void onImport(file);
          });
        }}
        onFormChange={() => setFormDirty(true)}
        onSubmit={handleFormSubmit}
        onCancelForm={closeFormEditor}
        checkDuplicates={checkDuplicates}
        setOpenSelectField={setOpenSelectField}
        setSelectValues={setSelectValues}
        setAttachments={setAttachments as any}
        setDateWarnings={setDateWarnings}
        setSprintDuplicate={setSprintDuplicate}
        setStatusDropdownId={setStatusDropdownId}
        onAdd={() => openFormEditor()}
        onEditRow={(row) => openFormEditor(row as Row)}
        onViewRow={(row) => setViewingRow(row as Row)}
        onDeleteRow={(row) => setDeleteId(row.id as string | number)}
        onReopenRow={(row) => {
          setReopenId(Number(row.id as string | number));
          setReopenReason("");
        }}
        onPrevPage={() => setPage((p) => Math.max(1, p - 1))}
        onNextPage={() => setPage((p) => Math.min(totalPages, p + 1))}
        onUpdateStatus={onUpdateStatus}
        onDeleteConfirm={performSingleDelete}
        onDeleteCancel={() => setDeleteId(null)}
        onReopenReasonChange={setReopenReason}
        onReopenCancel={() => setReopenId(null)}
        onReopenConfirm={async () => {
          if (!reopenId) return;
          const reason = reopenReason.trim() || "Re-opened";
          startTransition(async () => {
            await fetch(`/api/items/bugs`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id: reopenId, status: "open" }),
            });
            setReopenId(null);
            setReopenReason("");
            toast(`Bug re-opened: ${reason}`, "success");
            refreshPage();
          });
        }}
        onCloseView={() => setViewingRow(null)}
        onEditView={() => {
          setViewingRow(null);
          openFormEditor(viewingRow);
        }}
      />
    </div>
  );
}

