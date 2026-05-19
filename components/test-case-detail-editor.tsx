"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from"react";
import { useRouter } from"next/navigation";
import { Bug, PencilSimple, Trash } from"@phosphor-icons/react";
import { toast } from"@/components/ui/toast";
import {
 BadgeCell,
 COLS,
 CustomSelect,
 EditTextCell,
 ReadCell,
 TOTAL_WIDTH,
 Th,
 colMap,
 priorityOptions,
 statusOptions,
 type TestCaseRow,
 type FieldKey,
 typeOptions,
} from"@/components/test-case-detail-helpers";
import { cn } from"@/lib/utils";

export type { TestCaseRow } from"@/components/test-case-detail-helpers";

type FieldRef = HTMLInputElement | HTMLTextAreaElement | HTMLButtonElement;

function normalizeRow(row: Record<string, unknown>, suiteId: string): TestCaseRow {
 return {
 id: row.id === undefined || row.id === null || row.id ==="" ? undefined : Number(row.id),
 testSuiteId: String(row.testSuiteId ?? suiteId),
 tcId: String(row.tcId ??""),
 caseName: String(row.caseName ??""),
 typeCase: String(row.typeCase ??""),
 preCondition: String(row.preCondition ??""),
 testStep: String(row.testStep ??""),
 expectedResult: String(row.expectedResult ??""),
 actualResult: String(row.actualResult ??""),
 status: String(row.status ??""),
 evidence: String(row.evidence ??""),
 priority: String(row.priority ??""),
 };
}

function createBlankDraft(suiteId: string, tcId: string): TestCaseRow {
 return {
 testSuiteId: suiteId,
 tcId,
 caseName:"",
 typeCase:"",
 preCondition:"",
 testStep:"",
 expectedResult:"",
 actualResult:"",
 status:"",
 evidence:"",
 priority:"",
 };
}

function extractPrefixAndNumber(tcId: string): { prefix: string; num: number; padLen: number } | null {
 const match = tcId.match(/^(.*?)(\d+)$/);
 if (!match) return null;
 const prefix = match[1] ?? "";
 const numStr = match[2] ?? "0";
 return { prefix, num: Number.parseInt(numStr, 10), padLen: numStr.length };
}

function suggestNextId(rows: TestCaseRow[]) {
 if (rows.length === 0) return"TC-001";
 const last = String(rows[rows.length - 1]?.tcId ??"");
 const parsed = extractPrefixAndNumber(last);
 if (parsed) {
 const next = parsed.num + 1;
 return`${parsed.prefix}${String(next).padStart(parsed.padLen,"0")}`;
 }
 return`TC-${String(rows.length + 1).padStart(3,"0")}`;
}

function renumberRows(rows: TestCaseRow[], newPrefix: string, startNum: number, padLen: number): TestCaseRow[] {
 return rows.map((row, i) => ({
 ...row,
 tcId: `${newPrefix}${String(startNum + i).padStart(padLen, "0")}`,
 }));
}

function isFailedStatus(value: string) {
 return ["Failed","FAILURE","FAILED"].includes(String(value).toUpperCase()) || String(value).toLowerCase() ==="failed";
}

function requiredEditReady(row: TestCaseRow | null) {
 return Boolean(row?.tcId && row.caseName && row.expectedResult && row.status && row.priority);
}

