"use client";

import type { KeyboardEvent, TextareaHTMLAttributes } from "react";
import { useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn, formatDate } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Play } from "@phosphor-icons/react";
import { TestRunner } from "@/components/test-runner";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { toast } from "@/components/ui/toast";

type Row = Record<string, unknown>;

function handleTextareaKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
  }
}

function AutoGrowTextarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.max(el.scrollHeight, 32)}px`;
  }, [props.value]);

  return (
    <textarea
      {...props}
      ref={ref}
      rows={1}
      className="min-h-[32px] w-full min-w-0 resize-none overflow-hidden border-0 bg-transparent px-2 py-2 text-xs font-medium leading-5 outline-none focus:ring-0"
    />
  );
}

function selectTone(value: string) {
  if (value === "Positive" || value === "Success") return "bg-emerald-500 text-white border-emerald-500";
  if (value === "Negative" || value === "Failed") return "bg-rose-500 text-white border-rose-500";
  if (value === "Pending") return "bg-amber-400 text-amber-950 border-amber-400";
  if (value === "Blocked") return "bg-orange-500 text-white border-orange-500";
  return "bg-slate-100 text-slate-900 border-slate-300";
}

function linkifyToMarkdown(text: string) {
  if (!text) return "-";
  const regex = /\b((?:TASK|BUG|TC|MTG|LOG)-\d+)\b/g;
  return text.replace(regex, (match) => {
    let href = "/";
    if (match.startsWith("TASK")) href = "/tasks";
    else if (match.startsWith("BUG")) href = "/bugs";
    else if (match.startsWith("TC")) href = "/test-cases";
    else if (match.startsWith("MTG")) href = "/meeting-notes";
    else if (match.startsWith("LOG")) href = "/daily-logs";
    return `[${match}](${href})`;
  });
}

const testCaseFields = [
  { name: "tcId", label: "TC ID", kind: "text", required: true },
  { name: "caseName", label: "Case Name", kind: "textarea", required: true },
  { name: "typeCase", label: "Type Case", kind: "select", options: [{ label: "Positive", value: "Positive" }, { label: "Negative", value: "Negative" }], required: true },
  { name: "preCondition", label: "Pre-Condition", kind: "textarea", required: false },
  { name: "testStep", label: "Test Step", kind: "textarea", required: true },
  { name: "expectedResult", label: "Expected Result", kind: "textarea", required: true },
  { name: "actualResult", label: "Actual Result", kind: "textarea", required: false },
  { name: "status", label: "Status", kind: "select", options: [{ label: "Pending", value: "Pending" }, { label: "Success", value: "Success" }, { label: "Failed", value: "Failed" }], required: true },
  { name: "evidence", label: "Evidence", kind: "textarea", required: false },
];

export function TestCaseGrid({
  scenario,
  rows,
}: {
  scenario: Row;
  rows: Row[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info");
  const [formValues, setFormValues] = useState<Record<string, string>>({
    typeCase: "",
    status: ""
  });
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [runnerOpen, setRunnerOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const firstInputRef = useRef<HTMLTextAreaElement | HTMLSelectElement | HTMLInputElement>(null);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  async function onCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    startTransition(async () => {
      setMessage("");
      const response = await fetch(`/api/test-cases`, {
        method: "POST",
        body: data,
      });
      const result = (await response.json()) as { message?: string; error?: string };
      if (response.ok) {
        setMessage(result.message ?? "Test case created.");
        form.reset();
        setFormValues({ typeCase: "", status: "" });
        router.refresh();
        if (firstInputRef.current) {
          firstInputRef.current.focus();
        }
      } else {
        setMessageType("error");
        setMessage(result.error ?? "Failed to create test case.");
      }
    });
  }

  async function onDelete(id: number) {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setDeleteId(id);
    toast("Item deleted. Undo available for", "info", {
      duration: 4000,
      countdown: true,
      actionLabel: "Undo",
      onAction: () => {
        if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
        setDeleteId(null);
        toast("Delete cancelled.", "success");
      },
    });
    undoTimerRef.current = setTimeout(() => {
      startTransition(async () => {
        setMessage("");
        const response = await fetch(`/api/test-cases?id=${id}`, { method: "DELETE" });
        const result = await response.json();
        if (response.ok) {
          setMessageType("success");
          setMessage(result.message ?? "Item deleted.");
          setDeleteId(null);
          router.refresh();
        } else {
          setMessageType("error");
          setMessage(result.error ?? "Failed to delete.");
        }
      });
    }, 4000);
  }

  const performDelete = async () => {
    if (deleteId === null) return;
    void onDelete(deleteId);
    setDeleteId(null);
  };

  const renderValue = (columnKey: string, value: unknown) => {
    const textValue = typeof value === "string" || typeof value === "number" ? value : "";
    if (["typeCase", "status"].includes(columnKey)) {
      const text = String(textValue || "-");
      const tone =
        text === "Positive" || text === "Success"
          ? "bg-emerald-400 text-slate-900"
          : text === "Negative" || text === "Failed"
            ? "bg-rose-500 text-white"
            : text === "Pending"
              ? "bg-amber-300 text-slate-900"
              : "bg-slate-100 text-slate-900";
      return <div className={cn("flex h-full w-full items-start px-3 py-3 font-medium", tone)}>{text}</div>;
    }
    if (columnKey.toLowerCase().includes("date") && textValue) {
      return formatDate(String(textValue));
    }
    if (columnKey === "evidence" && textValue) {
      const url = String(textValue);
      return (
        <a href={url} target="_blank" rel="noreferrer"
          className="break-all text-sky-600 hover:underline text-xs font-medium">
          {url}
        </a>
      );
    }
    if (["preCondition", "caseName", "testStep", "expectedResult", "actualResult"].includes(columnKey)) {
      return (
        <div className="prose prose-xs prose-slate max-w-none prose-p:leading-tight prose-a:font-semibold prose-a:text-sky-700 hover:prose-a:underline break-words min-w-[100px]">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{linkifyToMarkdown(String(textValue || ""))}</ReactMarkdown>
        </div>
      );
    }
    return String(textValue || "-");
  };

  return (
    <div className="max-w-full overflow-x-hidden px-4 py-4 border-t border-slate-200 bg-white">
      {message && (
        <div className={cn("fixed top-24 left-1/2 -translate-x-1/2 z-[150] px-6 py-3 rounded-full border text-sm font-bold shadow-xl animate-in slide-in-from-top-4 duration-300", messageType === "success" ? "border-emerald-200 bg-emerald-500 text-white" : "border-rose-200 bg-rose-500 text-white")}>
          {message}
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Test Cases Database</h3>
          <div className="text-sm font-semibold text-slate-700 mt-1">Total: {rows.length} entries</div>
        </div>
        
        {rows.length > 0 && (
          <button 
            type="button"
            onClick={() => setRunnerOpen(true)}
            className="flex items-center gap-2 rounded-full bg-emerald-600 pl-4 pr-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 hover:shadow"
          >
            <Play size={18} weight="fill" />
            Run Test Cycle
          </button>
        )}
      </div>

      <div className="mt-4 overflow-hidden border border-slate-300 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <form ref={formRef} onSubmit={onCreate}>
            <input type="hidden" name="testSuiteId" value={String(scenario.id ?? "")} />
            
            <table className="min-w-[1500px] w-full table-fixed border-collapse text-sm">
              <colgroup>
                <col style={{ width: "60px" }} />
                <col style={{ width: "170px" }} />
                <col style={{ width: "120px" }} />
                <col style={{ width: "160px" }} />
                <col style={{ width: "220px" }} />
                <col style={{ width: "260px" }} />
                <col style={{ width: "220px" }} />
                <col style={{ width: "170px" }} />
                <col style={{ width: "120px" }} />
                <col style={{ width: "150px" }} />
              </colgroup>
              <thead className="sticky top-0 z-20 bg-slate-100 text-left text-[11px] uppercase tracking-[0.14em] text-slate-700">
                <tr>
                  <th className="border border-slate-300 bg-slate-100 px-3 py-3 w-12 text-center">#</th>
                  {testCaseFields.map((field) => (
                    <th key={field.name} className="border border-slate-300 px-3 py-3">{field.label}</th>
                  ))}
                  <th className="border border-slate-300 px-3 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {/* NEW ENTRY ROW AT THE BOTTOM */}
                <tr className="relative z-10 group border-t-2 border-sky-400 bg-sky-50">
                  <td className="sticky left-0 z-20 border border-slate-300 bg-sky-50 p-2 text-center text-[10px] font-bold text-sky-700 align-middle">
                    NEW
                  </td>
                  {testCaseFields.map((field) => (
                    <td key={field.name} className="border border-slate-300 p-0 align-top bg-white transition-colors hover:bg-sky-50/30">
                      {field.kind === "select" ? (
                        <select
                          name={field.name}
                          required={field.required}
                          value={formValues[field.name] || ""}
                          onChange={(e) => setFormValues((prev) => ({ ...prev, [field.name]: e.target.value }))}
                          onFocus={() => setFocusedInput(field.name)}
                          onBlur={() => setFocusedInput(null)}
                          className={cn(
                            "h-full w-full min-h-[56px] min-w-0 appearance-none cursor-pointer border-0 px-3 text-center text-xs font-bold outline-none transition",
                            formValues[field.name] && focusedInput !== field.name ? selectTone(String(formValues[field.name] || "")) : "bg-white text-slate-900",
                            "focus:ring-1 focus:ring-inset focus:ring-sky-500",
                          )}
                        >
                          <option value="" disabled>
                            {field.label}
                          </option>
                          {field.options?.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        field.kind === "textarea" ? (
                          <AutoGrowTextarea
                            name={field.name}
                            required={field.required}
                            value={String(formValues[field.name] ?? "")}
                            onChange={(e) => setFormValues((prev) => ({ ...prev, [field.name]: e.target.value }))}
                            placeholder={`${field.label}...`}
                            onKeyDown={handleTextareaKeyDown}
                          />
                        ) : (
                          <input
                            ref={field.name === "tcId" ? (firstInputRef as React.RefObject<HTMLInputElement>) : null}
                            type="text"
                            name={field.name}
                            required={field.required}
                            placeholder={`${field.label}...`}
                            className="h-full w-full min-h-[56px] min-w-0 border-0 bg-transparent px-3 text-xs font-medium outline-none focus:ring-0"
                          />
                        )
                      )}
                    </td>
                  ))}
                  <td className="sticky right-0 z-10 border border-slate-300 bg-slate-50 p-2 text-center align-middle">
                    <button
                      type="submit"
                      disabled={pending}
                      className="w-full rounded bg-sky-700 px-4 py-2 text-[11px] uppercase tracking-wider font-bold text-white shadow-sm transition hover:bg-sky-800 disabled:bg-slate-400 whitespace-nowrap"
                    >
                      {pending ? "..." : "Save"}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </form>
        </div>
      </div>

      {runnerOpen && (
        <TestRunner
          scenario={scenario}
          rows={rows}
          onClose={() => setRunnerOpen(false)}
          onComplete={(updatedRows) => {
            startTransition(async () => {
              setMessage("Menyimpan hasil eksekusi uji...");
              setMessageType("info");
              try {
                const res = await fetch("/api/test-cases", {
                  method: "PUT",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ rows: updatedRows }),
                });

                if (!res.ok) throw new Error(await res.text());

                setMessage("Hasil eksekusi Test Case berhasil disimpan secara massal.");
                setMessageType("success");
                setRunnerOpen(false);
                router.refresh();
              } catch (err: any) {
                console.error(err);
                setMessage(err.message || "Gagal menyimpan hasil.");
                setMessageType("error");
              }
            });
          }}
        />
      )}

      <ConfirmModal
        isOpen={deleteId !== null}
        title="Delete Test Case"
        message="Are you sure you want to permanently delete this test case? This action cannot be undone."
        type="danger"
        confirmText="Delete"
        onConfirm={performDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
