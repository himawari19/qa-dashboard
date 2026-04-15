"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { 
  DownloadSimple, 
  FileXls, 
  Plus, 
  UploadSimple, 
  Trash, 
  X, 
  Tag, 
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
  CopySimple
} from "@phosphor-icons/react";
import { Badge } from "@/components/badge";
import { KanbanBoard } from "@/components/kanban-board";
import { type ModuleKey, moduleConfigs } from "@/lib/modules";
import { cn, formatDate } from "@/lib/utils";

import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "@/components/ui/toast";
import { HighlightText } from "@/components/highlight-text";
import { ModernDatePicker } from "@/components/date-picker";
import { ConfirmModal } from "@/components/ui/confirm-modal";

function linkifyToMarkdown(text: string) {
  if (!text) return "-";
  const regex = /(?<!\[.*?)((?:TASK|BUG|TC|MTG|LOG|SUITE|PLAN)-\d+)(?!.*?\])/g;
  return text.replace(regex, (match) => {
    let href = "/";
    if (match.startsWith("TASK")) href = "/tasks";
    else if (match.startsWith("BUG")) href = "/bugs";
    else if (match.startsWith("TC")) href = "/test-case-management";
    else if (match.startsWith("MTG")) href = "/meeting-notes";
    else if (match.startsWith("LOG")) href = "/daily-logs";
    else if (match.startsWith("SUITE")) href = "/test-suites";
    else if (match.startsWith("PLAN")) href = "/test-plans";
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
}: {
  module: ModuleKey;
  rows: Row[];
}) {
  const config = moduleConfigs[module];
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");
  const [editingRow, setEditingRow] = useState<Row | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
  const [deleteId, setDeleteId] = useState<string | number | null>(null);
  const [isBulkDelete, setIsBulkDelete] = useState(false);
  const [duplicates, setDuplicates] = useState<any[]>([]);

  const statusField = config.fields.find((f) => f.name === "status");
  const statusOptions = statusField && "options" in statusField ? statusField.options : [];
  const hasKanban = statusOptions.length > 0 && (module === "tasks" || module === "bugs" || module === "test-cases");

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

  const visibleRows = rows.filter((row) =>
    Object.values(row).some((val) =>
      String(val).toLowerCase().includes(searchQuery.toLowerCase()),
    ),
  );

  const checkDuplicates = async (title: string) => {
    if (module !== "bugs" || title.length < 5) {
      setDuplicates([]);
      return;
    }
    try {
      const res = await fetch(`/api/bugs/find-duplicates?title=${encodeURIComponent(title)}`);
      const data = await res.json();
      setDuplicates(data.duplicates || []);
    } catch {
      setDuplicates([]);
    }
  };

  async function onCreate(formData: FormData) {
    const response = await fetch(`/api/items/${module}`, {
      method: "POST",
      body: formData,
    });
    const data = (await response.json()) as { message?: string; error?: string };
    if (!response.ok) {
      toast(data.error ?? "Failed to save data.", "error");
      return;
    }

    toast(data.message ?? "Data saved successfully.", "success");
    const form = document.getElementById(`${module}-form`) as HTMLFormElement | null;
    form?.reset();
    localStorage.removeItem(`draft-${module}`);
    setShowForm(false);
    router.refresh();
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
      toast(data.error ?? "Failed to update data.", "error");
      return;
    }

    toast(data.message ?? "Data updated successfully.", "success");
    setEditingRow(null);
    setShowForm(false);
    router.refresh();
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
    setSelectedIds(new Set()); // Cleanup selection
    router.refresh();
  }

  async function performBulkDelete() {
    const ids = Array.from(selectedIds).join(",");
    const response = await fetch(`/api/items/${module}?ids=${ids}`, {
      method: "DELETE",
    });
    const data = (await response.json()) as { message?: string; error?: string };
    if (!response.ok) {
      toast(data.error ?? "Failed to delete items.", "error");
      return;
    }

    toast(data.message ?? "Bulk deletion successful.", "success");
    setSelectedIds(new Set()); // Clear selection
    setDeleteId(null);
    setIsBulkDelete(false);
    router.refresh();
  }

  async function performSingleDelete() {
    if (deleteId === null) return;
    await onDelete(deleteId);
    setDeleteId(null);
  }



  const toggleSelect = (id: string | number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === visibleRows.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(visibleRows.map((r) => r.id as string | number)));
    }
  };

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
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <section className="border border-[#c9d7e3] bg-white">
        <div className="border-b border-[#d9e2ea] bg-[#f4f8fb] px-6 py-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-700">
                {config.shortTitle}
              </p>
              <h2 className="mt-2 text-4xl font-bold tracking-tight text-slate-900">
                {config.title}
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                {config.description}
              </p>
            </div>

        <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => {
                  setEditingRow(null);
                  setShowForm((value) => !value);
                }}
            className="inline-flex h-11 items-center gap-2 rounded-full border border-sky-200 bg-white px-5 text-sm font-semibold text-sky-700 shadow-sm transition duration-200 hover:border-sky-600 hover:bg-sky-600 hover:text-white hover:shadow-md"
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
            className="inline-flex h-12 w-16 items-center justify-center rounded-full border border-sky-200 bg-white text-sky-700 shadow-sm transition duration-200 hover:border-sky-600 hover:bg-sky-600 hover:text-white hover:shadow-md"
              >
                <FileXls size={18} weight="bold" className="shrink-0" />
              </a>
              <a
                href={`/api/export/${module}?template=1`}
                title="Download Template"
                aria-label="Download Template"
            className="inline-flex h-12 w-16 items-center justify-center rounded-full border border-sky-200 bg-white text-sky-700 shadow-sm transition duration-200 hover:border-sky-600 hover:bg-sky-600 hover:text-white hover:shadow-md"
              >
                <DownloadSimple size={18} weight="bold" className="shrink-0" />
              </a>
              <label
                title="Import Excel"
                aria-label="Import Excel"
          className="inline-flex h-12 w-16 cursor-pointer items-center justify-center rounded-full border border-sky-200 bg-white text-sky-700 shadow-sm transition duration-200 hover:border-sky-600 hover:bg-sky-600 hover:text-white hover:shadow-md"
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

        <div className="space-y-4 border-b border-[#d9e2ea] bg-white px-6 py-5 text-sm text-slate-600 lg:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              {hasKanban ? (
                <div className="flex h-10 items-center overflow-hidden rounded-full border border-[#c9d7e3] bg-white">
                  <button
                    type="button"
                    onClick={() => setViewMode("table")}
                    className={cn(
                      "px-4 text-sm font-semibold transition h-full",
                      viewMode === "table" ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:bg-slate-50",
                    )}
                  >
                    Table
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("kanban")}
                    className={cn(
                      "border-l border-[#d9e2ea] px-4 text-sm font-semibold transition h-full",
                      viewMode === "kanban" ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:bg-slate-50",
                    )}
                  >
                    Kanban
                  </button>
                </div>
              ) : null}

              {selectedIds.size > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setIsBulkDelete(true);
                    setDeleteId("bulk");
                  }}
                  className="inline-flex h-10 items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 text-xs font-bold text-rose-600 shadow-sm transition hover:bg-rose-600 hover:text-white"
                >
                  <Trash size={14} weight="bold" />
                  Delete Selected ({selectedIds.size})
                </button>
              )}
            </div>
            <div className="ml-auto w-44 shrink-0">
              <input
                type="text"
                placeholder="Filter data..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-full rounded-full border border-[#c9d7e3] px-4 text-[11px] font-medium outline-none transition focus:border-sky-500 focus:shadow-md focus:bg-white shadow-sm bg-slate-50/50"
              />
            </div>
          </div>
        </div>

        {showForm ? (
          <div className="rounded-[28px] border border-slate-200 bg-slate-50 px-6 py-6 shadow-sm">
            <div className="mb-6 grid gap-3 sm:flex sm:items-center sm:justify-between">
              <div>
                <h3 className="text-2xl font-semibold text-slate-900">
                  {editingRow ? `Edit ${config.shortTitle}` : `Create New ${config.shortTitle}`}
                </h3>
                <p className="mt-2 max-w-2xl text-sm text-slate-600">
                  {editingRow ? "Update existing data." : "Fill in new data with a consistent format for import/export and tracking."}
                </p>
              </div>
              <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
                Enter QA data clearly and quickly
              </div>
            </div>

            <form
              id={`${module}-form`}
              className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl"
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {config.fields.map((field) => {
                  const isFullWidth = field.kind === "textarea";
                  const Icon = fieldIcons[field.name] || <Note size={16} />;

                  return (
                    <label
                      key={field.name}
                      className={cn(
                        "flex flex-col gap-2.5",
                        isFullWidth ? "md:col-span-2 lg:col-span-3" : "md:col-span-1"
                      )}
                    >
                      <span className="flex items-center gap-2 text-[13px] font-bold text-slate-700">
                        {Icon}
                        {field.label}
                        {field.required && <span className="text-rose-500">*</span>}
                      </span>
                      {field.kind === "textarea" ? (
                        <textarea
                          name={field.name}
                          rows={field.rows ?? 4}
                          defaultValue={editingRow ? String(editingRow[field.name] || "") : ""}
                          required={field.required}
                          placeholder={field.placeholder ?? `Enter ${field.label}`}
                          className="min-h-[120px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-sky-300 focus:bg-white focus:shadow-[0_0_0_4px_rgba(56,189,248,0.1)]"
                        />
                      ) : field.kind === "text" && field.name === "title" && module === "bugs" ? (
                        <div className="flex flex-col gap-2">
                          <input
                            type="text"
                            name={field.name}
                            defaultValue={editingRow ? String(editingRow[field.name] || "") : ""}
                            required={field.required}
                            autoComplete="off"
                            placeholder={field.placeholder ?? `Enter ${field.label}`}
                            onChange={(e) => checkDuplicates(e.target.value)}
                            className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition focus:border-sky-300 focus:bg-white focus:shadow-[0_0_0_4px_rgba(56,189,248,0.1)]"
                          />
                          {duplicates.length > 0 && (
                            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 animate-in fade-in slide-in-from-top-2 duration-300">
                              <p className="flex items-center gap-2 text-xs font-bold text-amber-800 mb-2">
                                <WarningCircle size={14} weight="fill" />
                                Potential Duplicates Found:
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {duplicates.map(dup => (
                                  <div key={dup.id} className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-[11px] shadow-sm">
                                    <span className="font-bold text-amber-700">{dup.code}</span>
                                    <span className="max-w-[120px] truncate text-slate-600 font-medium">{dup.title}</span>
                                    <Badge value={dup.status} />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : field.kind === "select" ? (
                        <select
                          name={field.name}
                          defaultValue={editingRow ? String(editingRow[field.name]) : ""}
                          required={field.required}
                          className="h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition focus:border-sky-300 focus:bg-white focus:shadow-[0_0_0_4px_rgba(56,189,248,0.1)]"
                        >
                          <option value="" disabled>
                            Select {field.label}
                          </option>
                          {field.options.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : field.kind === "url" ? (
                        <input
                          type="text"
                          name={field.name}
                          required={field.required}
                          placeholder={field.placeholder ?? "Paste link or upload file"}
                          className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition focus:border-sky-300 focus:bg-white focus:shadow-[0_0_0_4px_rgba(56,189,248,0.1)]"
                          onPaste={async (e) => {
                            const items = e.clipboardData?.items;
                            if (!items) return;
                            for (let i = 0; i < items.length; i++) {
                              if (items[i].type.indexOf("image") !== -1) {
                                e.preventDefault();
                                const blob = items[i].getAsFile();
                                if (!blob) return;

                                const input = e.currentTarget;
                                const originalPlaceholder = input.placeholder;
                                input.placeholder = "Uploading image...";
                                input.disabled = true;

                                const formData = new FormData();
                                formData.append("file", blob, "pasted-image.png");

                                try {
                                  const res = await fetch("/api/upload", {
                                    method: "POST",
                                    body: formData,
                                  });
                                  if (res.ok) {
                                    const data = await res.json();
                                    input.value = data.url;
                                  } else {
                                    alert("Upload failed");
                                  }
                                } catch (err) {
                                  console.error(err);
                                  alert("Upload error");
                                } finally {
                                  input.disabled = false;
                                  input.placeholder = originalPlaceholder;
                                  input.focus();
                                }
                                break;
                              }
                            }
                          }}
                        />
                      ) : field.kind === "date" ? (
                        <ModernDatePicker
                          name={field.name}
                          value={editingRow ? String(editingRow[field.name] || "") : ""}
                          required={field.required}
                        />
                      ) : (
                        <input
                          type={field.kind}
                          name={field.name}
                          defaultValue={editingRow ? String(editingRow[field.name] || "") : ""}
                          required={field.required}
                          placeholder={field.placeholder ?? `Enter ${field.label}`}
                          className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition focus:border-sky-300 focus:bg-white focus:shadow-[0_0_0_4px_rgba(56,189,248,0.1)]"
                        />
                      )}
                    </label>
                  );
                })}
              </div>

              <div className="md:col-span-2 xl:col-span-4 flex flex-col gap-3 border-t border-slate-200 pt-5 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={pending}
                    style={{ backgroundColor: editingRow ? '#16a34a' : '#0369a1' }}
                    className={cn(
                      "h-12 rounded-2xl px-8 text-sm font-bold text-white transition duration-200 shadow-md hover:opacity-90 disabled:cursor-not-allowed disabled:bg-slate-400",
                    )}
                  >
                    {pending ? "Processing..." : editingRow ? `Save ${config.shortTitle}` : `Add ${config.shortTitle}`}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="h-12 rounded-2xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        ) : null}

        {viewMode === "table" ? (
          <div className="max-w-full overflow-x-auto px-6 py-6">
            <table className="w-full min-w-[980px] border-collapse table-auto">
              <thead className="bg-slate-100">
                <tr>
                  <th className="border border-[#d9e2ea] px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600 w-10">
                    <input 
                      type="checkbox" 
                      className="h-4 w-4 rounded border-slate-300 accent-sky-600"
                      checked={visibleRows.length > 0 && selectedIds.size === visibleRows.length}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="border border-[#d9e2ea] px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600 w-12">
                    No.
                  </th>
                  {config.columns.map((column) => (
                    <th
                      key={column.key}
                      className="border border-[#d9e2ea] px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600"
                    >
                      {column.label}
                    </th>
                  ))}
                  <th className="border border-[#d9e2ea] px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={config.columns.length + 2}
                      className="border border-[#d9e2ea] px-4 py-10 text-center text-sm text-slate-500"
                    >
                      No data found.
                    </td>
                  </tr>
                ) : (
                  visibleRows.map((row, index) => (
                    <tr 
                      key={String(row.id)} 
                      className={cn(
                        "bg-white align-top transition-colors", 
                        selectedIds.has(row.id as string | number) ? "bg-sky-50/50" : "even:bg-slate-50/70"
                      )}
                    >
                      <td className="border border-[#d9e2ea] px-3 py-2 text-center align-middle">
                        <input 
                          type="checkbox" 
                          className="h-4 w-4 rounded border-slate-300 accent-sky-600"
                          checked={selectedIds.has(row.id as string | number)}
                          onChange={() => toggleSelect(row.id as string | number)}
                        />
                      </td>
                      <td className="relative border border-[#d9e2ea] px-3 py-2 text-center text-xs font-bold text-slate-400 align-middle">
                        {index + 1}
                        {module === "bugs" && row.status !== "fixed" && row.status !== "closed" && row.createdAt && !isNaN(new Date(String(row.createdAt)).getTime()) && (new Date().getTime() - new Date(String(row.createdAt)).getTime() > 3 * 24 * 60 * 60 * 1000) && (
                          <div className="absolute top-1 left-1 h-2 w-2 rounded-full bg-rose-500 animate-pulse shadow-sm shadow-rose-200" title="Stale Bug (>3 days)" />
                        )}
                      </td>
                      {config.columns.map((column) => {
                        const value = row[column.key];
                        return (
                          <td
                            key={column.key}
                            className={cn(
                              "max-w-64 border border-[#d9e2ea] px-3 py-2 text-sm text-slate-700"
                            )}
                          >
                            {column.internalLink && value ? (
                              <Link
                                href={column.internalLink(row)}
                                className="break-all text-sky-700 font-semibold hover:underline"
                              >
                                {String(value)}
                              </Link>
                            ) : column.link && value ? (
                              <a
                                href={String(value)}
                                target="_blank"
                                rel="noreferrer"
                                className="break-all text-sky-700 hover:underline"
                              >
                                {String(value)}
                              </a>
                            ) : column.tone ? (
                              <Badge value={String(value)} />
                            ) : column.key.toLowerCase().includes("date") ? (
                              formatDate(String(value))
                            ) : column.multiline ? (
                              <div className="prose prose-sm prose-slate max-w-none prose-p:leading-relaxed prose-a:font-semibold prose-a:text-sky-700 hover:prose-a:underline break-words">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}> 
                                  {linkifyToMarkdown(String(value || ""))}
                                </ReactMarkdown>
                              </div>
                            ) : (
                              <HighlightText text={String(value || "-")} query={searchQuery} />
                            )}
                          </td>
                        );
                      })}
                      <td className="border border-[#d9e2ea] px-3 py-2">
                        <div className="flex items-center gap-2">
                          {module === "bugs" && (
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
                          )}
                          {module === "test-suites" && (
                            <Link
                              href={`/test-suites/execute/${row.id}`}
                              className="rounded-sm bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-violet-700"
                            >
                              Execute
                            </Link>
                          )}
                          {module === "sql-snippets" && (
                             <button
                               type="button"
                               onClick={() => {
                                 navigator.clipboard.writeText(String(row.query)).then(() => {
                                   toast("SQL Query copied to clipboard!", "success");
                                 });
                               }}
                               className="rounded-sm border border-violet-200 px-2 py-1.5 text-xs font-semibold text-violet-700 transition hover:bg-violet-50"
                             >
                               <CopySimple size={13} weight="bold" />
                             </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingRow(row);
                              setShowForm(true);
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                            className="rounded-sm border border-sky-200 px-3 py-1.5 text-xs font-semibold text-sky-700 transition hover:bg-sky-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteId(row.id);
                              setIsBulkDelete(false);
                            }}
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
          </div>
        ) : (
          <div className="p-5 bg-slate-50 border-t border-[#d9e2ea]">
            <KanbanBoard
              rows={visibleRows}
              statusOptions={statusOptions}
              onUpdateStatus={onUpdateStatus}
            />
          </div>
        )}
      </section>

      {/* FLOATING BULK ACTION BAR */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-10 left-1/2 z-50 flex -translate-x-1/2 items-center gap-6 rounded-3xl border border-slate-200 bg-white px-8 py-4 shadow-2xl animate-in fade-in slide-in-from-bottom-5">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-600 text-[10px] font-black text-white">
              {selectedIds.size}
            </span>
            <span className="text-sm font-bold text-slate-700">Items selected</span>
          </div>
          <div className="h-6 w-px bg-slate-200" />
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setIsBulkDelete(true);
                setDeleteId("bulk");
              }}
              disabled={pending}
              className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-2 text-sm font-bold text-rose-600 transition hover:bg-rose-600 hover:text-white disabled:opacity-50"
            >
              <Trash size={18} weight="bold" />
              Delete Selected
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="flex items-center justify-center rounded-full bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"
            >
              <X size={18} weight="bold" />
            </button>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={deleteId !== null}
        title={isBulkDelete ? "Bulk Delete" : "Delete Item"}
        message={isBulkDelete 
          ? `Are you sure you want to delete ${selectedIds.size} selected items? This action is permanent.` 
          : "Are you sure you want to delete this item? This action cannot be undone."}
        type="danger"
        confirmText="Delete"
        onConfirm={isBulkDelete ? performBulkDelete : performSingleDelete}
        onCancel={() => {
          setDeleteId(null);
          setIsBulkDelete(false);
        }}
      />
    </div>
  );
}