export function TestCaseGridRow({
 row,
 index,
 rowKey,
 mode,
 canSave,
 onChange,
 onSave,
 onEdit,
 onDelete,
 onReportBug,
 setRef,
 focusNext,
 focusPrevious,
}: {
 row: TestCaseRow;
 index: number;
 rowKey: string;
 mode:"view" |"edit" |"draft";
 canSave?: boolean;
 onChange: (field: FieldKey, value: string) => void;
 onSave: () => void;
 onEdit?: () => void;
 onDelete: () => void;
 onReportBug?: () => void;
 setRef?: (field: string, el: FieldRef | null) => void;
 focusNext?: (field: FieldKey) => void;
 focusPrevious?: (field: FieldKey) => void;
 focusAction?: () => void;
}) {
 const showSave = mode !=="view";
 const rowLabel = mode ==="draft" ?"NEW" : String(index + 1);

 const renderTextCell = (field: FieldKey, value: string, multiline?: boolean) => {
 if (mode ==="view") {
 return (
 <ReadCell value={value} w={colMap[field]} />
 );
 }

 return (
 <EditTextCell
 value={value}
 w={colMap[field]}
 multiline={multiline}
 onChange={(next) => onChange(field, next)}
 onEnter={() => focusNext?.(field)}
 setRef={(el) => setRef?.(`${rowKey}:${field}`, el)}
 autoFocus={mode ==="edit" && field ==="caseName"}
 />
 );
 };

 const renderToneCell = (field: Extract<FieldKey,"typeCase" |"status" |"priority">, value: string, options: readonly string[]) => {
 if (mode ==="view") {
 return (
 <BadgeCell value={value} w={colMap[field]} fieldKey={field} />
 );
 }

 return (
 <CustomSelect
 value={value}
 w={colMap[field]}
 fieldKey={field}
 options={options}
 placeholder="Select"
 onChange={(next) => onChange(field, next)}
 onEnter={() => focusNext?.(field)}
 setRef={(el) => setRef?.(`${rowKey}:${field}`, el)}
 />
 );
 };
 return (
 <tr className={cn(
  "align-top transition-colors",
  mode === "edit"
   ? "bg-blue-50/80 ring-2 ring-inset ring-blue-300"
   : mode === "draft"
   ? "bg-emerald-50/40"
   : "hover:bg-gray-50/70",
 )}>
 <td
 style={{ width: colMap.__row__, minWidth: colMap.__row__, maxWidth: colMap.__row__ }}
 className={cn(
"border-b border-r border-gray-100 px-2 py-[4px] text-center text-xs font-bold uppercase tracking-wide text-gray-400",
 mode === "draft" ? "bg-blue-50/50 text-blue-600" : mode === "edit" ? "bg-blue-100/60 text-blue-700" : "bg-transparent",
 )}
 >
 {rowLabel}
 </td>

 {renderTextCell("tcId", String(row.tcId ??""))}
 {renderTextCell("caseName", String(row.caseName ??""), true)}
 {renderToneCell("typeCase", String(row.typeCase ??""), typeOptions)}
 {renderTextCell("preCondition", String(row.preCondition ??""), true)}
 {renderTextCell("testStep", String(row.testStep ??""), true)}
 {renderTextCell("expectedResult", String(row.expectedResult ??""), true)}
 {renderTextCell("actualResult", String(row.actualResult ??""), true)}
 {renderToneCell("status", String(row.status ??""), statusOptions)}
 {renderToneCell("priority", String(row.priority ??""), priorityOptions)}
 {renderTextCell("evidence", String(row.evidence ??""), true)}

 <td
 style={{ width: colMap.__action__, minWidth: colMap.__action__, maxWidth: colMap.__action__ }}
 className="border-b border-gray-100 bg-transparent px-2 py-[4px] align-middle"
 >
 <div className="flex items-center justify-center gap-2">
 {mode ==="view" ? (
 <>
 <button
 type="button"
 onClick={onEdit}
 className="inline-flex h-8 w-8 items-center justify-center  bg-sky-50 text-sky-600 transition hover:bg-sky-100"
 title="Edit"
 >
 <PencilSimple size={12} weight="bold" />
 </button>
 <button
 type="button"
 onClick={onDelete}
 className="inline-flex h-8 w-8 items-center justify-center  bg-rose-50 text-rose-600 transition hover:bg-rose-100"
 title="Delete"
 >
 <Trash size={12} weight="bold" />
 </button>
 </>
 ) : showSave ? (
 <button
 data-cell-ref={`${rowKey}:action`}
 ref={(el) => setRef?.(`${rowKey}:action`, el)}
 type="button"
 onClick={onSave}
 disabled={!canSave}
 className="inline-flex h-8 items-center justify-center  bg-blue-600 px-3 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
 >
 Save
 </button>
 ) : null}

 {!showSave && isFailedStatus(row.status) && onReportBug && (
 <button
 type="button"
 onClick={onReportBug}
 className="inline-flex h-8 w-8 items-center justify-center  bg-amber-50 text-amber-600 transition hover:bg-amber-100"
 title="Report Bug"
 >
 <Bug size={14} weight="bold" />
 </button>
 )}
 </div>
 </td>
 </tr>
 );
}

