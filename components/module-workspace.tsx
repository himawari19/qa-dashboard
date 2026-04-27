"use client";

import { useEffect, useState, useTransition, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  DownloadSimple, 
  FileXls, 
  Plus, 
  UploadSimple, 
  Tag, 
  X,
  Folder, 
  Compass, 
  SquaresFour, 
  Pulse, 
  Shield, 
  Calendar, 
  TextAlignLeft, 
  Note, 
  Paperclip,
  CheckCircle,
  WarningCircle,
  Clock,
  CopySimple,
  CaretUp,
  CaretDown
} from "@phosphor-icons/react";
import { Badge } from "@/components/badge";
import { KanbanBoard } from "@/components/kanban-board";
import { type ModuleKey, moduleConfigs } from "@/lib/modules";
import { cn, formatDate } from "@/lib/utils";

import Link from "next/link";
import { toast } from "@/components/ui/toast";
import { HighlightText } from "@/components/highlight-text";
import { ModernDatePicker } from "@/components/date-picker";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { Breadcrumb } from "@/components/breadcrumb";
import { AutoResizeTextarea } from "@/components/ui/auto-resize-textarea";

function linkifyToMarkdown(text: string) {
  if (!text) return "-";
  const regex = /\b((?:TASK|BUG|TC|MTG|SUITE|PLAN)-\d+)\b/g;
  return text.replace(regex, (match) => {
    let href = "/";
    if (match.startsWith("TASK")) href = "/tasks";
    else if (match.startsWith("BUG")) href = "/bugs";
    else if (match.startsWith("TC")) href = "/test-cases";
    else if (match.startsWith("SUITE")) href = "/test-suites";
    else if (match.startsWith("PLAN")) href = "/test-plans";
    else if (match.startsWith("MTG")) href = "/meeting-notes";
    return `[${match}](${href})`;
  });
}

function formatBugForClipboard(row: Row): string {
  return [
    `🐛 *${row.code} — ${row.title}*`,
    ``,
    `*Project:* ${row.project || "-"}  |  *Module:* ${row.module || "-"}`,
    `*Severity:* ${String(row.severity).toUpperCase()}  |  *Priority:* ${row.priority}  |  *Status:* ${row.status}`,
    ``,
    `*Preconditions:*`,
    String(row.preconditions || "-"),
    ``,
    `*Steps to Reproduce:*`,
    String(row.stepsToReproduce || "-"),
    ``,
    `*Expected Result:* ${row.expectedResult || "-"}`,
    `*Actual Result:* ${row.actualResult || "-"}`,
    row.evidence ? `*Evidence:* ${row.evidence}` : "",
  ].filter(l => l !== undefined).join("\n");
}

type Row = Record<string, string | number>;

