"use client";

import { useEffect } from "react";
import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import type { ModuleKey } from "@/lib/modules";
import { type Attachment } from "@/components/attachment-uploader";
import { parseFieldError } from "@/components/module-workspace-utils";
import {
  refreshWorkspace,
  requestModuleJson,
  scrollToFormSection,
  showApiError,
  showApiSuccess,
  type ApiPayload,
} from "@/components/use-module-workspace-actions-helpers";

type Row = Record<string, string | number> & { id: string | number };

type ActionArgs = {
  module: ModuleKey;
  configFields: Array<{ name: string }>;
  rows: Row[];
  initialFormValues: Record<string, string>;
  router: { refresh: () => void };
  toast: (message: string, type?: "success" | "error" | "info", options?: Record<string, unknown>) => void;
  startTransition: (callback: () => void) => void;
  showForm: boolean;
  editingRow: Row | null;
  deleteId: string | number | null;
  pendingDeleteId: string | number | null;
  undoTimerRef: MutableRefObject<ReturnType<typeof setTimeout> | null>;
  formDirty: boolean;
  statusDropdownId: string | number | null;
  openSelectField: string | null;
  setSelectValues: Dispatch<SetStateAction<Record<string, string>>>;
  setRefreshing: Dispatch<SetStateAction<boolean>>;
  setShowForm: Dispatch<SetStateAction<boolean>>;
  setEditingRow: Dispatch<SetStateAction<Row | null>>;
  setViewingRow: Dispatch<SetStateAction<Row | null>>;
  setFieldErrors: Dispatch<SetStateAction<Record<string, string>>>;
  setDuplicates: Dispatch<SetStateAction<Array<{ id: number; code: string; title: string; status: string }>>>;
  setSprintDuplicate: Dispatch<SetStateAction<boolean>>;
  setLastSprint: Dispatch<SetStateAction<string | null>>;
  setAttachments: Dispatch<SetStateAction<Attachment[]>>;
  setDateWarnings: Dispatch<SetStateAction<Record<string, "past" | "future">>>;
  setFormDirty: Dispatch<SetStateAction<boolean>>;
  setStatusDropdownId: Dispatch<SetStateAction<string | number | null>>;
  setOpenSelectField: Dispatch<SetStateAction<string | null>>;
  setPendingDeleteId: Dispatch<SetStateAction<string | number | null>>;
  setDeleteId: Dispatch<SetStateAction<string | number | null>>;
};

