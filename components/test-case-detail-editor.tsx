"use client";

import type { KeyboardEvent, ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { FloppyDisk, CaretDown, Trash, Bug, PlayCircle } from "@phosphor-icons/react";
import { toast } from "@/components/ui/toast";

// ─── types ─────────────────────────────────────────────────────────────────────
export type TestCaseRow = {
  id?: number;
  testSuiteId: string;
  tcId: string;
  caseName: string;
  typeCase: string;
  preCondition: string;
  testStep: string;
  expectedResult: string;
  actualResult?: string;
  status: string;
  evidence: string;
  priority: string;
};

type FieldKey =
  | "tcId"
  | "caseName"
  | "typeCase"
  | "preCondition"
  | "testStep"
  | "expectedResult"
  | "actualResult"
  | "status"
  | "priority"
  | "evidence";

const fieldOrder: FieldKey[] = [
  "tcId",
  "caseName",
  "typeCase",
  "preCondition",
  "testStep",
  "expectedResult",
  "actualResult",
  "status",
  "priority",
  "evidence",
];

const typeOptions = ["Positive", "Negative"] as const;
const statusOptions = ["Pending", "Passed", "Failed", "Blocked"] as const;
const priorityOptions = ["Critical", "High", "Medium", "Low"] as const;

// ─── color maps — uses Tailwind classes matching badge.tsx + globals.css ────────
const typeCellClass: Record<string, string> = {
  Positive: "bg-emerald-500 text-white",
  Negative: "bg-rose-500 text-white",
};
const statusCellClass: Record<string, string> = {
  Pending: "bg-amber-400 text-amber-950",
  Passed:  "bg-emerald-500 text-white",
  PASSED:  "bg-emerald-500 text-white",
  Success: "bg-emerald-500 text-white",
  SUCCESS: "bg-emerald-500 text-white",
  Failed:  "bg-rose-500 text-white",
  FAILED:  "bg-rose-500 text-white",
  Failure: "bg-rose-500 text-white",
  FAILURE: "bg-rose-500 text-white",
  Blocked: "bg-amber-500 text-white",
};

const priorityCellClass: Record<string, string> = {
  Critical: "bg-red-700 text-white",
  High:     "bg-rose-500 text-white",
  Medium:   "bg-sky-500 text-white",
  Low:      "bg-slate-400 text-white",
};

function badgeClass(fieldKey: string, value: string) {
  if (fieldKey === "typeCase") return typeCellClass[value] ?? "";
  if (fieldKey === "status") {
    return statusCellClass[value] || statusCellClass[value.toUpperCase()] || statusCellClass[value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()] || "";
  }
  if (fieldKey === "priority") return priorityCellClass[value] ?? "";
  return "";
}

// ─── column definitions ────────────────────────────────────────────────────────
const COLS = [
  { key: "__row__",        label: "",                 width: 44  },
  { key: "tcId",           label: "TC ID",            width: 100 },
  { key: "caseName",       label: "Case Name",        width: 220 },
  { key: "typeCase",       label: "Type Case",        width: 120 },
  { key: "preCondition",   label: "Pre-Condition",    width: 200 },
  { key: "testStep",       label: "Test Step",        width: 240 },
  { key: "expectedResult", label: "Expected Result",  width: 220 },
  { key: "actualResult",   label: "Actual Result",    width: 200 },
  { key: "status",         label: "Status",           width: 120 },
  { key: "priority",       label: "Priority",         width: 120 },
  { key: "evidence",       label: "Evidence",         width: 180 },
  { key: "__action__",     label: "Action",           width: 100 },
] as const;

const TOTAL_WIDTH = COLS.reduce((s, c) => s + c.width, 0);
const colMap = Object.fromEntries(COLS.map((c) => [c.key, c.width])) as Record<string, number>;

// ─── TH ────────────────────────────────────────────────────────────────────────
function Th({ children, w, className }: { children?: ReactNode; w: number; className?: string }) {
  return (
    <th
      style={{ width: w, minWidth: w, maxWidth: w }}
      className={cn(
        "border border-slate-300 bg-slate-100 px-2 py-[5px] text-left text-[11px] font-bold uppercase tracking-wide text-slate-600 select-none dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300",
        className,
      )}
    >
      {children}
    </th>
  );
}

// ─── read-only text cell ───────────────────────────────────────────────────────
function ReadCell({ value, w, onClick }: { value: string; w: number; onClick?: () => void }) {
  return (
    <td
      style={{ width: w, minWidth: w, maxWidth: w }}
      onClick={onClick}
      className={cn(
        "border border-slate-200 px-[6px] py-[4px] align-top text-[12px] leading-[1.4] transition-colors dark:border-slate-600",
        onClick ? "cursor-text hover:bg-white/50" : "text-slate-700 dark:text-slate-300"
      )}
    >
      <div className="whitespace-pre-wrap break-words min-h-[22px]">
        {value || <span className="text-slate-300 dark:text-slate-600">—</span>}
      </div>
    </td>
  );
}

// ─── read-only badge cell (Type Case / Status in existing rows) ────────────────
function BadgeCell({ value, w, fieldKey, onClick }: { value: string; w: number; fieldKey: string; onClick?: () => void }) {
  const tone = badgeClass(fieldKey, value);
  return (
    <td
      style={{ width: w, minWidth: w, maxWidth: w }}
      onClick={onClick}
      className={cn(
        "border border-slate-200 px-[6px] py-[4px] align-top text-center text-[11px] font-bold uppercase tracking-wide transition-colors dark:border-slate-600",
        onClick && "cursor-pointer hover:opacity-80",
        tone || "text-slate-400 dark:text-slate-500",
      )}
    >
      <div className="min-h-[22px] flex items-center justify-center">
        {value || "—"}
      </div>
    </td>
  );
}

// ─── editable plain text / textarea cell ──────────────────────────────────────
function EditTextCell({
  value,
  w,
  placeholder,
  multiline,
  onChange,
  onKeyDown,
  setRef,
}: {
  value: string;
  w: number;
  placeholder?: string;
  multiline?: boolean;
  onChange: (v: string) => void;
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  setRef?: (el: HTMLInputElement | HTMLTextAreaElement | null) => void;
}) {
  const sharedClass =
    "block w-full border-0 bg-transparent px-[6px] py-[4px] text-[12px] leading-[1.4] text-slate-800 outline-none focus:ring-0 placeholder:text-slate-300 dark:text-slate-200 dark:placeholder:text-slate-600";

  const innerRef = useRef<HTMLTextAreaElement | HTMLInputElement | null>(null);

  useEffect(() => {
    if (multiline && innerRef.current) {
      const t = innerRef.current as HTMLTextAreaElement;
      t.style.height = "0px";
      t.style.height = `${t.scrollHeight}px`;
    }
  }, [value, multiline]);

  return (
    <td
      style={{ width: w, minWidth: w, maxWidth: w }}
      onClick={() => innerRef.current?.focus()}
      className="border border-slate-200 p-0 align-top bg-white focus-within:ring-2 focus-within:ring-inset focus-within:ring-sky-400 dark:bg-slate-800 dark:border-slate-600"
    >
      {multiline ? (
        <textarea
          ref={(el) => {
            innerRef.current = el;
            if (setRef) setRef(el);
          }}
          value={value}
          placeholder={placeholder}
          rows={1}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown as (e: KeyboardEvent<HTMLTextAreaElement>) => void}
          className={cn(sharedClass, "resize-none overflow-hidden min-h-[28px]")}
        />
      ) : (
        <input
          ref={(el) => {
            innerRef.current = el;
            if (setRef) setRef(el);
          }}
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown as (e: KeyboardEvent<HTMLInputElement>) => void}
          className={cn(sharedClass, "h-[28px]")}
        />
      )}
    </td>
  );
}