export function ModuleWorkspace({
  module,
  rows,
  relatedOptions = {},
  initialFormValues = {},
  hiddenFields = [],
}: {
  module: ModuleKey;
  rows: Row[];
  relatedOptions?: Record<string, Array<{ label: string; value: string }>>;
  initialFormValues?: Record<string, string>;
  hiddenFields?: string[];
}) {
  const config = moduleConfigs[module];
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");
  const [editingRow, setEditingRow] = useState<Row | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteId, setDeleteId] = useState<string | number | null>(null);
  const [duplicates, setDuplicates] = useState<{ id: number; code: string; title: string; status: string }[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [formDirty, setFormDirty] = useState(false);
  const [statusDropdownId, setStatusDropdownId] = useState<string | number | null>(null);
  const [openSelectField, setOpenSelectField] = useState<string | null>(null);
  const [selectValues, setSelectValues] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  // Filter state
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("");
  // Pagination
  const PAGE_SIZE = 20;
  const [page, setPage] = useState(1);
  // Undo delete
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | number | null>(null);

  useEffect(() => {
    if (!showForm || !initialFormValues) return;
    const form = document.getElementById(`${module}-form`) as HTMLFormElement | null;
    if (!form) return;
    for (const [key, value] of Object.entries(initialFormValues)) {
      const input = form.elements.namedItem(key) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null;
      if (input && !input.value) {
        input.value = value;
        // Sync select values for custom selects
        setSelectValues(prev => ({ ...prev, [key]: value }));
      }
    }
  }, [showForm, initialFormValues, module]);

  useEffect(() => {
    const storedView = window.localStorage.getItem(`qa-daily:view:${module}`);
    if (storedView === "table" || storedView === "kanban") {
      setViewMode(storedView);
    }
  }, [module]);

  useEffect(() => {
    window.localStorage.setItem(`qa-daily:view:${module}`, viewMode);
  }, [module, viewMode]);

  // Listen for qa:open-form event (keyboard shortcut Cmd+N)
  useEffect(() => {
    const handler = () => {
      setEditingRow(null);
      setShowForm(true);
      setTimeout(() => {
        document.getElementById("module-form-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    };
    window.addEventListener("qa:open-form", handler);
    
    // Auto-open if query has action=new
    const params = new URLSearchParams(window.location.search);
    if (params.get("action") === "new") {
      handler();
    }

    return () => window.removeEventListener("qa:open-form", handler);
  }, []);

  // Close status dropdown on outside click
  useEffect(() => {
    if (statusDropdownId === null) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-status-dropdown]")) setStatusDropdownId(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [statusDropdownId]);

  useEffect(() => {
    if (openSelectField === null) return;
    const handler = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest("[data-custom-select]")) setOpenSelectField(null);
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [openSelectField]);

  useEffect(() => {
    if (!showForm) return;
    const nextValues: Record<string, string> = {};
    for (const field of config.fields) {
      if (field.kind === "select") nextValues[field.name] = String(editingRow ? String(editingRow[field.name] ?? "") : "");
    }
    setSelectValues(nextValues);
  }, [showForm, editingRow, config.fields]);

  // Reset page when search/filter changes
  useEffect(() => { setPage(1); }, [searchQuery, filterStatus, filterPriority, filterSeverity]);

  const statusField = config.fields.find((f) => f.name === "status");
  const statusOptions = statusField && "options" in statusField ? statusField.options : [];
  const hasKanban = statusOptions.length > 0 && (module === "tasks" || module === "bugs" || module === "test-cases");

  const priorityField = config.fields.find((f) => f.name === "priority");
  const priorityOptions = priorityField && "options" in priorityField ? priorityField.options : [];
  const severityField = config.fields.find((f) => f.name === "severity");
  const severityOptions = severityField && "options" in severityField ? severityField.options : [];

  const fieldIcons: Record<string, any> = {
    title: <Tag size={16} className="text-sky-500" />,
    project: <Folder size={16} className="text-amber-500" />,
    projectName: <Folder size={16} className="text-amber-500" />,
    relatedFeature: <Compass size={16} className="text-purple-500" />,
    feature: <Compass size={16} className="text-purple-500" />,
    module: <SquaresFour size={16} className="text-indigo-500" />,
    moduleName: <SquaresFour size={16} className="text-indigo-500" />,
    category: <SquaresFour size={16} className="text-blue-500" />,
    status: <Pulse size={16} className="text-emerald-500" />,
    priority: <Shield size={16} className="text-orange-500" />,
    severity: <WarningCircle size={16} className="text-rose-500" />,
    dueDate: <Calendar size={16} className="text-rose-500" />,
    date: <Calendar size={16} className="text-rose-500" />,
    description: <TextAlignLeft size={16} className="text-slate-500" />,
    preconditions: <Clock size={16} className="text-amber-600" />,
    stepsToReproduce: <TextAlignLeft size={16} className="text-blue-600" />,
    expectedResult: <CheckCircle size={16} className="text-emerald-600" />,
    actualResult: <WarningCircle size={16} className="text-rose-600" />,
    notes: <Note size={16} className="text-slate-500" />,
    evidence: <Paperclip size={16} className="text-sky-600" />,
    referenceDocument: <Note size={16} className="text-teal-500" />,
    traceability: <Tag size={16} className="text-pink-500" />,
    createdBy: <Tag size={16} className="text-slate-500" />,
    whatTested: <Tag size={16} className="text-blue-500" />,
    issuesFound: <WarningCircle size={16} className="text-rose-500" />,
    progressSummary: <Pulse size={16} className="text-emerald-500" />,
    blockers: <X size={16} className="text-rose-600" />,
    nextPlan: <Clock size={16} className="text-indigo-500" />,
  };

  const filteredRows = useMemo(() => rows.filter((row) => {
    const matchSearch = Object.values(row).some((val) =>
      String(val).toLowerCase().includes(searchQuery.toLowerCase()),
    );
    const matchStatus = !filterStatus || String(row.status) === filterStatus;
    const matchPriority = !filterPriority || String(row.priority) === filterPriority;
    const matchSeverity = !filterSeverity || String(row.severity) === filterSeverity;
    return matchSearch && matchStatus && matchPriority && matchSeverity;
  }), [rows, searchQuery, filterStatus, filterPriority, filterSeverity]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visibleRows = filteredRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const preferredColumnOrder =
    module === "test-plans"
      ? [
          "code",
          "project",
          "title",
          "sprint",
          "startDate",
          "endDate",
          "scope",
          "notes",
          "status",
        ]
      : module === "test-suites"
        ? [
            "testPlanLabel",
            "title",
            "code",
            "assignee",
            "notes",
            "status",
          ]
      : module === "test-cases"
        ? [
            "testPlanLabel",
            "suiteTitle",
            "passed",
            "failed",
            "total",
          ]
      : [
          "code",
          "title",
          "tcId",
          "caseName",
          "testPlanLabel",
          "suiteTitle",
          "project",
          "module",
          "moduleName",
          "status",
          "typeCase",
          "priority",
          "severity",
          "date",
          "dueDate",
          "sprint",
          "startDate",
          "endDate",
          "assignee",
          "testPlanId",
          "testSuiteId",
          "scope",
          "notes",
          "preCondition",
          "testStep",
          "expectedResult",
          "actualResult",
        ];
  const defaultVisibleColumns = config.columns
    .filter((column) => preferredColumnOrder.includes(column.key))
    .sort((a, b) => preferredColumnOrder.indexOf(a.key) - preferredColumnOrder.indexOf(b.key));
  const visibleColumns = useMemo(
    () => defaultVisibleColumns.length > 0 ? defaultVisibleColumns : config.columns.slice(0, Math.min(6, config.columns.length)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [module]
  );

  const checkDuplicates = useCallback(async (title: string) => {
    if ((module !== "bugs" && module !== "tasks") || title.length < 5) {
      setDuplicates([]);
      return;
    }
    try {
      const endpoint = module === "tasks" ? "/api/tasks/find-duplicates" : "/api/bugs/find-duplicates";
      const res = await fetch(`${endpoint}?title=${encodeURIComponent(title)}`);
      const data = await res.json();
      setDuplicates(data.duplicates || []);
    } catch {
      setDuplicates([]);
    }
  }, [module]);

  // Upgrade 4: warn before leaving with unsaved form changes
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
  }, [showForm]);

  // Upgrade 6: format any row as readable text for clipboard
  const formatRowForClipboard = (row: Row): string => {
    return visibleColumns
      .map((col) => `${col.label}: ${String(row[col.key] || "-")}`)
      .join("\n");
  };

  function parseFieldError(msg: string): Record<string, string> {
    const lower = msg.toLowerCase();
    const fieldNames = config.fields.map((f) => f.name);
    for (const name of fieldNames) {
      if (lower.includes(name.toLowerCase())) return { [name]: msg };
    }
    // Try common patterns like "Title is required"
    const match = msg.match(/^(\w+)\s+is\s+/i);
    if (match) {
      const candidate = fieldNames.find((n) => n.toLowerCase() === match[1].toLowerCase());
      if (candidate) return { [candidate]: msg };
    }
    return {};
  }

  function refreshPage() {
    setRefreshing(true);
    router.refresh();
    setTimeout(() => setRefreshing(false), 800);
  }

  async function onCreate(formData: FormData) {
    const response = await fetch(`/api/items/${module}`, {
      method: "POST",
      body: formData,
    });
    const data = (await response.json()) as { message?: string; error?: string };
    if (!response.ok) {
      const errMsg = data.error ?? "Failed to save data.";
      toast(errMsg, "error");
      setFieldErrors(parseFieldError(errMsg));
      return;
    }

    setFieldErrors({});
    toast(data.message ?? "Data saved successfully.", "success");
    const form = document.getElementById(`${module}-form`) as HTMLFormElement | null;
    form?.reset();
    localStorage.removeItem(`draft-${module}`);
    setShowForm(false);
    refreshPage();
  }

  async function onUpdate(formData: FormData) {
    if (!editingRow) return;
    
    const entry = Object.fromEntries(formData.entries());
    
    const response = await fetch(`/api/items/${module}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editingRow.id,
        entry: entry
      }),
    });
    const data = (await response.json()) as { message?: string; error?: string };
    if (!response.ok) {
      const errMsg = data.error ?? "Failed to update data.";
      toast(errMsg, "error");
      setFieldErrors(parseFieldError(errMsg));
      return;
    }

    setFieldErrors({});
    toast(data.message ?? "Data updated successfully.", "success");
    setEditingRow(null);
    setShowForm(false);
    refreshPage();
  }

  async function onImport(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`/api/import/${module}`, {
      method: "POST",
      body: formData,
    });
    const data = (await response.json()) as { message?: string; error?: string };
    if (!response.ok) {
      toast(data.error ?? "Import failed.", "error");
      return;
    }

    toast(data.message ?? "Import successful.", "success");
    router.refresh();
  }

  async function onDelete(id: number | string) {
    const response = await fetch(`/api/items/${module}?id=${id}`, {
      method: "DELETE",
    });
    const data = (await response.json()) as { message?: string; error?: string };
    if (!response.ok) {
      toast(data.error ?? "Failed to delete data.", "error");
      return;
    }
    toast(data.message ?? "Data deleted successfully.", "success");
    refreshPage();
  }

  function requestDelete(id: string | number) {
    if (undoTimerRef.current !== null && pendingDeleteId !== null && pendingDeleteId !== id) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
      void onDelete(pendingDeleteId);
    } else if (undoTimerRef.current !== null) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
    setPendingDeleteId(id);
    toast("Item deleted. Undo available for", "info", {
      duration: 4000,
      countdown: true,
      actionLabel: "Undo",
      onAction: () => {
        if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
        undoTimerRef.current = null;
        setPendingDeleteId(null);
        toast("Delete cancelled.", "success");
      },
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
    const response = await fetch(`/api/items/${module}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    const data = await response.json();
    if (!response.ok) {
      toast(data.error ?? "Failed to update status.", "error");
      return;
    }
    toast(data.message ?? "Status updated successfully.", "success");
    refreshPage();
  }

  return (
    <div className="space-y-6">
      <div className="animate-in fade-in slide-in-from-top-2 duration-500">
        <Breadcrumb crumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: config.title }]} />
      </div>
      <section className="border border-[#c9d7e3] dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm overflow-hidden rounded-md">
        <div className="border-b border-[#d9e2ea] dark:border-slate-700 bg-[#f4f8fb] dark:bg-slate-800 px-6 py-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-700 dark:text-blue-400">
                {config.shortTitle}
              </p>
              <h2 className="mt-2 text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {config.title}
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400">
                {config.description}
              </p>
            </div>

            <div className="flex w-full flex-wrap items-center gap-2 xl:w-auto xl:justify-end">
              <button
                type="button"
                onClick={() => {
                  setEditingRow(null);
                  setShowForm((value) => {
                    const next = !value;
                    if (next) {
                      setTimeout(() => {
                        document.getElementById("module-form-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
                      }, 50);
                    }
                    return next;
                  });
                }}
                className="inline-flex h-11 items-center gap-2 rounded-md border border-sky-200 bg-white px-5 text-sm font-semibold text-sky-700 shadow-sm transition duration-200 hover:border-sky-600 hover:bg-sky-600 hover:text-white hover:shadow-md"
              >
                <Plus size={16} weight="bold" className="shrink-0" />
                {showForm
                  ? "Hide form"
                  : `Add ${config.shortTitle}`}
              </button>
              <a
                href={`/api/export/${module}`}
                title="Export Excel"
                aria-label="Export Excel"
                className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-sky-200 bg-white text-sky-700 shadow-sm transition duration-200 hover:border-sky-600 hover:bg-sky-600 hover:text-white hover:shadow-md"
              >
                <FileXls size={18} weight="bold" className="shrink-0" />
              </a>
              <a
                href={`/api/export/${module}?template=1`}
                title="Download Template"
                aria-label="Download Template"
                className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-sky-200 bg-white text-sky-700 shadow-sm transition duration-200 hover:border-sky-600 hover:bg-sky-600 hover:text-white hover:shadow-md"
              >
                <DownloadSimple size={18} weight="bold" className="shrink-0" />
              </a>
              <label
                title="Import Excel"
                aria-label="Import Excel"
                className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-md border border-sky-200 bg-white text-sky-700 shadow-sm transition duration-200 hover:border-sky-600 hover:bg-sky-600 hover:text-white hover:shadow-md"
              >
                <UploadSimple size={18} weight="bold" className="shrink-0" />
                <input
                  type="file"
                  accept=".xlsx"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    startTransition(() => {
                      void onImport(file);
                    });
                    event.target.value = "";
                  }}
                />
              </label>
            </div>
          </div>
        </div>
        <div className="sticky top-0 z-20 space-y-4 border-b border-[#d9e2ea] dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 px-6 py-5 text-sm text-slate-600 dark:text-slate-400 backdrop-blur lg:px-6">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              {hasKanban ? (
                <div className="flex h-10 items-center overflow-hidden rounded-md border border-[#c9d7e3] dark:border-slate-700 bg-white dark:bg-slate-800">
                  <button
                    type="button"
                    onClick={() => setViewMode("table")}
                    className={cn(
                      "px-4 text-sm font-semibold transition h-full",
                      viewMode === "table" ? "bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100" : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50",
                    )}
                  >
                    Table
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("kanban")}
                    className={cn(
                      "border-l border-[#d9e2ea] dark:border-slate-700 px-4 text-sm font-semibold transition h-full",
                      viewMode === "kanban" ? "bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100" : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50",
                    )}
                  >
                    Kanban
                  </button>
                </div>
              ) : null}
            </div>
            <div className="flex items-center gap-3 w-full xl:ml-auto xl:w-auto shrink-0">
              {(pending || refreshing) && (
                <span role="status" className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-600">
                  <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Refreshing...
                </span>
              )}
              </div>
          </div>
        </div>

        {showForm ? (
          <div id="module-form-section" className="rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-6 py-6 shadow-sm">
              <div className="mb-6 grid gap-3 sm:flex sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                    {editingRow ? `Edit ${config.shortTitle}` : `Create New ${config.shortTitle}`}
                  </h3>
                  <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
                    {editingRow ? "Update existing data." : "Fill in new data with a consistent format for import/export and tracking."}
                  </p>
                </div>
              </div>

            <form
              id={`${module}-form`}
              className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-8 shadow-xl"
              onChange={() => setFormDirty(true)}
              onSubmit={(event) => {
                event.preventDefault();
                const form = event.currentTarget;
                const data = new FormData(form);
                startTransition(() => {
                  if (editingRow) {
                    void onUpdate(data);
                  } else {
                    void onCreate(data);
                  }
                });
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {config.fields
                  .filter((field) => !(module === "test-plans" && field.name === "assignee"))
                  .filter((field) => !hiddenFields.includes(field.name))
                  .map((field) => {
                    const spanClass =
                      field.span === 3 ? "md:col-span-3" :
                      field.span === 2 ? "md:col-span-2" :
                      "md:col-span-1";
                    const Icon = fieldIcons[field.name] || <Note size={16} />;
                    const fieldError = fieldErrors[field.name];

                    return (
                      <label key={field.name} className={cn("flex flex-col gap-2.5", spanClass)}>
                        <span className="flex items-center gap-2 text-[13px] font-bold text-slate-700 dark:text-slate-300">
                          {Icon}
                          {field.label}
                          {field.required && <span className="text-rose-500">*</span>}
                        </span>
                        {field.kind === "select" ? (
                          <div className="relative" data-custom-select>
                            <input type="hidden" name={field.name} value={selectValues[field.name] ?? ""} readOnly />
                            <button
                              type="button"
                              onClick={() => setOpenSelectField(openSelectField === field.name ? null : field.name)}
                              className={cn(
                                "flex min-h-12 w-full items-center justify-between gap-3 rounded-md border bg-slate-50 dark:bg-slate-800 px-4 py-3 text-left text-sm text-slate-800 dark:text-slate-200 outline-none transition focus:bg-white dark:focus:bg-slate-700 focus:shadow-[0_0_0_4px_rgba(56,189,248,0.1)]",
                                fieldError ? "border-rose-400 focus:border-rose-400" : "border-slate-200 dark:border-slate-600 focus:border-blue-300",
                              )}
                            >
                              <span className="whitespace-normal break-words">
                                {(() => {
                                  const options = relatedOptions[field.name] ?? field.options ?? [];
                                  const current = options.find((opt) => opt.value === String(selectValues[field.name] ?? ""));
                                  return current?.label || `Select ${field.label}`;
                                })()}
                              </span>
                              <span className="shrink-0 text-slate-400">⌄</span>
                            </button>
                            {openSelectField === field.name && (
                              <div className="absolute left-0 top-full z-40 mt-1 w-full overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
                                {(relatedOptions[field.name] ?? field.options ?? []).map((option) => (
                                  <button
                                    key={option.value}
                                    type="button"
                                  onClick={() => {
                                      setSelectValues((s) => ({ ...s, [field.name]: option.value }));
                                      setOpenSelectField(null);
                                    }}
                                    className="block w-full whitespace-normal break-words px-4 py-3 text-left text-sm text-slate-700 hover:bg-blue-50 dark:text-slate-200 dark:hover:bg-slate-700"
                                  >
                                    {option.label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : field.kind === "date" ? (
                          <ModernDatePicker
                            name={field.name}
                            value={editingRow ? String(editingRow[field.name] || "") : ""}
                            required={field.required}
                          />
                        ) : (
                          <AutoResizeTextarea
                            name={field.name}
                            defaultValue={editingRow ? String(editingRow[field.name] || "") : ""}
                            required={field.required}
                            placeholder={field.placeholder ?? `Enter ${field.label}`}
                            disabled={module === "test-plans" && field.name === "scope"}
                            error={!!fieldError}
                            className={cn(
                              field.name === "scope" && module === "test-plans" && "bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                            )}
                          />
                        )}
                        {fieldError && <p className="text-xs font-semibold text-rose-600">{fieldError}</p>}
                      </label>
                    );
                  })}

              </div>

              <div className="mt-8 flex flex-col gap-3 border-t border-slate-200 pt-10 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={pending}
                    style={{ backgroundColor: editingRow ? '#16a34a' : '#2563eb' }}
                    className={cn(
                      "h-12 rounded-md px-8 text-sm font-bold text-white transition duration-200 shadow-md hover:opacity-90 disabled:cursor-not-allowed disabled:bg-slate-400",
                    )}
                  >
                    {pending ? "Processing..." : editingRow ? `Save ${config.shortTitle}` : `Add ${config.shortTitle}`}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="h-12 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-5 text-sm font-semibold text-slate-700 dark:text-slate-300 transition hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        ) : null}

        {!showForm && viewMode === "table" ? (
          <div className="max-w-full overflow-x-auto px-6 pb-32 pt-6">
            <table className="w-full min-w-[980px] border-collapse table-auto">
              <thead className="bg-slate-100 dark:bg-slate-800">
                <tr>
                  <th className="border border-[#d9e2ea] dark:border-slate-700 px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600 dark:text-slate-400 w-12">
                    No.
                  </th>
                  {visibleColumns.map((column) => (
                    <th
                      key={column.key}
                      className="border border-[#d9e2ea] dark:border-slate-700 px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600 dark:text-slate-400"
                    >
                      {column.label}
                    </th>
                  ))}
                  <th className="border border-[#d9e2ea] dark:border-slate-700 px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600 dark:text-slate-400">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={visibleColumns.length + 2}
                      className="border border-[#d9e2ea] dark:border-slate-700 px-4 py-16 text-center"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <div className="flex h-14 w-14 items-center justify-center rounded-md bg-slate-100 text-slate-400">
                          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 256 256" fill="currentColor">
                            <path d="M213.66,82.34l-56-56A8,8,0,0,0,152,24H56A16,16,0,0,0,40,40V216a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V88A8,8,0,0,0,213.66,82.34ZM160,51.31,188.69,80H160ZM200,216H56V40h88V88a8,8,0,0,0,8,8h48V216Z"/>
                          </svg>
                        </div>
                        <p className="text-base font-bold text-slate-700">No {config.shortTitle} yet</p>
                        <p className="text-sm text-slate-400">Add your first {config.shortTitle} to get started</p>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingRow(null);
                            setShowForm(true);
                            setTimeout(() => {
                              document.getElementById("module-form-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
                            }, 50);
                          }}
                          className="mt-1 inline-flex h-9 items-center gap-2 rounded-md border border-blue-200 bg-white px-4 text-sm font-semibold text-blue-700 transition hover:bg-blue-600 hover:text-white"
                        >
                          <Plus size={14} weight="bold" />
                          Add {config.shortTitle}
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  visibleRows.map((row, index) => (
                    <tr 
                      key={String(row.id)} 
                      className={cn("bg-white dark:bg-slate-900 align-top transition-colors even:bg-slate-50/70 dark:even:bg-slate-800/50", pendingDeleteId === row.id && "opacity-40 pointer-events-none")}
                    >
                      <td className="relative border border-[#d9e2ea] dark:border-slate-700 px-3 py-2 text-center text-xs font-bold text-slate-400 align-top">
                        {(safePage - 1) * PAGE_SIZE + index + 1}
                        {module === "bugs" && row.status !== "fixed" && row.status !== "closed" && row.createdAt && !isNaN(new Date(String(row.createdAt)).getTime()) && (() => {
                          const days = Math.floor((new Date().getTime() - new Date(String(row.createdAt)).getTime()) / (24 * 60 * 60 * 1000));
                          return days > 3 ? (
                            <span className="absolute -top-1 -right-1 rounded-md bg-rose-500 px-1 py-0.5 text-[9px] font-black leading-none text-white shadow-sm" title={`Stale Bug (${days} days old)`}>
                              {days}d
                            </span>
                          ) : null;
                        })()}
                      </td>
                      {visibleColumns.map((column) => {
                        const value = row[column.key];
                        if (((module === "test-suites" || module === "test-cases") && column.key === "testPlanLabel") || (module === "test-plans" && column.key === "project")) {
                          const rowSpanKey = module === "test-plans" ? "projectRowSpan" : "testPlanRowSpan";
                          const rowSpan = Number((row as Record<string, unknown>)[rowSpanKey] ?? 1);
                          if (rowSpan === 0) return null;
                          return (
                            <td
                              key={column.key}
                              rowSpan={rowSpan}
                              className="max-w-64 border border-[#d9e2ea] dark:border-slate-700 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 align-top whitespace-pre-wrap break-words"
                            >
                              {column.internalLink && value ? (
                                <Link
                                  href={column.internalLink(row)}
                                  className="break-all text-blue-700 font-semibold hover:underline"
                                >
                                  <HighlightText text={String(value)} query={searchQuery} linkify={false} />
                                </Link>
                              ) : (
                                <HighlightText text={String(value || "-")} query={searchQuery} linkify={!column.internalLink} />
                              )}
                            </td>
                          );
                        }
                        return (
                          <td
                            key={column.key}
                            className={cn(
                              "max-w-64 border border-[#d9e2ea] dark:border-slate-700 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 align-top whitespace-pre-wrap break-words"
                            )}
                          >
                            {column.internalLink && value ? (
                              <Link
                                href={column.internalLink(row)}
                                className="break-all text-blue-700 font-semibold hover:underline"
                              >
                                <HighlightText text={String(value)} query={searchQuery} linkify={false} />
                              </Link>
                            ) : column.link && value ? (
                              <a
                                href={String(value)}
                                target="_blank"
                                rel="noreferrer"
                                className="break-all text-blue-600 hover:underline"
                              >
                                <HighlightText text={String(value)} query={searchQuery} linkify={false} />
                              </a>
                            ) : column.tone === "status" && statusOptions.length > 0 && ["tasks","bugs","test-plans","test-sessions","test-suites"].includes(module) ? (
                              <div className="relative" data-status-dropdown>
                                <button
                                  type="button"
                                  onClick={() => setStatusDropdownId(statusDropdownId === row.id ? null : row.id)}
                                  className="cursor-pointer"
                                  title="Click to change status"
                                >
                                  <Badge value={String(value)} />
                                </button>
                                {statusDropdownId === row.id && (
                                  <div className={cn(
                                    "absolute left-0 z-[100] mt-1 min-w-[140px] rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-1 shadow-2xl animate-in fade-in zoom-in-95 duration-200",
                                    index > visibleRows.length - 3 && visibleRows.length > 3 ? "bottom-full mb-1" : "top-full"
                                  )}>
                                    {statusOptions.map((opt) => (
                                      <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => {
                                          void onUpdateStatus(row.id, opt.value);
                                          setStatusDropdownId(null);
                                        }}
                                        className={cn(
                                          "flex w-full items-center px-3 py-1.5 text-xs font-semibold transition hover:bg-slate-50 dark:hover:bg-slate-700",
                                          String(value) === opt.value ? "text-sky-700 dark:text-sky-400" : "text-slate-700 dark:text-slate-300"
                                        )}
                                      >
                                        {opt.label}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ) : column.tone ? (
                              <Badge value={String(value)} />
                            ) : column.key.toLowerCase().includes("date") ? (
                              formatDate(String(value))
                            ) : module === "test-plans" && column.key === "scope" && Array.isArray((row as Record<string, unknown>).relatedSuites) ? (
                              <div className="flex flex-col gap-1.5">
                                {((row as Record<string, unknown>).relatedSuites as Array<{ id: string; title: string; token?: string }>).length > 0 ? (
                                  (row as Record<string, unknown>).relatedSuites as Array<{ id: string; title: string; token?: string }>
                                ).map((suite) => (
                                  <Link
                                    key={suite.id}
                                    href={`/test-cases/detail/${suite.token}`}
                                    className="rounded-sm bg-sky-50 px-2 py-1 text-xs font-semibold text-sky-700 hover:bg-sky-100 dark:bg-sky-950/50 dark:text-sky-300"
                                  >
                                    {suite.title || suite.id}
                                  </Link>
                                )) : (
                                  <span>-</span>
                                )}
                              </div>
                              ) : column.multiline ? (
                                <div className="max-h-24 overflow-auto rounded-sm bg-slate-50 dark:bg-slate-800 p-2 text-xs leading-relaxed whitespace-pre-wrap break-words">
                                  <HighlightText text={String(value || "-")} query={searchQuery} />
                                </div>
                              ) : (
                              <HighlightText text={String(value || "-")} query={searchQuery} />
                            )}
                          </td>
                        );
                      })}
                      <td className="border border-[#d9e2ea] dark:border-slate-700 px-3 py-2 align-top">
                        <div className="flex items-center gap-2">
                          {/* Upgrade 6: copy row as text for all modules */}
                          {module !== "assignees" && (
                            module === "bugs" ? (
                              <button
                                type="button"
                                title="Copy bug report to clipboard"
                                onClick={() => {
                                  const text = formatBugForClipboard(row);
                                  navigator.clipboard.writeText(text).then(() => {
                                    toast(`${row.code} formatted & copied to clipboard`);
                                  });
                                }}
                                className="rounded-sm border border-violet-200 px-2 py-1.5 text-xs font-semibold text-violet-700 transition hover:bg-violet-50"
                              >
                                <CopySimple size={13} weight="bold" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                title="Copy row as text"
                                onClick={() => {
                                  const text = formatRowForClipboard(row);
                                  navigator.clipboard.writeText(text).then(() => {
                                    toast("Copied to clipboard");
                                  });
                                }}
                                className="rounded-sm border border-slate-200 px-2 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-50"
                              >
                                <CopySimple size={13} weight="bold" />
                              </button>
                            )
                          )}
                          {module === "test-suites" && (
                            <Link
                              href={`/test-suites/execute/${String((row as Record<string, unknown>).publicToken ?? "")}`}
                              className="rounded-sm bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-violet-700"
                            >
                              Execute
                            </Link>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingRow(row);
                              setShowForm(true);
                              setTimeout(() => {
                                document.getElementById("module-form-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
                              }, 50);
                            }}
                            className="rounded-sm border border-sky-200 px-3 py-1.5 text-xs font-semibold text-sky-700 transition hover:bg-sky-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteId(row.id)}
                            className="rounded-sm border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between border-t border-[#d9e2ea] dark:border-slate-700 pt-4">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {filteredRows.length} result{filteredRows.length !== 1 ? "s" : ""} · Page {safePage} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={safePage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="h-8 rounded-md border border-[#c9d7e3] dark:border-slate-700 bg-white dark:bg-slate-800 px-4 text-xs font-semibold text-slate-600 dark:text-slate-300 transition hover:border-sky-400 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    ← Prev
                  </button>
                  <button
                    type="button"
                    disabled={safePage >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="h-8 rounded-md border border-[#c9d7e3] dark:border-slate-700 bg-white dark:bg-slate-800 px-4 text-xs font-semibold text-slate-600 dark:text-slate-300 transition hover:border-sky-400 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-hidden bg-slate-50 dark:bg-slate-800/50 border-t border-[#d9e2ea] dark:border-slate-700 p-5">
            {!showForm && (
              <KanbanBoard
                rows={visibleRows}
                statusOptions={statusOptions}
                onUpdateStatus={onUpdateStatus}
              />
            )}
          </div>
        )}
      </section>

      <ConfirmModal
        isOpen={deleteId !== null}
        title="Delete Item"
        message="Are you sure you want to delete this item? This action cannot be undone."
        type="danger"
        confirmText="Delete"
        onConfirm={performSingleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