export function useModuleWorkspaceActions(args: ActionArgs) {
  const {
    module,
    configFields,
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
  } = args;

  useEffect(() => {
    if (!showForm || !initialFormValues) return;
    const form = document.getElementById(`${module}-form`) as HTMLFormElement | null;
    if (!form) return;
    for (const [key, value] of Object.entries(initialFormValues)) {
      const input = form.elements.namedItem(key) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null;
      if (input && !input.value) {
        input.value = value;
        setSelectValues((prev) => ({ ...prev, [key]: value }));
      }
    }
  }, [showForm, initialFormValues, module, setSelectValues]);

  useEffect(() => {
    const handler = () => {
      setEditingRow(null);
      setShowForm(true);
      scrollToFormSection();
    };
    window.addEventListener("qa:open-form", handler);

    const params = new URLSearchParams(window.location.search);
    if (params.get("action") === "new") {
      handler();
    }

    return () => window.removeEventListener("qa:open-form", handler);
  }, [setEditingRow, setShowForm]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const viewId = params.get("viewId");
    if (!viewId || rows.length === 0) return;
    const target = rows.find((r) => String(r.id) === viewId);
    if (target) {
      setViewingRow(target);
      const url = new URL(window.location.href);
      url.searchParams.delete("viewId");
      window.history.replaceState({}, "", url.toString());
    }
  }, [rows, setViewingRow]);

  useEffect(() => {
    if (statusDropdownId === null) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-status-dropdown]")) setStatusDropdownId(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [statusDropdownId, setStatusDropdownId]);

  useEffect(() => {
    if (openSelectField === null) return;
    const handler = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest("[data-custom-select]")) setOpenSelectField(null);
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [openSelectField, setOpenSelectField]);

  useEffect(() => {
    if (editingRow && (module === "bugs" || module === "tasks")) {
      try {
        const raw = String(editingRow.attachments || "");
        setAttachments(raw ? JSON.parse(raw) : []);
      } catch {
        setAttachments([]);
      }
    } else if (!editingRow) {
      setAttachments([]);
    }
  }, [editingRow, module, setAttachments]);

  useEffect(() => {
    if (!showForm || !formDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [showForm, formDirty]);

  useEffect(() => {
    if (!showForm) setFormDirty(false);
  }, [showForm, setFormDirty]);

  function refreshPage() {
    refreshWorkspace(router, setRefreshing);
  }

  function openFormEditor(row: Row | null = null) {
    setEditingRow(row);
    setShowForm(true);
    scrollToFormSection();
  }

  function closeFormEditor() {
    setShowForm(false);
  }

  const checkDuplicates = async (title: string) => {
    if (title.length < 5) {
      setDuplicates([]);
      return;
    }
    try {
      const res = await fetch(`/api/items/${module}/find-duplicates?title=${encodeURIComponent(title)}`);
      const data = await res.json();
      setDuplicates(data.duplicates || []);
    } catch {
      setDuplicates([]);
    }
  };

  useEffect(() => {
    const hasSprintField = configFields.some((field) => field.name === "sprint");
    if (!showForm || !hasSprintField) return;
    fetch("/api/items/sprints")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const sorted = [...data].sort((a, b) => (b.id as number) - (a.id as number));
          setLastSprint(String(sorted[0].name || ""));
        }
      })
      .catch(() => {});
  }, [showForm, configFields, setLastSprint]);

  function resetCreateFormState() {
    const form = document.getElementById(`${module}-form`) as HTMLFormElement | null;
    form?.reset();
    localStorage.removeItem(`draft-${module}`);
    setDuplicates([]);
    setSprintDuplicate(false);
    setLastSprint(null);
    setAttachments([]);
    setDateWarnings({});
  }

  function finishCreateSuccess(message?: string) {
    setFieldErrors({});
    toast(message ?? "Data saved successfully.", "success");
    resetCreateFormState();
    closeFormEditor();
    refreshPage();
  }

  function finishUpdateSuccess(message?: string) {
    setFieldErrors({});
    toast(message ?? "Data updated successfully.", "success");
    setEditingRow(null);
    closeFormEditor();
    refreshPage();
  }

  function handleFormSubmit(formData: FormData) {
    startTransition(() => {
      if (editingRow) {
        void onUpdate(formData);
      } else {
        void onCreate(formData);
      }
    });
  }

  async function onCreate(formData: FormData) {
    const { ok, data } = await requestModuleJson<ApiPayload>(`/api/items/${module}`, {
      method: "POST",
      body: formData,
    });
    if (!ok) {
      const errMsg = data.error ?? "Failed to save data.";
      showApiError(toast, data, "Failed to save data.");
      setFieldErrors(parseFieldError(configFields, errMsg));
      return;
    }

    finishCreateSuccess(data.message);
  }

  async function onUpdate(formData: FormData) {
    if (!editingRow) return;

    const entry = Object.fromEntries(formData.entries());

    const { ok, data } = await requestModuleJson<ApiPayload>(`/api/items/${module}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editingRow.id,
        entry,
      }),
    });
    if (!ok) {
      const errMsg = data.error ?? "Failed to update data.";
      showApiError(toast, data, "Failed to update data.");
      setFieldErrors(parseFieldError(configFields, errMsg));
      return;
    }

    finishUpdateSuccess(data.message);
  }

  async function onImport(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    const { ok, data } = await requestModuleJson<ApiPayload>(`/api/import/${module}`, {
      method: "POST",
      body: formData,
    });
    if (!ok) {
      showApiError(toast, data, "Import failed.");
      return;
    }

    showApiSuccess(toast, data, "Import successful.");
    refreshPage();
  }

  async function onDelete(id: number | string) {
    const { ok, data } = await requestModuleJson<ApiPayload>(`/api/items/${module}?id=${id}`, {
      method: "DELETE",
    });
    if (!ok) {
      showApiError(toast, data, "Failed to delete data.");
      return;
    }
    showApiSuccess(toast, data, "Data deleted successfully.");
    refreshPage();
  }

  function clearPendingDeleteTimer() {
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
  }

  function cancelPendingDelete() {
    clearPendingDeleteTimer();
    setPendingDeleteId(null);
    toast("Delete cancelled.", "success");
  }

  function requestDelete(id: string | number) {
    if (undoTimerRef.current !== null && pendingDeleteId !== null && pendingDeleteId !== id) {
      clearPendingDeleteTimer();
      void onDelete(pendingDeleteId);
    } else {
      clearPendingDeleteTimer();
    }
    setPendingDeleteId(id);
    toast("Item deleted. Undo available for", "info", {
      duration: 4000,
      countdown: true,
      actionLabel: "Undo",
      onAction: cancelPendingDelete,
    });
    undoTimerRef.current = setTimeout(() => {
      undoTimerRef.current = null;
      setPendingDeleteId(null);
      void onDelete(id);
    }, 4000);
  }

  function performSingleDelete() {
    if (deleteId === null) return;
    requestDelete(deleteId);
    setDeleteId(null);
  }

  async function onUpdateStatus(id: number | string, status: string) {
    const { ok, data } = await requestModuleJson<ApiPayload>(`/api/items/${module}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (!ok) {
      showApiError(toast, data, "Failed to update status.");
      return;
    }
    showApiSuccess(toast, data, "Status updated successfully.");
    refreshPage();
  }

  return {
    refreshPage,
    openFormEditor,
    closeFormEditor,
    handleFormSubmit,
    onImport,
    onUpdateStatus,
    performSingleDelete,
    checkDuplicates,
  };
}