// ─── CUSTOM DROPDOWN — fixed position to escape overflow:auto clipping ─────────
function CustomSelect({
  value,
  w,
  fieldKey,
  options,
  placeholder,
  onChange,
  onTabKey,
  setRef,
  autoFocusOpen,
}: {
  value: string;
  w: number;
  fieldKey: string;
  options: readonly string[];
  placeholder?: string;
  onChange: (v: string) => void;
  onTabKey?: () => void;
  setRef?: (el: HTMLButtonElement | null) => void;
  autoFocusOpen?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const tone = badgeClass(fieldKey, value);

  function openDropdown() {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setRect({ top: r.bottom, left: r.left, width: Math.max(r.width, 140) });
    }
    setOpen(true);
  }

  // close on outside click or scroll
  useEffect(() => {
    if (!open) return;
    function close(e: MouseEvent) {
      if (
        listRef.current && !listRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    function onScroll() { setOpen(false); }
    document.addEventListener("mousedown", close);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", close);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  function handleKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open ? setOpen(false) : openDropdown(); }
    if (e.key === "Escape") setOpen(false);
    if (e.key === "Tab") { setOpen(false); onTabKey?.(); }
  }

  return (
    <td
      style={{ width: w, minWidth: w, maxWidth: w }}
      onClick={() => {
        if (!open) openDropdown();
        btnRef.current?.focus();
      }}
      className="border border-slate-200 p-0 align-top cursor-pointer dark:border-slate-600"
    >
      {/* trigger */}
      <button
        ref={(el) => {
          btnRef.current = el;
          setRef?.(el);
        }}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          open ? setOpen(false) : openDropdown();
        }}
        onFocus={() => {
          if (autoFocusOpen && !open) openDropdown();
        }}
        onKeyDown={handleKeyDown}
        className={cn(
          "flex min-h-[28px] h-full w-full items-center justify-between gap-1 px-[6px] text-[11px] font-bold uppercase tracking-wide focus:outline-none focus:ring-2 focus:ring-inset focus:ring-sky-400",
          tone
            ? cn(tone, "rounded-none")
            : "text-slate-400 bg-white dark:bg-slate-800 dark:text-slate-500",
        )}
      >
        <span>{value || placeholder || "Select"}</span>
        <CaretDown size={10} weight="bold" className="shrink-0 opacity-70" />
      </button>

      {/* dropdown list — fixed position, escapes overflow:auto clipping */}
      {open && rect && (
        <ul
          ref={listRef}
          style={{ position: "fixed", top: rect.top, left: rect.left, minWidth: rect.width, zIndex: 9999 }}
          className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-xl dark:border-slate-600 dark:bg-slate-800"
        >
          {options.map((opt) => {
              const optTone = badgeClass(fieldKey, opt);
              return (
                <li key={opt}>
                  <button
                    type="button"
                    className={cn(
                      "flex w-full items-center gap-2 px-3 py-[5px] text-left text-[11px] font-bold uppercase tracking-wide hover:bg-slate-50 dark:hover:bg-slate-700",
                    )}
                    onClick={() => {
                      onChange(opt);
                      setOpen(false);
                    }}
                  >
                    <span
                      className={cn(
                        "inline-block h-2 w-2 shrink-0 rounded-md",
                        optTone || "bg-slate-300",
                      )}
                    />
                    <span className={optTone ? "" : "text-slate-600 dark:text-slate-300"}>
                      {opt}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
    </td>
  );
}

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
        setForm(s => ({ ...s, ...parsed }));
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
        const num = parseInt(match[0], 10) + 1;
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
    setEditForm((s) => (s ? { ...s, [k]: v } : null));
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
                            onClick={() => deleteCase(editingId)}
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
