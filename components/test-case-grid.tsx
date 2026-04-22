"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/badge";
import { cn, formatDate } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Play } from "@phosphor-icons/react";
import { TestRunner } from "@/components/test-runner";
import { ConfirmModal } from "@/components/ui/confirm-modal";

type Row = Record<string, string | number>;

function linkifyToMarkdown(text: string) {
  if (!text) return "-";
  const regex = /\b((?:TASK|BUG|TC|MTG|LOG)-\d+)\b/g;
  return text.replace(regex, (match) => {
    let href = "/";
    if (match.startsWith("TASK")) href = "/tasks";
    else if (match.startsWith("BUG")) href = "/bugs";
    else if (match.startsWith("TC")) href = "/test-case-management";
    else if (match.startsWith("MTG")) href = "/meeting-notes";
    else if (match.startsWith("LOG")) href = "/daily-logs";
    return `[${match}](${href})`;
  });
}

const testCaseFields = [
  { name: "tcId", label: "TC ID", kind: "text", required: true },
  { name: "typeCase", label: "Type Case", kind: "select", options: [{ label: "Positive", value: "Positive" }, { label: "Negative", value: "Negative" }], required: true },
  { name: "preCondition", label: "Pre-Condition", kind: "textarea", required: false },
  { name: "caseName", label: "Case Name", kind: "textarea", required: true },
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
    setDeleteId(id);
  }

  const performDelete = async () => {
    if (deleteId === null) return;
    const id = deleteId;
    startTransition(async () => {
      setMessage("");
      const response = await fetch(`/api/test-cases?id=${id}`, { method: "DELETE" });
      const result = await response.json();
      if (response.ok) {
        setMessageType("success");
        setMessage(result.message ?? "Item deleted.");
        router.refresh();
      } else {
        setMessageType("error");
        setMessage(result.error ?? "Failed to delete.");
      }
    });
  };

  const renderValue = (columnKey: string, value: string | number) => {
    if (["typeCase", "status"].includes(columnKey)) {
      return <Badge value={String(value)} />;
    }
    if (columnKey.toLowerCase().includes("date") && value) {
      return formatDate(String(value));
    }
    if (columnKey === "evidence" && value) {
      const url = String(value);
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
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{linkifyToMarkdown(String(value || ""))}</ReactMarkdown>
        </div>
      );
    }
    return String(value || "-");
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

      <div className="overflow-hidden rounded-none border border-slate-200 bg-white shadow-sm mt-4">
        <div className="overflow-x-auto">
          <form ref={formRef} onSubmit={onCreate} className="min-w-max">
            <input type="hidden" name="scenarioId" value={scenario.id} />
            
            <table className="min-w-[1400px] border-collapse table-auto text-sm w-full">
              <thead className="bg-[#f4f8fb] text-left text-[11px] uppercase tracking-[0.14em] text-slate-600 sticky top-0 z-20 shadow-sm shadow-[#d9e2ea]">
                <tr>
                  <th className="border border-[#c9d7e3] px-3 py-3 w-12 text-center">#</th>
                  {testCaseFields.map((field) => (
                    <th key={field.name} className="border border-[#c9d7e3] px-3 py-3">{field.label}</th>
                  ))}
                  <th className="border border-[#c9d7e3] px-3 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {/* EXISTING ROWS */}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={testCaseFields.length + 2} className="px-4 py-12 text-center text-sm font-medium text-slate-500 bg-slate-50/50">
                      No test cases added to this scenario yet.
                    </td>
                  </tr>
                )}
                
                {rows.map((row, index) => (
                  <tr
                    key={row.id}
                    className="align-top transition duration-150 hover:bg-slate-50 bg-white"
                  >
                    <td className="border border-[#d9e2ea] px-3 py-3 text-center align-middle text-slate-400 font-medium">
                      {index + 1}
                    </td>
                    {testCaseFields.map((field) => (
                      <td key={field.name} className="max-w-[180px] border border-[#d9e2ea] px-2 py-2 text-[11px] text-slate-700 leading-normal">
                        {renderValue(field.name, row[field.name])}
                      </td>
                    ))}
                    <td className="border border-[#d9e2ea] px-3 py-3 text-center align-middle">
                      <button
                        type="button"
                        onClick={() => onDelete(Number(row.id))}
                        className="rounded border border-rose-200 px-3 py-1 text-xs font-bold text-rose-600 shadow-sm transition hover:bg-rose-50 hover:border-rose-300"
                      >
                        Del
                      </button>
                    </td>
                  </tr>
                ))}

                {/* NEW ENTRY ROW AT THE BOTTOM */}
                <tr className="bg-sky-50 shadow-[inset_0_0_0_1px_#0284c7] z-10 relative group border-t-2 border-sky-400">
                  <td className="border border-[#c9d7e3] p-2 text-center text-[10px] font-bold text-sky-700 align-middle">
                    NEW
                  </td>
                  {testCaseFields.map((field) => (
                    <td key={field.name} className="border border-[#c9d7e3] p-0 align-top max-w-[180px] bg-white hover:bg-sky-50/30 transition-colors">
                      {field.kind === "textarea" ? (
                        <textarea
                          name={field.name}
                          required={field.required}
                          onFocus={() => setFocusedInput(field.name)}
                          onBlur={() => setFocusedInput(null)}
                          placeholder={`${field.label}...`}
                          className={cn(
                            "w-full resize-none border-none bg-transparent p-2.5 text-xs outline-none focus:ring-1 focus:ring-inset focus:ring-sky-500 transition-all duration-200",
                            focusedInput === field.name ? "h-[120px] bg-sky-50 shadow-inner z-50 relative" : "h-[45px]"
                          )}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              if (formRef.current?.checkValidity()) {
                                formRef.current.requestSubmit();
                              } else {
                                formRef.current?.reportValidity();
                              }
                            }
                          }}
                        />
                      ) : field.kind === "select" ? (
                        <div className="h-[45px] w-full flex items-center justify-center p-0 relative bg-white hover:bg-sky-50 transition-colors">
                          {/* Visual Pill - Matches Badge component exactly */}
                          <div className={cn(
                            "pointer-events-none absolute z-0 inline-flex min-w-[100px] justify-center rounded-full px-4 py-1 transition-all text-[10px] font-bold uppercase tracking-widest shadow-sm border border-black/5",
                            field.name === "typeCase" && formValues.typeCase === "" && "bg-slate-100 text-slate-400 border-slate-200 shadow-none",
                            field.name === "typeCase" && formValues.typeCase === "Positive" && "bg-sky-500 text-white",
                            field.name === "typeCase" && formValues.typeCase === "Negative" && "bg-orange-600 text-white",
                            field.name === "status" && formValues.status === "" && "bg-slate-100 text-slate-400 border-slate-200 shadow-none",
                            field.name === "status" && formValues.status === "Success" && "bg-emerald-500 text-white",
                            field.name === "status" && formValues.status === "Failed" && "bg-rose-500 text-white",
                            field.name === "status" && formValues.status === "Pending" && "bg-amber-400 text-amber-950"
                          )}>
                            {formValues[field.name] || "SELECT"}
                          </div>
                          
                          {/* Invisible but full-width SELECT for native interaction and wide dropdown */}
                          <select
                            name={field.name}
                            required={field.required}
                            value={formValues[field.name] || ""}
                            onChange={(e) => setFormValues(prev => ({ ...prev, [field.name]: e.target.value }))}
                            className="absolute inset-0 z-10 w-full h-full cursor-pointer opacity-0 text-base"
                          >
                            <option value="" disabled>SELECT</option>
                            {field.options?.map((opt) => (
                              <option key={opt.value} value={opt.value} className="bg-white text-slate-900 normal-case">{opt.label}</option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <input
                          ref={field.name === "tcId" ? (firstInputRef as React.RefObject<HTMLInputElement>) : null}
                          type={field.kind}
                          name={field.name}
                          required={field.required}
                          placeholder={`${field.label}...`}
                          className="h-[45px] w-full border-none bg-transparent p-2.5 text-xs outline-none focus:bg-sky-50 focus:ring-1 focus:ring-inset focus:ring-sky-500 rounded-none font-medium"
                        />
                      )}
                    </td>
                  ))}
                  <td className="border border-[#c9d7e3] p-2 align-middle bg-[#f4f8fb]/30 text-center">
                    <button
                      type="submit"
                      disabled={pending}
                      className="rounded bg-sky-700 px-4 py-2 text-[11px] uppercase tracking-wider font-bold text-white shadow-sm transition hover:bg-sky-800 disabled:bg-slate-400 w-full whitespace-nowrap"
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
