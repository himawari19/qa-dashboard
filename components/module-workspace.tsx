"use client";

import { useCallback, useEffect, useState, useTransition, useRef, useMemo, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type ModuleKey, moduleConfigs } from "@/lib/modules";
import { toast } from "@/components/ui/toast";
import { Breadcrumb } from "@/components/breadcrumb";
import { type Attachment } from "@/components/attachment-uploader";
import { getFieldIcons, getModuleWorkspaceCrumbs, getModuleWorkspacePermissions, getPreferredColumnOrder } from "@/components/module-workspace-utils";
import { useModuleWorkspaceActions } from "@/components/use-module-workspace-actions";
import { ModuleWorkspaceShell } from "@/components/module-workspace-shell";
import { useDetailViewUrl } from "@/hooks/use-detail-view-url";
import { PAGE_SIZE } from "@/lib/pagination";
import { getUserRoleOptions } from "@/lib/roles";


type Row = Record<string, string | number> & { id: string | number };

function compareVersions(left: string, right: string) {
  const matchLeft = String(left ?? "").trim().match(/^(v\.?|)(\d+)\.(\d+)\.(\d+)$/i);
  const matchRight = String(right ?? "").trim().match(/^(v\.?|)(\d+)\.(\d+)\.(\d+)$/i);
  if (!matchLeft && !matchRight) return 0;
  if (!matchLeft) return -1;
  if (!matchRight) return 1;
  const [, leftPrefix, leftMajor, leftMinor, leftPatch] = matchLeft;
  const [, rightPrefix, rightMajor, rightMinor, rightPatch] = matchRight;
  const leftWeight = leftPrefix ? 1 : 0;
  const rightWeight = rightPrefix ? 1 : 0;
  if (leftWeight !== rightWeight) return leftWeight - rightWeight;
  const majorDiff = Number(leftMajor) - Number(rightMajor);
  if (majorDiff !== 0) return majorDiff;
  const minorDiff = Number(leftMinor) - Number(rightMinor);
  if (minorDiff !== 0) return minorDiff;
  return Number(leftPatch) - Number(rightPatch);
}

function getLatestVersion(rows: Row[]) {
  return rows
    .map((row) => String(row.version ?? "").trim())
    .filter(Boolean)
    .reduce((latest, current) => (compareVersions(current, latest) > 0 ? current : latest), "");
}

function getNextVersion(version: string) {
  const match = String(version ?? "").trim().match(/^(v\.?|)(\d+)\.(\d+)\.(\d+)$/i);
  if (!match) return "";
  const [, prefix, major, minor, patch] = match;
  return `${prefix}${major}.${minor}.${Number(patch) + 1}`;
}

