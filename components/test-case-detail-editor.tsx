"use client";

import type { KeyboardEvent, ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { FloppyDisk, CaretDown, Trash, Bug, PlayCircle } from "@phosphor-icons/react";
import { toast } from "@/components/ui/toast";
import { BadgeCell, COLS, CustomSelect, EditTextCell, ReadCell, TOTAL_WIDTH, Th, colMap, fieldOrder, priorityOptions, statusOptions, typeOptions } from "@/components/test-case-detail-helpers";
import type { TestCaseRow } from "@/components/test-case-detail-helpers";
export type { TestCaseRow } from "@/components/test-case-detail-helpers";
// ─── main component ────────────────────────────────────────────────────────────
export function TestCaseDetailEditor({
  suiteId,
  suiteTitle,
  initialCases,
}: {
  suiteId: string;
  suiteTitle: string;
  initialCases: TestCaseRow[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<TestCaseRow | null>(null);

  const [form, setForm] = useState<TestCaseRow>({
    testSuiteId: suiteId,
    tcId: suggestNextId(initialCases),
    caseName: "",
    typeCase: "",
    preCondition: "",
    testStep: "",
    expectedResult: "",
    actualResult: "",
    status: "",
    priority: "",
    evidence: "",
  });

  // Load draft from localStorage on mount
  useEffect(() => {
    const draft = localStorage.getItem(`qa-draft-suite-${suiteId}`);
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        setForm((s: TestCaseRow) => ({ ...s, ...parsed }));
        toast("Restored draft from last session", "info");
      } catch (e) {
        console.error("Failed to parse draft", e);
      }
    }
  }, [suiteId]);

  // Save draft to localStorage whenever form changes
  useEffect(() => {
    // Only save if there's actual content
    if (form.caseName || form.testStep || form.expectedResult) {
      const { testSuiteId, ...rest } = form;
      localStorage.setItem(`qa-draft-suite-${suiteId}`, JSON.stringify(rest));
    }
  }, [form, suiteId]);

  // Clear draft on successful save
  function clearDraft() {
    localStorage.removeItem(`qa-draft-suite-${suiteId}`);
  }

  function suggestNextId(rows: TestCaseRow[]) {
    if (rows.length === 0) return "TC-001";
    try {
      const last = rows[rows.length - 1].tcId;
      const match = last.match(/(\d+)$/);
      if (match) {
        const num = parseInt(match[0] ?? "0", 10) + 1;
        const prefix = last.replace(/\d+$/, "");
        return prefix + String(num).padStart(match[0].length, "0");
      }
    } catch {}
    return `TC-${String(rows.length + 1).padStart(3, "0")}`;
  }

  const canSaveNew = useMemo(
    () =>
      Boolean(
        form.tcId &&
          form.caseName &&
          form.expectedResult &&
          form.status &&
          form.priority,
      ),
    [form],
  );

  const canSaveEdit = useMemo(
    () =>
      Boolean(
        editForm?.tcId &&
          editForm?.caseName &&
          editForm?.expectedResult &&
          editForm?.status &&
          editForm?.priority,
      ),
    [editForm],
  );

  const refs = useRef<
    Partial<Record<string, HTMLInputElement | HTMLTextAreaElement | HTMLButtonElement>>
  >({});

  function setNew<K extends keyof TestCaseRow>(k: K, v: TestCaseRow[K]) {
    setForm((s) => ({ ...s, [k]: v }));
  }

  function setEdit<K extends keyof TestCaseRow>(k: K, v: TestCaseRow[K]) {
    if (!editForm) return;
    setEditForm((s: TestCaseRow | null) => (s ? { ...s, [k]: v } : null));
  }

  function startEdit(row: TestCaseRow, focusField?: string) {
    setEditingId(row.id ?? null);
    setEditForm({ ...row });
    if (focusField) {
      setTimeout(() => {
        refs.current[focusField]?.focus();
      }, 50);
    }
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm(null);
  }

  async function saveUpdate() {
    if (!editForm || !editingId || pending || !canSaveEdit) return;
    startTransition(async () => {
      try {
        const entry = { ...editForm };
        const id = editingId;
        delete entry.id;
        
        const res = await fetch("/api/items/test-cases", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, entry }),
        });
        const resData = await res.json();
        if (res.ok) {
          toast("Update successful", "success");
          cancelEdit();
          router.refresh();
        } else {
          toast(resData.error || "Update failed", "error");
        }
      } catch (err) {
        toast("An error occurred", "error");
      }
    });
  }

  async function saveNew() {
    if (!canSaveNew || pending) return;
    startTransition(async () => {
      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => data.append(k, String(v ?? "")));
      try {
        const res = await fetch("/api/items/test-cases", { method: "POST", body: data });
        const resData = await res.json();
        if (res.ok) {
          toast("Case added", "success");
          setForm({
            testSuiteId: suiteId,
            tcId: suggestNextId([...initialCases, { ...form, id: resData.id }]), // Simple suggestion
            caseName: "",
            typeCase: form.typeCase, // Keep type for convenience
            preCondition: form.preCondition, // Keep pre-condition for convenience
            testStep: "",
            expectedResult: "",
            actualResult: "",
            status: "",
            priority: "",
            evidence: "",
          });
          clearDraft();
          router.refresh();
        } else {
          toast(resData.error || "Failed to add", "error");
        }
      } catch (err) {
        toast("Error occurred", "error");
      }
    });
  }

  async function deleteCase(id: number | string) {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/test-cases?id=${id}`, { method: "DELETE" });
        if (res.ok) {
          toast("Deleted successfully", "success");
          router.refresh();
        } else {
          toast("Failed to delete", "error");
        }
      } catch (err) {
        toast("Error occurred", "error");
      }
    });
  }
  // stats
  const passed  = initialCases.filter((r) => r.status === "Passed" || r.status === "Success").length;
  const failed  = initialCases.filter((r) => r.status === "Failed").length;
  const blocked = initialCases.filter((r) => r.status === "Blocked").length;
  const pending_ = initialCases.filter((r) => r.status === "Pending").length;

  const positive = initialCases.filter((r) => r.typeCase === "Positive").length;
  const negative = initialCases.filter((r) => r.typeCase === "Negative").length;

  const critical = initialCases.filter((r) => r.priority === "Critical").length;
  const high     = initialCases.filter((r) => r.priority === "High").length;
  const medium   = initialCases.filter((r) => r.priority === "Medium").length;
  const low      = initialCases.filter((r) => r.priority === "Low").length;

  return (
    <div className="flex flex-col gap-6">
      {/* Metrics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-4 space-y-3">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 dark:border-white/5 pb-2">
            Execution Status
          </div>
          <div className="flex gap-6">
            <div>
              <div className="text-xl font-black text-emerald-500">{passed}</div>
              <div className="text-[10px] font-bold uppercase text-slate-400">PASSED</div>
            </div>
            <div>
              <div className="text-xl font-black text-rose-500">{failed}</div>
              <div className="text-[10px] font-bold uppercase text-slate-400">FAILED</div>
            </div>
            <div>
              <div className="text-xl font-black text-amber-500">{blocked}</div>
              <div className="text-[10px] font-bold uppercase text-slate-400">BLOCKED</div>
            </div>
            <div>
              <div className="text-xl font-black text-amber-400">{pending_}</div>
              <div className="text-[10px] font-bold uppercase text-slate-400">PENDING</div>
            </div>
          </div>
        </div>

        <div className="glass-card p-4 space-y-3">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 dark:border-white/5 pb-2">
            Case Types
          </div>
          <div className="flex gap-8">
            <div>
              <div className="text-xl font-black text-emerald-500">{positive}</div>
              <div className="text-[10px] font-bold uppercase text-slate-400">POSITIVE</div>
            </div>
            <div>
              <div className="text-xl font-black text-rose-500">{negative}</div>
              <div className="text-[10px] font-bold uppercase text-slate-400">NEGATIVE</div>
            </div>
          </div>
        </div>

        <div className="glass-card p-4 space-y-3">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 dark:border-white/5 pb-2">
            Priority Distribution
          </div>
          <div className="flex gap-5">
            <div>
              <div className="text-xl font-black text-red-700">{critical}</div>
              <div className="text-[10px] font-bold uppercase text-slate-400">CRIT</div>
            </div>
            <div>
              <div className="text-xl font-black text-rose-500">{high}</div>
              <div className="text-[10px] font-bold uppercase text-slate-400">HIGH</div>
            </div>
            <div>
              <div className="text-xl font-black text-sky-500">{medium}</div>
              <div className="text-[10px] font-bold uppercase text-slate-400">MED</div>
            </div>
            <div>
              <div className="text-xl font-black text-slate-400">{low}</div>
              <div className="text-[10px] font-bold uppercase text-slate-400">LOW</div>
            </div>
          </div>
        </div>
      </div>

      {/* spreadsheet */}
      <div className="overflow-auto rounded-md border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <table
          className="border-collapse"
          style={{ width: TOTAL_WIDTH, tableLayout: "fixed" }}
        >
          <colgroup>
            {COLS.map((c) => (
              <col key={c.key} style={{ width: c.width }} />
            ))}
          </colgroup>

          {/* ── HEADER ── */}
          <thead className="sticky top-0 z-20">
            <tr>
              <Th w={colMap.__row__} className="text-center bg-slate-200 dark:bg-slate-700" />
              <Th w={colMap.tcId}>TC ID</Th>
              <Th w={colMap.caseName}>Case Name</Th>
              <Th w={colMap.typeCase} className="text-center">Type Case</Th>
              <Th w={colMap.preCondition}>Pre-Condition</Th>
              <Th w={colMap.testStep}>Test Step</Th>
              <Th w={colMap.expectedResult}>Expected Result</Th>
              <Th w={colMap.actualResult}>Actual Result</Th>
              <Th w={colMap.status} className="text-center">Status</Th>
              <Th w={colMap.priority} className="text-center">Priority</Th>
              <Th w={colMap.evidence} className="text-center">Evidence</Th>
              <Th w={colMap.__action__} className="text-center bg-slate-200 dark:bg-slate-700">
                Action
              </Th>
            </tr>
          </thead>

          <tbody>
            {/* ── EXISTING ROWS ── */}
            {initialCases.map((row, index) => (
              <tr
                key={row.id ?? index}
                onClick={() => {
                  if (editingId !== row.id) startEdit(row);
                }}
                className={cn(
                  "align-top cursor-pointer group transition-colors",
                  index % 2 === 0
                    ? "bg-white hover:bg-sky-50/50 dark:bg-slate-900 dark:hover:bg-sky-900/10"
                    : "bg-slate-50/70 hover:bg-sky-50/80 dark:bg-slate-800/50 dark:hover:bg-sky-900/20",
                )}
              >
                {/* row number */}
                <td
                  style={{ width: colMap.__row__, minWidth: colMap.__row__ }}
                  className="border border-slate-200 bg-slate-100 px-1 py-[4px] text-center text-[11px] font-semibold text-slate-400 select-none dark:bg-slate-700 dark:border-slate-600 dark:text-slate-500"
                >
                  {index + 1}
                </td>

                {editingId === row.id && editForm ? (
                  <>
                    <EditTextCell value={editForm.tcId} w={colMap.tcId} onChange={(v) => setEdit("tcId", v)} setRef={(el) => { if (el) refs.current.tcId = el; }} />
                    <EditTextCell value={editForm.caseName} w={colMap.caseName} multiline onChange={(v) => setEdit("caseName", v)} setRef={(el) => { if (el) refs.current.caseName = el; }} />
                    <CustomSelect value={editForm.typeCase} w={colMap.typeCase} fieldKey="typeCase" options={typeOptions} onChange={(v) => setEdit("typeCase", v)} setRef={(el) => { if (el) refs.current.typeCase = el; }} autoFocusOpen />
                    <EditTextCell value={editForm.preCondition} w={colMap.preCondition} multiline onChange={(v) => setEdit("preCondition", v)} setRef={(el) => { if (el) refs.current.preCondition = el; }} />
                    <EditTextCell value={editForm.testStep} w={colMap.testStep} multiline onChange={(v) => setEdit("testStep", v)} setRef={(el) => { if (el) refs.current.testStep = el; }} />
                    <EditTextCell value={editForm.expectedResult} w={colMap.expectedResult} multiline onChange={(v) => setEdit("expectedResult", v)} setRef={(el) => { if (el) refs.current.expectedResult = el; }} />
                    <EditTextCell value={editForm.actualResult ?? ""} w={colMap.actualResult} multiline onChange={(v) => setEdit("actualResult", v)} setRef={(el) => { if (el) refs.current.actualResult = el; }} />
                    <CustomSelect value={editForm.status} w={colMap.status} fieldKey="status" options={statusOptions} onChange={(v) => setEdit("status", v)} setRef={(el) => { if (el) refs.current.status = el; }} />
                    <CustomSelect value={editForm.priority} w={colMap.priority} fieldKey="priority" options={priorityOptions} placeholder="PRIORITY" onChange={(v) => setEdit("priority", v)} setRef={(el) => { if (el) refs.current.priority = el; }} />
                    <EditTextCell value={editForm.evidence ?? ""} w={colMap.evidence} onChange={(v) => setEdit("evidence", v)} setRef={(el) => { if (el) refs.current.evidence = el; }} />

                    <td className="border border-slate-200 bg-emerald-50 px-1 py-1 text-center align-middle dark:bg-emerald-950/20">
                      <div className="flex flex-col gap-1 px-1">
                        <button
                          type="button"
                          onClick={saveUpdate}
                          disabled={pending || !canSaveEdit}
                          className="flex h-7 items-center justify-center rounded bg-emerald-600 text-[10px] font-bold text-white transition hover:bg-emerald-700"
                        >
                          SAVE
                        </button>
                        <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => editingId !== null && deleteCase(editingId)}
                          className="flex h-7 flex-1 items-center justify-center rounded bg-rose-50 px-1 text-rose-600 transition hover:bg-rose-100"
                          title="Delete"
                        >
                            <Trash size={12} weight="bold" />
                          </button>
                          {editForm.status === "Failed" && (
                            <Link
                              href={`/bugs?action=new&title=${encodeURIComponent(`[Failed] ${editForm.caseName}`)}&preconditions=${encodeURIComponent(editForm.preCondition)}&stepsToReproduce=${encodeURIComponent(editForm.testStep)}&expectedResult=${encodeURIComponent(editForm.expectedResult)}&actualResult=${encodeURIComponent(editForm.actualResult || "")}`}
                              className="flex h-7 flex-1 items-center justify-center rounded bg-amber-50 px-1 text-amber-600 transition hover:bg-amber-100"
                              title="Report Bug"
                            >
                              <Bug size={14} weight="bold" />
                            </Link>
                          )}
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="flex h-7 flex-1 items-center justify-center rounded bg-slate-200 text-[10px] font-bold text-slate-600 transition hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-400"
                          >
                            X
                          </button>
                        </div>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <ReadCell value={String(row.tcId ?? "")}           w={colMap.tcId} onClick={() => startEdit(row, "tcId")} />
                    <ReadCell value={String(row.caseName ?? "")}       w={colMap.caseName} onClick={() => startEdit(row, "caseName")} />
                    <BadgeCell value={String(row.typeCase ?? "")}      w={colMap.typeCase} fieldKey="typeCase" onClick={() => startEdit(row, "typeCase")} />
                    <ReadCell value={String(row.preCondition ?? "")}   w={colMap.preCondition} onClick={() => startEdit(row, "preCondition")} />
                    <ReadCell value={String(row.testStep ?? "")}       w={colMap.testStep} onClick={() => startEdit(row, "testStep")} />
                    <ReadCell value={String(row.expectedResult ?? "")} w={colMap.expectedResult} onClick={() => startEdit(row, "expectedResult")} />
                    <ReadCell value={String(row.actualResult ?? "")}   w={colMap.actualResult} onClick={() => startEdit(row, "actualResult")} />
                    <BadgeCell value={String(row.status ?? "")}        w={colMap.status} fieldKey="status" onClick={() => startEdit(row, "status")} />
                    <BadgeCell value={String(row.priority ?? "Medium")} w={colMap.priority} fieldKey="priority" onClick={() => startEdit(row, "priority")} />
                    <ReadCell value={String(row.evidence ?? "")}       w={colMap.evidence} onClick={() => startEdit(row, "evidence")} />

                    <td
                      style={{ width: colMap.__action__, minWidth: colMap.__action__ }}
                      className="border border-slate-200 bg-slate-50 px-1 py-[4px] text-center align-middle dark:bg-slate-800 dark:border-slate-600"
                    >
                      <div className="flex flex-col gap-1 px-1">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); startEdit(row); }}
                          className="flex h-7 items-center justify-center rounded border border-slate-200 bg-white text-[10px] font-bold uppercase tracking-wider text-slate-600 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteCase(row.id!)}
                          className="flex h-7 items-center justify-center rounded bg-rose-50 text-rose-600 transition hover:bg-rose-100"
                          title="Delete"
                        >
                          <Trash size={12} weight="bold" />
                        </button>
                        {(row.status === "Failed" || row.status === "FAILURE" || String(row.status).toUpperCase() === "FAILED") && (
                          <Link
                            href={`/bugs?action=new&title=${encodeURIComponent(`[Failed] ${row.caseName}`)}&preconditions=${encodeURIComponent(row.preCondition)}&stepsToReproduce=${encodeURIComponent(row.testStep)}&expectedResult=${encodeURIComponent(row.expectedResult)}&actualResult=${encodeURIComponent(row.actualResult || "")}`}
                            className="flex h-7 items-center justify-center rounded bg-amber-50 text-amber-600 transition hover:bg-amber-100"
                            title="Report Bug"
                          >
                            <Bug size={14} weight="bold" />
                          </Link>
                        )}
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}

            {/* ── NEW ROW / EDIT ROW ── */}
            <tr className={cn("align-top", form.id ? "bg-amber-50/40 dark:bg-amber-950/20" : "bg-sky-50/40 dark:bg-sky-950/20")}>
              {/* row indicator */}
              <td
                style={{ width: colMap.__row__, minWidth: colMap.__row__ }}
                className={cn(
                  "border border-slate-200 px-1 py-[4px] text-center text-[10px] font-black uppercase tracking-widest dark:border-slate-600",
                  form.id
                    ? "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400"
                    : "bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-400"
                )}
              >
                {form.id ? "EDIT" : "NEW"}
              </td>

              <EditTextCell
                value={form.tcId}
                w={colMap.tcId}
                placeholder="tc-001"
                onChange={(v) => setNew("tcId", v)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); refs.current.caseName?.focus(); } }}
                setRef={(el) => { if (el) refs.current.tcId = el; }}
              />
              <EditTextCell
                value={form.caseName}
                w={colMap.caseName}
                placeholder="Login name"
                multiline
                onChange={(v) => setNew("caseName", v)}
                setRef={(el) => { if (el) refs.current.caseName = el; }}
              />

              <CustomSelect
                value={form.typeCase}
                w={colMap.typeCase}
                fieldKey="typeCase"
                options={typeOptions}
                placeholder="Type"
                onChange={(v) => setNew("typeCase", v)}
                setRef={(el) => { if (el) refs.current.typeCase_new = el; }}
                autoFocusOpen
              />

              <EditTextCell
                value={form.preCondition}
                w={colMap.preCondition}
                multiline
                onChange={(v) => setNew("preCondition", v)}
                setRef={(el) => { if (el) refs.current.preCondition_new = el; }}
              />
              <EditTextCell
                value={form.testStep}
                w={colMap.testStep}
                multiline
                onChange={(v) => setNew("testStep", v)}
                setRef={(el) => { if (el) refs.current.testStep_new = el; }}
              />
              <EditTextCell
                value={form.expectedResult}
                w={colMap.expectedResult}
                multiline
                onChange={(v) => setNew("expectedResult", v)}
                setRef={(el) => { if (el) refs.current.expectedResult_new = el; }}
              />
              <EditTextCell
                value={form.actualResult ?? ""}
                w={colMap.actualResult}
                multiline
                onChange={(v) => setNew("actualResult", v)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    saveNew();
                  }
                }}
                setRef={(el) => { if (el) refs.current.actualResult_new = el; }}
              />

              <CustomSelect
                value={form.status}
                w={colMap.status}
                fieldKey="status"
                options={statusOptions}
                placeholder="Status"
                onChange={(v) => setNew("status", v)}
                setRef={(el) => { if (el) refs.current.status_new = el; }}
              />

              <CustomSelect
                value={form.priority}
                w={colMap.priority}
                fieldKey="priority"
                options={priorityOptions}
                placeholder="PRIORITY"
                onChange={(v) => setNew("priority", v)}
                setRef={(el) => { if (el) refs.current.priority_new = el; }}
                autoFocusOpen
              />

              <EditTextCell
                value={form.evidence}
                w={colMap.evidence}
                placeholder="Ex: Image URL"
                onChange={(v) => setNew("evidence", v)}
                setRef={(el) => { if (el) refs.current.evidence_new = el; }}
              />

              <td
                style={{ width: colMap.__action__, minWidth: colMap.__action__ }}
                className="border border-slate-200 bg-sky-50/40 px-1 py-[4px] text-center align-middle dark:bg-sky-950/20 dark:border-slate-600"
              >
                <button
                  type="button"
                  onClick={saveNew}
                  disabled={pending || !canSaveNew}
                  className={cn(
                    "inline-flex w-full items-center justify-center gap-1 rounded bg-sky-600 px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-white transition active:scale-95 disabled:opacity-50",
                  )}
                >
                  <FloppyDisk size={13} weight="bold" />
                  SAVE
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* footer stats */}
      <div className="flex flex-wrap items-center gap-3 px-1 text-[11px] text-slate-500">
        <span className="font-semibold text-slate-600 dark:text-slate-400">
          Total: {initialCases.length} test case{initialCases.length !== 1 ? "s" : ""}
        </span>
        <span className="text-slate-300 dark:text-slate-600">|</span>
        {passed  > 0 && <span className="font-semibold text-emerald-600">{passed} Passed</span>}
        {failed  > 0 && <span className="font-semibold text-rose-500">{failed} Failed</span>}
        {pending_ > 0 && <span className="font-semibold text-amber-500">{pending_} Pending</span>}
        {blocked > 0 && <span className="font-semibold text-amber-600">{blocked} Blocked</span>}
        {passed === 0 && failed === 0 && pending_ === 0 && blocked === 0 && (
          <span className="text-slate-400">No test results yet</span>
        )}
      </div>
    </div>
  );
}