export function TestCaseDetailEditor({
 suiteId,
 suiteTitle: _suiteTitle,
 initialCases,
}: {
 suiteId: string;
 suiteTitle: string;
 initialCases: TestCaseRow[];
}) {
 void _suiteTitle;
 const router = useRouter();
 const [pending, startTransition] = useTransition();
 const [cases, setCases] = useState<TestCaseRow[]>(() => initialCases.map((row) => normalizeRow(row, suiteId)));
 const [editingId, setEditingId] = useState<number | null>(null);
 const [editForm, setEditForm] = useState<TestCaseRow | null>(null);
 const [draftRow, setDraftRow] = useState<TestCaseRow>(() => createBlankDraft(suiteId, suggestNextId(initialCases)));
 const editSaveLockRef = useRef(false);
 const draftSaveLockRef = useRef(false);
 const editDirtyRef = useRef(false);
 const draftDirtyRef = useRef(false);
 const editDraftRef = useRef<TestCaseRow | null>(null);
 const draftRowRef = useRef<TestCaseRow>(draftRow);
 const editingIdRef = useRef<number | null>(null);
 const editFocusFieldRef = useRef<FieldKey | null>(null);
 const refs = useRef<Partial<Record<string, FieldRef | null>>>({});

 useEffect(() => {
 editingIdRef.current = editingId;
 }, [editingId]);

 useEffect(() => {
 draftRowRef.current = draftRow;
 }, [draftRow]);

 useEffect(() => {
 const editingIdValue = editingIdRef.current;
 const focusField = editFocusFieldRef.current;
 if (!editingIdValue) return;

 const targetField = focusField ??"caseName";
 const key =`edit-${editingIdValue}:${targetField}`;

 const frame = window.requestAnimationFrame(() => {
 const ref = refs.current[key];
 if (ref &&"focus" in ref) {
 ref.focus();
 if ("select" in ref) {
 ref.select?.();
 }
 }
 editFocusFieldRef.current = null;
 });

 return () => window.cancelAnimationFrame(frame);
 }, [editingId, editForm]);

 useEffect(() => {
 setCases(initialCases.map((row) => normalizeRow(row, suiteId)));
 }, [initialCases, suiteId]);

 function clearEditDraft(id: number | string) {
 if (String(editingIdRef.current ??"") !== String(id)) return;

 editDirtyRef.current = false;
 editDraftRef.current = null;
 editFocusFieldRef.current = null;
 setEditForm(null);
 setEditingId(null);
 }

 function setDraft<K extends FieldKey>(key: K, value: string) {
 draftDirtyRef.current = true;
 setDraftRow((current) => ({ ...current, [key]: value }));
 }

 function setEdit<K extends FieldKey>(key: K, value: string) {
 if (!editDraftRef.current) return;
 editDirtyRef.current = true;
 editDraftRef.current = { ...editDraftRef.current, [key]: value };
 setEditForm((current) => (current ? { ...current, [key]: value } : null));
 }

 function startEdit(row: TestCaseRow, field?: FieldKey) {
 if (editingIdRef.current && editingIdRef.current !== row.id && editDirtyRef.current) {
 toast("Save the current row before switching.","info");
 return;
 }

 setEditingId(row.id ?? null);
 const draft = { ...row };
 editDraftRef.current = draft;
 editDirtyRef.current = false;
 setEditForm(draft);
 editFocusFieldRef.current = field ??"caseName";
 }

 async function saveEdit() {
 const savedId = editingIdRef.current;
 const savedEntry = editDraftRef.current ? { ...editDraftRef.current } : null;

 if (!savedEntry || !savedId || pending || !requiredEditReady(savedEntry) || editSaveLockRef.current) return;

 // No changes - just close edit mode
 if (!editDirtyRef.current) {
 editDraftRef.current = null;
 setEditForm(null);
 setEditingId(null);
 return;
 }

 editSaveLockRef.current = true;
 startTransition(async () => {
 try {
 // Detect if prefix changed - renumber subsequent rows
 const editedIndex = cases.findIndex((row) => row.id === savedId);
 const originalRow = cases[editedIndex];
 const oldParsed = originalRow ? extractPrefixAndNumber(String(originalRow.tcId ?? "")) : null;
 const newParsed = extractPrefixAndNumber(String(savedEntry.tcId ?? ""));
 const prefixChanged = oldParsed && newParsed && oldParsed.prefix !== newParsed.prefix;

 const res = await fetch("/api/items/test-cases", {
 method:"PATCH",
 headers: {"Content-Type":"application/json" },
 body: JSON.stringify({ id: savedId, entry: savedEntry }),
 });
 const data = await res.json();

 if (res.ok) {
 // If prefix changed, renumber all rows after the edited one
 if (prefixChanged && newParsed && editedIndex >= 0) {
 const subsequentRows = cases.slice(editedIndex + 1);
 const renumbered = renumberRows(subsequentRows, newParsed.prefix, newParsed.num + 1, newParsed.padLen);

 // Batch update subsequent rows on server
 const updatePromises = renumbered.map((row, i) => {
 const original = subsequentRows[i];
 if (!original?.id || original.tcId === row.tcId) return Promise.resolve();
 return fetch("/api/items/test-cases", {
 method: "PATCH",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ id: original.id, entry: { ...original, tcId: row.tcId } }),
 });
 });
 await Promise.all(updatePromises);

 setCases((current) => {
 const updated = [...current];
 updated[editedIndex] = { ...updated[editedIndex], ...savedEntry };
 for (let i = editedIndex + 1; i < updated.length; i++) {
 updated[i] = { ...updated[i], tcId: renumbered[i - editedIndex - 1]?.tcId ?? updated[i].tcId };
 }
 return updated;
 });
 } else {
 setCases((current) => current.map((row) => (row.id === savedId ? { ...row, ...savedEntry } : row)));
 }

 editDirtyRef.current = false;
 editDraftRef.current = null;
 setEditForm(null);
 setEditingId(null);
 // Update draft row's suggested ID based on new state
 setCases((current) => {
 const nextId = suggestNextId(current);
 setDraftRow((d) => draftDirtyRef.current ? d : { ...d, tcId: nextId });
 draftRowRef.current = { ...draftRowRef.current, tcId: nextId };
 return current;
 });
 toast(data.message ||"Case updated","success");
 router.refresh();
 } else {
 toast(data.error ||"Failed to update","error");
 }
 } catch {
 toast("Error occurred","error");
 } finally {
 editSaveLockRef.current = false;
 }
 });
 }

 async function saveDraft() {
 const savedEntry = { ...draftRowRef.current };

 if (pending || !requiredEditReady(savedEntry) || !draftDirtyRef.current || draftSaveLockRef.current) return;

 draftSaveLockRef.current = true;
 startTransition(async () => {
 try {
 const data = new FormData();
 Object.entries(savedEntry).forEach(([key, value]) => data.append(key, String(value ??"")));

 const res = await fetch("/api/items/test-cases", { method:"POST", body: data });
 const result = await res.json();

 if (res.ok) {
 const created = result.item ? normalizeRow(result.item as Record<string, unknown>, suiteId) : null;
 if (created?.id) {
 setCases((current) => [...current, created]);
 const nextId = suggestNextId([...cases, created]);
 const nextDraft = createBlankDraft(suiteId, nextId);
 setDraftRow(nextDraft);
 draftRowRef.current = nextDraft;
 draftDirtyRef.current = false;
 } else {
 const nextDraft = createBlankDraft(suiteId, suggestNextId(cases));
 setDraftRow(nextDraft);
 draftRowRef.current = nextDraft;
 draftDirtyRef.current = false;
 }
 toast(result.message ||"Case added","success");
 router.refresh();
 } else {
 toast(result.error ||"Failed to add","error");
 }
 } catch {
 toast("Error occurred","error");
 } finally {
 draftSaveLockRef.current = false;
 }
 });
 }

 async function deleteCase(id: number | string) {
 startTransition(async () => {
 try {
 const res = await fetch(`/api/items/test-cases?id=${id}`, { method:"DELETE" });
 const data = await res.json();

 if (res.ok) {
 setCases((current) => current.filter((row) => String(row.id) !== String(id)));
 clearEditDraft(id);
 toast(data.message ||"Deleted successfully","success");
 } else {
 toast(data.error ||"Failed to delete","error");
 }
 } catch {
 toast("Error occurred","error");
 }
 });
 }

 const canSaveEdit = useMemo(() => requiredEditReady(editForm), [editForm]);
 const canSaveDraft = useMemo(() => requiredEditReady(draftRow), [draftRow]);

 const passed = cases.filter((row) => row.status ==="Passed" || row.status ==="Success").length;
 const failed = cases.filter((row) => row.status ==="Failed").length;
 const blocked = cases.filter((row) => row.status ==="Blocked").length;
 const pendingCount = cases.filter((row) => row.status ==="Pending").length;

 const positive = cases.filter((row) => row.typeCase ==="Positive").length;
 const negative = cases.filter((row) => row.typeCase ==="Negative").length;

 const critical = cases.filter((row) => row.priority ==="Critical").length;
 const high = cases.filter((row) => row.priority ==="High").length;
 const medium = cases.filter((row) => row.priority ==="Medium").length;
 const low = cases.filter((row) => row.priority ==="Low").length;
 const editableFieldOrder: FieldKey[] = ["tcId","caseName","typeCase","preCondition","testStep","expectedResult","actualResult","status","priority","evidence"];

 function focusCell(key: string) {
 const el = refs.current[key];
 if (el &&"focus" in el) {
 el.focus();
 }
 }

 function focusNextInRow(rowKey: string, rowIndex: number, field: FieldKey, isDraft?: boolean) {
 const currentIndex = editableFieldOrder.indexOf(field);
 const nextField = editableFieldOrder[currentIndex + 1];
 if (nextField) {
 window.setTimeout(() => focusCell(`${rowKey}:${nextField}`), 0);
 return;
 }
 if (isDraft) {
 window.setTimeout(() => focusCell(`${rowKey}:action`), 0);
 return;
 }
 const nextRow = cases[rowIndex + 1];
 if (nextRow) {
 const nextRowKey =`view-${nextRow.id ?? rowIndex + 1}`;
 window.setTimeout(() => focusCell(`${nextRowKey}:${editableFieldOrder[0]}`), 0);
 return;
 }
 window.setTimeout(() => focusCell(`draft:${editableFieldOrder[0]}`), 0);
 }

 function focusPreviousInRow(rowKey: string, rowIndex: number, field: FieldKey, isDraft?: boolean) {
 const currentIndex = editableFieldOrder.indexOf(field);
 const prevField = editableFieldOrder[currentIndex - 1];
 if (prevField) {
 window.setTimeout(() => focusCell(`${rowKey}:${prevField}`), 0);
 return;
 }
 if (isDraft) {
 const prevRow = cases[cases.length - 1];
 if (prevRow) {
 const prevRowKey =`view-${prevRow.id ?? cases.length - 1}`;
 window.setTimeout(() => focusCell(`${prevRowKey}:${editableFieldOrder[editableFieldOrder.length - 1]}`), 0);
 }
 return;
 }
 const prevRow = cases[rowIndex - 1];
 if (prevRow) {
 const prevRowKey =`view-${prevRow.id ?? rowIndex - 1}`;
 window.setTimeout(() => focusCell(`${prevRowKey}:${editableFieldOrder[editableFieldOrder.length - 1]}`), 0);
 } else {
 window.setTimeout(() => focusCell(`draft:${editableFieldOrder[editableFieldOrder.length - 1]}`), 0);
 }
 }

 return (
 <div className="flex flex-col gap-6">
 <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
 <div className="glass-card space-y-3 p-4">
 <div className="border-b border-gray-100 pb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">
 Execution Status
 </div>
 <div className="flex gap-6">
 <div>
 <div className="text-xl font-bold text-emerald-500">{passed}</div>
 <div className="text-[11px] font-bold uppercase text-gray-400">PASS</div>
 </div>
 <div>
 <div className="text-xl font-bold text-rose-500">{failed}</div>
 <div className="text-[11px] font-bold uppercase text-gray-400">FAIL</div>
 </div>
 <div>
 <div className="text-xl font-bold text-amber-500">{blocked}</div>
 <div className="text-[11px] font-bold uppercase text-gray-400">BLOCK</div>
 </div>
 <div>
 <div className="text-xl font-bold text-gray-400">{pendingCount}</div>
 <div className="text-[11px] font-bold uppercase text-gray-400">PEND</div>
 </div>
 </div>
 </div>

 <div className="glass-card space-y-3 p-4">
 <div className="border-b border-gray-100 pb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">
 Test Type
 </div>
 <div className="flex gap-6">
 <div>
 <div className="text-xl font-bold text-emerald-500">{positive}</div>
 <div className="text-[11px] font-bold uppercase text-gray-400">POS</div>
 </div>
 <div>
 <div className="text-xl font-bold text-rose-500">{negative}</div>
 <div className="text-[11px] font-bold uppercase text-gray-400">NEG</div>
 </div>
 </div>
 </div>

 <div className="glass-card space-y-3 p-4">
 <div className="border-b border-gray-100 pb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">
 Priority
 </div>
 <div className="flex gap-5">
 <div>
 <div className="text-xl font-bold text-red-700">{critical}</div>
 <div className="text-[11px] font-bold uppercase text-gray-400">CRIT</div>
 </div>
 <div>
 <div className="text-xl font-bold text-rose-500">{high}</div>
 <div className="text-[11px] font-bold uppercase text-gray-400">HIGH</div>
 </div>
 <div>
 <div className="text-xl font-bold text-sky-500">{medium}</div>
 <div className="text-[11px] font-bold uppercase text-gray-400">MED</div>
 </div>
 <div>
 <div className="text-xl font-bold text-gray-400">{low}</div>
 <div className="text-[11px] font-bold uppercase text-gray-400">LOW</div>
 </div>
 </div>
 </div>
 </div>

 <div className="overflow-auto  glass-card">
 <table className="border-collapse" style={{ width: TOTAL_WIDTH, tableLayout:"fixed" }}>
 <colgroup>
 {COLS.map((column) => (
 <col key={column.key} style={{ width: column.width }} />
 ))}
 </colgroup>

 <thead className="sticky top-0 z-20 bg-gray-200">
 <tr>
 {COLS.map((column) => (
 <Th
 key={column.key}
 w={column.width}
 className={cn(column.key ==="__row__" || column.key ==="__action__" ?"text-center" :"")}
 >
 {column.label}
 </Th>
 ))}
 </tr>
 </thead>

 <tbody>
 {cases.map((row, index) => {
 const isEditing = editingId === row.id;
 const rowKey = isEditing ?`edit-${row.id}` :`view-${row.id ?? index}`;
 const displayRow = isEditing && editForm && row.id === editForm.id ? editForm : row;
 return (
 <TestCaseGridRow
 key={row.id ??`${row.tcId}-${index}`}
 row={displayRow}
 index={index}
 rowKey={rowKey}
 mode={isEditing ?"edit" :"view"}
 canSave={canSaveEdit}
 onChange={(field, value) => setEdit(field, value)}
 onSave={saveEdit}
 onEdit={() => startEdit(row,"caseName")}
 onDelete={() => row.id && deleteCase(row.id)}
 onReportBug={
 isFailedStatus(row.status)
 ? () => {
 window.open(
`/bugs?action=new&title=${encodeURIComponent(`[Failed] ${row.caseName}`)}&preconditions=${encodeURIComponent(row.preCondition)}&stepsToReproduce=${encodeURIComponent(row.testStep)}&expectedResult=${encodeURIComponent(row.expectedResult)}&actualResult=${encodeURIComponent(row.actualResult ||"")}`,
"_blank",
 );
 }
 : undefined
 }
 setRef={(field, el) => {
 refs.current[`${rowKey}:${field}`] = el;
 }}
 focusNext={(field) => focusNextInRow(rowKey, index, field, false)}
 focusPrevious={(field) => focusPreviousInRow(rowKey, index, field, false)}
 />
 );
 })}

 {(() => {
 const rowKey ="draft";
 return (
 <TestCaseGridRow
 row={draftRow}
 index={cases.length}
 rowKey={rowKey}
 mode="draft"
 canSave={canSaveDraft}
 onChange={(field, value) => setDraft(field, value)}
 onSave={saveDraft}
 onEdit={() => undefined}
 onDelete={() => undefined}
 setRef={(field, el) => {
 refs.current[`${rowKey}:${field}`] = el;
 }}
 focusNext={(field) => focusNextInRow(rowKey, cases.length, field, true)}
 focusPrevious={(field) => focusPreviousInRow(rowKey, cases.length, field, true)}
 />
 );
 })()}
 </tbody>
 </table>
 </div>

 <div className="flex flex-wrap items-center gap-3 px-1 text-xs text-gray-500">
 <span className="font-semibold text-gray-600">
 Total: {cases.length} test case{cases.length !== 1 ?"s" :""}
 </span>
 <span className="text-gray-300">|</span>
 {passed > 0 && <span className="font-semibold text-emerald-600">{passed} Passed</span>}
 {failed > 0 && <span className="font-semibold text-rose-500">{failed} Failed</span>}
 {pendingCount > 0 && <span className="font-semibold text-amber-500">{pendingCount} Pending</span>}
 {blocked > 0 && <span className="font-semibold text-amber-600">{blocked} Blocked</span>}
 {passed === 0 && failed === 0 && pendingCount === 0 && blocked === 0 && (
 <span className="text-gray-400">No test results yet</span>
 )}
 </div>
 </div>
 );
}