export function ModuleWorkspace({
  module,
  rows,
  kanbanRows = rows,
  currentPage,
  totalPages,
  totalItems,
  relatedOptions = {},
  initialFormValues = {},
  hiddenFields = [],
  user = null,
  topContent = null,
  versionSequenceDefaultValue = "",
  viewId = null,
}: {
  module: ModuleKey;
  rows: Row[]; 
  kanbanRows?: Row[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  relatedOptions?: Record<string, Array<{ label: string; value: string }>>;
  initialFormValues?: Record<string, string>;
  hiddenFields?: string[];
  user?: any;
  topContent?: ReactNode;
  versionSequenceDefaultValue?: string;
  viewId?: string | null;
}) {
  const config = moduleConfigs[module];
  const resolvedConfig = useMemo(() => {
    if (module !== "users") return config;
    const userRoleField = config.fields.find((field) => field.name === "role");
    if (!userRoleField || !("options" in userRoleField)) return config;
    return {
      ...config,
      fields: config.fields.map((field) =>
        field.name === "role" && "options" in field
          ? { ...field, options: getUserRoleOptions(String(user?.company ?? "")) }
          : field,
      ),
    };
  }, [config, module, user?.company]);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [localRows, setLocalRows] = useState(rows);
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
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [openSelectField, setOpenSelectField] = useState<string | null>(null);
  const [selectValues, setSelectValues] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [search, setSearch] = useState(
    () => new URLSearchParams(typeof window !== "undefined" ? window.location.search : "").get("q") ?? "",
  );
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Undo delete
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | number | null>(null);
  const { canAdd, canEdit, canDelete, isViewer } = useMemo(
    () => getModuleWorkspacePermissions(String(user?.role || "qa")),
    [user?.role],
  );
  const assigneeLocked = module === "assignees";
  const effectiveCanAdd = canAdd && !assigneeLocked;
  const effectiveCanEdit = canEdit && !assigneeLocked;
  const effectiveCanDelete = canDelete && !assigneeLocked;

  useEffect(() => {
    setLocalRows(rows);
  }, [rows]);

  // URL synchronization for shareable detail links
  const handleOpenRow = useCallback((row: Row) => {
    setViewingRow(row);
  }, []);

  const handleCloseRow = useCallback(() => {
    setViewingRow(null);
  }, []);

  const handleNotFound = useCallback(() => {
    toast("The requested item was not found", "error");
  }, []);

  const handleAccessDenied = useCallback(() => {
    toast("You don't have permission to view this item", "error");
  }, []);

  const handleTabChange = useCallback((tab: string | null) => {
    setActiveTab(tab);
  }, []);

  useDetailViewUrl({
    module,
    viewingRow,
    initialViewId: viewId,
    localRows,
    onOpenRow: handleOpenRow,
    onCloseRow: handleCloseRow,
    onNotFound: handleNotFound,
    onAccessDenied: handleAccessDenied,
    activeTab,
    onTabChange: handleTabChange,
  });

  // Reset page when search/filter changes
  const statusField = resolvedConfig.fields.find((f) => f.name === "status");
  const statusOptions = statusField && "options" in statusField ? statusField.options : [];
  const hasKanban = statusOptions.length > 0 && (module === "tasks" || module === "bugs" || module === "test-cases" || module === "sprints");

  const priorityField = resolvedConfig.fields.find((f) => f.name === "priority");
  const priorityOptions = priorityField && "options" in priorityField ? priorityField.options : [];
  const severityField = resolvedConfig.fields.find((f) => f.name === "severity");
  const severityOptions = severityField && "options" in severityField ? severityField.options : [];

  const fieldIcons = useMemo(() => getFieldIcons(), []);

  const safePage = Math.min(currentPage, totalPages);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value.trim()) {
        params.set("q", value.trim());
        params.set("page", "1");
      } else {
        params.delete("q");
      }
      router.push(`${pathname}?${params.toString()}`);
    }, 400);
  };

  useEffect(() => {
    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); };
  }, []);

  const visibleRows = localRows;
  const preferredColumnOrder = useMemo(() => getPreferredColumnOrder(module), [module]);
  const defaultVisibleColumns = config.columns
    .filter((column) => preferredColumnOrder.includes(column.key))
    .sort((a, b) => preferredColumnOrder.indexOf(a.key) - preferredColumnOrder.indexOf(b.key));
  const visibleColumns = useMemo(
    () => defaultVisibleColumns.length > 0 ? defaultVisibleColumns : config.columns.slice(0, Math.min(6, config.columns.length)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [module]
  );
  const versionSequenceField = resolvedConfig.fields.find((field) => field.helperKind === "version-sequence");
  const versionSequenceDefault = useMemo(() => getNextVersion(getLatestVersion(localRows)), [localRows]);
  const versionSequenceLabel =
    versionSequenceField && versionSequenceField.name
      ? String(editingRow?.[versionSequenceField.name] ?? localRows[0]?.[versionSequenceField.name] ?? "").trim()
      : "";
  const crumbs = useMemo(() => getModuleWorkspaceCrumbs(module, config.title), [config.title, module]);

  function goToPage(nextPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(nextPage));
    router.push(`${pathname}?${params.toString()}`);
  }

  const actionArgs = {
    module,
    configFields: resolvedConfig.fields,
    rows: localRows,
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
    openSelectField,
    setSelectValues,
    setRefreshing,
    setRows: setLocalRows,
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
    checkSprintDuplicate,
  } = useModuleWorkspaceActions(actionArgs);

  return (
    <div className="space-y-6">
      <div className="animate-in fade-in slide-in-from-top-2 duration-500">
        <Breadcrumb crumbs={crumbs} />
      </div>
      <ModuleWorkspaceShell
        module={module}
        config={resolvedConfig as any}
        topContent={topContent}
        showForm={showForm}
        viewMode={viewMode}
        hasKanban={hasKanban}
        pending={pending}
        refreshing={refreshing}
        hiddenFields={hiddenFields}
        fieldIcons={fieldIcons}
        fieldErrors={fieldErrors}
        canAdd={effectiveCanAdd}
        canEdit={effectiveCanEdit}
        canDelete={effectiveCanDelete}
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
        kanbanRows={kanbanRows}
        visibleColumns={visibleColumns}
        safePage={safePage}
        totalPages={totalPages}
        totalItems={totalItems}
        statusOptions={statusOptions}
        pendingDeleteId={pendingDeleteId}
        deleteOpen={deleteId !== null}
        reopenOpen={reopenId !== null}
        reopenReason={reopenReason}
        viewingRow={viewingRow}
        search={search}
        onSearchChange={handleSearchChange}
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
        checkSprintDuplicate={checkSprintDuplicate}
        setOpenSelectField={setOpenSelectField}
        setSelectValues={setSelectValues}
        setAttachments={setAttachments as any}
        setDateWarnings={setDateWarnings}
        setSprintDuplicate={setSprintDuplicate}
        versionSequenceLabel={versionSequenceLabel}
        versionSequenceDefaultValue={versionSequenceDefaultValue || versionSequenceDefault}
        onAdd={() => openFormEditor()}
        onEditRow={(row) => openFormEditor(row as Row)}
        onViewRow={(row) => setViewingRow(row as Row)}
        onDeleteRow={(row) => setDeleteId(row.id as string | number)}
        onReopenRow={(row) => {
          setReopenId(Number(row.id as string | number));
          setReopenReason("");
        }}
        onPrevPage={() => goToPage(Math.max(1, safePage - 1))}
        onNextPage={() => goToPage(Math.min(totalPages, safePage + 1))}
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
        onCloseView={() => {
          setViewingRow(null);
          setActiveTab(null);
        }}
        onEditView={() => {
          setViewingRow(null);
          openFormEditor(viewingRow);
        }}
        initialTab={activeTab}
        onTabChange={handleTabChange}
      />
    </div>
  );
}

