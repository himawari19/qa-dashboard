"use client";

import { useState, useEffect, useCallback } from"react";
import { CheckCircle, XCircle, ArrowLeft, Database, FastForward, Keyboard, Warning, CaretLeft, CaretRight, Play, ArrowSquareOut } from"@phosphor-icons/react";
import { cn, formatDisplayText } from"@/lib/utils";
import Link from"next/link";
import { toast } from"@/components/ui/toast";
import { useRouter } from"next/navigation";
import { Badge } from"@/components/badge";
import { Breadcrumb } from"@/components/breadcrumb";
import { PlayModeView } from"../play-mode";

type TestCase = {
 id: string | number;
 code: string;
 caseName: string;
 preCondition: string;
 testStep: string;
 expectedResult: string;
 actualResult: string;
 status: string;
};

type ExecutionGroup = {
 project: string;
 sprint: string;
 title: string;
};

type SessionForm = {
 project: string;
 sprint: string;
 tester: string;
 notes: string;
};

export function ExecutionView({
 executionGroup,
 cases,
 executionToken,
}: {
 executionGroup: ExecutionGroup;
 cases: TestCase[];
 scenarioId: string;
 executionToken: string;
}) {
 const router = useRouter();
 const [items, setItems] = useState<TestCase[]>(cases);
 const [loading, setLoading] = useState(false);
 const [selectedId, setSelectedId] = useState<string | number | null>(
 cases.length > 0 ? cases[0].id : null,
 );
 const [showModal, setShowModal] = useState(false);
 const [showShortcuts, setShowShortcuts] = useState(false);
const [sessionForm, setSessionForm] = useState<SessionForm>({
 project: executionGroup.project ||"",
 sprint: executionGroup.sprint ||"",
 tester:"",
 notes:"",
 });
 const [isPlayMode, setIsPlayMode] = useState(false);

 const selectedCase = items.find((i) => i.id === selectedId);
 const selectedIndex = items.findIndex((i) => i.id === selectedId);

 const total = items.length;
 const passed = items.filter((i) => i.status ==="Passed").length;
 const failed = items.filter((i) => i.status ==="Failed").length;
 const blocked = items.filter((i) => i.status ==="Blocked").length;
 const completed = passed + failed + blocked;
 const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
 const passW = total > 0 ? (passed / total) * 100 : 0;
 const failW = total > 0 ? (failed / total) * 100 : 0;
 const blockW = total > 0 ? (blocked / total) * 100 : 0;

 const goToNext = useCallback(() => {
 if (selectedIndex < items.length - 1) setSelectedId(items[selectedIndex + 1].id);
 }, [selectedIndex, items]);

 const goToPrev = useCallback(() => {
 if (selectedIndex > 0) setSelectedId(items[selectedIndex - 1].id);
 }, [selectedIndex, items]);

 const updateStatus = useCallback(
 (id: string | number, status: string, advance = false) => {
 setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
 if (advance) setTimeout(goToNext, 150);
 },
 [goToNext],
 );

 const updateActualResult = useCallback((id: string | number, actualResult: string) => {
 setItems((prev) => prev.map((item) => (item.id === id ? { ...item, actualResult } : item)));
 }, []);

 useEffect(() => {
 const handleKeyDown = (e: globalThis.KeyboardEvent) => {
 if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
 switch (e.key.toLowerCase()) {
 case"p":
 if (selectedId) updateStatus(selectedId,"Passed", true);
 break;
 case"f":
 if (selectedId) updateStatus(selectedId,"Failed", true);
 break;
 case"b":
 if (selectedId) updateStatus(selectedId,"Blocked", true);
 break;
 case"arrowdown":
 case"j":
 e.preventDefault();
 goToNext();
 break;
 case"arrowup":
 case"k":
 e.preventDefault();
 goToPrev();
 break;
 case"?":
 setShowShortcuts((p) => !p);
 break;
 }
 };
 window.addEventListener("keydown", handleKeyDown);
 return () => window.removeEventListener("keydown", handleKeyDown);
 }, [selectedId, updateStatus, goToNext, goToPrev]);

 const saveResults = async () => {
 if (!sessionForm.tester.trim()) {
 toast("Tester name is required.","error");
 return;
 }
 setLoading(true);
 try {
 const tcRes = await fetch("/api/test-cases", {
 method:"PUT",
 headers: {"Content-Type":"application/json" },
 body: JSON.stringify({ rows: items }),
 });
 if (!tcRes.ok) throw new Error("Failed to save test case results");

 const result = failed > 0 ?"fail" : blocked > 0 ?"blocked" :"pass";
 const formData = new FormData();
 formData.set("date", new Date().toISOString().split("T")[0]);
 formData.set("project", sessionForm.project);
 formData.set("sprint", sessionForm.sprint);
 formData.set("tester", sessionForm.tester);
 formData.set("scope", executionGroup.title);
 formData.set("totalCases", String(total));
 formData.set("passed", String(passed));
 formData.set("failed", String(failed));
 formData.set("blocked", String(blocked));
 formData.set("result", result);
 formData.set("notes", sessionForm.notes);
 formData.set("evidence","");

 const sessionRes = await fetch("/api/items/test-sessions", {
 method:"POST",
 body: formData,
 });
 if (!sessionRes.ok) {
 const d = await sessionRes.json();
 throw new Error(d.error ||"Failed to create test session");
 }

 toast("Session saved!","success");
 router.push("/test-sessions");
 } catch (error) {
 toast(error instanceof Error ? error.message :"Failed to save","error");
 } finally {
 setLoading(false);
 }
 };

 return (
 <div className="mx-auto max-w-7xl px-4 py-6 animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-6">
 {isPlayMode && (
 <PlayModeView 
 executionGroup={executionGroup} 
 cases={items} 
 onClose={(updated) => {
 setItems(updated);
 setIsPlayMode(false);
 }} 
 />
 )}
 {/* ── Finish Session Modal ── */}
 {showModal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
 <div className="w-full max-w-sm rounded-xl bg-white border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
 <div className="px-4 py-3 border-b border-slate-100">
 <h2 className="text-sm font-black text-slate-900">Finish Session</h2>
 <p className="text-[11px] text-slate-500 mt-0.5">Confirm details before saving.</p>
 </div>

 <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
 {[
 { label:"Passed", value: passed, color:"text-emerald-600" },
 { label:"Failed", value: failed, color:"text-red-600" },
 { label:"Blocked", value: blocked, color:"text-amber-500" },
 ].map((s) => (
 <div key={s.label} className="py-3 text-center">
 <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{s.label}</p>
 </div>
 ))}
 </div>

 <div className="px-4 py-3 space-y-2.5 max-h-[50vh] overflow-y-auto">
 {[
 { key:"project", label:"Project", placeholder:"Project name", required: false },
 { key:"sprint", label:"Sprint", placeholder:"e.g. Sprint 5", required: false },
 { key:"tester", label:"Tester", placeholder:"Your name", required: true },
 ].map((f) => (
 <div key={f.key}>
 <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
 {f.label}{f.required && <span className="text-red-500 ml-0.5">*</span>}
 </label>
 <input
 type="text"
 value={(sessionForm as Record<string, string>)[f.key]}
 onChange={(e) => setSessionForm((p) => ({ ...p, [f.key]: e.target.value }))}
 className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
 placeholder={f.placeholder}
 />
 </div>
 ))}
 <div>
 <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Notes</label>
 <textarea
 value={sessionForm.notes}
 onChange={(e) => setSessionForm((p) => ({ ...p, notes: e.target.value }))}
 rows={2}
 className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
 placeholder="Optional notes"
 />
 </div>
 </div>

 <div className="flex gap-2 px-4 py-3 border-t border-slate-100">
 <button
 onClick={() => setShowModal(false)}
 disabled={loading}
 className="flex-1 h-8 rounded-md border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition disabled:opacity-50"
 >
 Cancel
 </button>
 <button
 onClick={saveResults}
 disabled={loading}
 className="flex-1 h-8 rounded-md bg-slate-900 text-xs font-bold text-white hover:bg-blue-600 transition disabled:opacity-50"
 >
 {loading ?"Saving..." :"Save Session"}
 </button>
 </div>
 </div>
 </div>
 )}

 {/* ── Keyboard Shortcuts Tooltip ── */}
 {showShortcuts && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowShortcuts(false)}>
 <div className="w-full max-w-xs rounded-xl bg-white border border-slate-200 shadow-2xl p-5 animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
 <h3 className="text-sm font-black text-slate-900 mb-3 flex items-center gap-2">
 <Keyboard size={16} weight="bold" /> Keyboard Shortcuts
 </h3>
 <div className="space-y-2 text-xs">
 {[
 { key:"P", desc:"Pass current case" },
 { key:"F", desc:"Fail current case" },
 { key:"B", desc:"Block current case" },
 { key:"J / ↓", desc:"Next case" },
 { key:"K / ↑", desc:"Previous case" },
 { key:"?", desc:"Toggle this dialog" },
 ].map((s) => (
 <div key={s.key} className="flex items-center justify-between">
 <span className="text-slate-500">{s.desc}</span>
 <kbd className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-600 border border-slate-200">{s.key}</kbd>
 </div>
 ))}
 </div>
 </div>
 </div>
 )}

 <div className="animate-in fade-in slide-in-from-top-2 duration-500">
 <Breadcrumb
 crumbs={[
 { label:"Dashboard", href:"/dashboard" },
 { label:"Test Execution", href:"/test-execution" },
 { label: executionGroup.title },
 ]}
 />
 </div>

 {/* ── Header ── */}
 <div className="rounded-xl bg-white p-2 shadow-sm border border-slate-200">
 <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between px-6 py-5">
 <div className="flex items-center gap-5">
 <Link
 href="/test-execution"
 className="flex h-11 w-11 items-center justify-center rounded-md bg-slate-50 text-slate-400 transition hover:bg-blue-600 hover:text-white active:scale-90"
 >
 <ArrowLeft size={20} weight="bold" />
 </Link>
 <div>
 <div className="flex items-center gap-3 mb-1">
 {executionGroup.project && (
 <Link
 href={`/test-plans/projects/${encodeURIComponent(executionGroup.project)}`}
 className="text-xs font-semibold text-blue-600 hover:underline uppercase tracking-widest transition-colors"
 >
 {executionGroup.project}
 </Link>
 )}
 {executionGroup.sprint && (<>
 <div className="h-1 w-1 rounded-full bg-slate-300" />
 <span className="text-xs font-semibold tracking-widest text-slate-400 uppercase">{executionGroup.sprint}</span>
 </>)}
 </div>
 <h1 className="text-3xl font-bold tracking-tight text-slate-900 leading-none">
 {executionGroup.title}
 </h1>
 </div>
 </div>

 <div className="flex items-center gap-3">
 <button
 onClick={() => setShowShortcuts(true)}
 title="Keyboard shortcuts (?)"
 className="flex h-11 w-11 items-center justify-center rounded-md border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-blue-600 transition"
 >
 <Keyboard size={18} weight="bold" />
 </button>
 <Link
 href={`/test-suites/${executionToken}`}
 title="View Execution Detail"
 className="flex h-11 w-11 items-center justify-center rounded-md border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-blue-600 transition"
 >
 <ArrowSquareOut size={18} weight="bold" />
 </Link>
 <Link
 href={`/test-cases/detail/${executionToken}`}
 className="inline-flex h-11 items-center gap-2 rounded-md border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200"
 >
 Add Test Case
 </Link>
 <button
 onClick={() => setIsPlayMode(true)}
 className="inline-flex h-11 items-center gap-2 rounded-md bg-blue-600 px-5 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-700 active:scale-95"
 >
 <Play size={18} weight="fill" />
 Execution Mode
 </button>
 <button
 onClick={() => setShowModal(true)}
 disabled={total === 0}
 className="group relative inline-flex h-11 items-center gap-2 overflow-hidden rounded-md bg-slate-900 px-6 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-600 active:scale-95 disabled:opacity-30"
 >
 <CheckCircle
 size={18}
 weight="fill"
 className={cn(total > 0 ?"text-emerald-400" :"text-slate-400")}
 />
 Finish Session
 </button>
 </div>
 </div>

 {/* Progress bar */}
 {total > 0 && (
 <div className="px-6 pb-4">
 <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
 <div className="flex h-full">
 <div style={{ width:`${passW}%` }} className="bg-emerald-500 transition-all duration-500" />
 <div style={{ width:`${failW}%` }} className="bg-rose-500 transition-all duration-500" />
 <div style={{ width:`${blockW}%` }} className="bg-amber-400 transition-all duration-500" />
 </div>
 </div>
 <div className="flex flex-wrap items-center justify-between mt-2">
 <div className="flex gap-4 text-[11px] font-semibold text-slate-400">
 <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" />{passed} Passed</span>
 <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-500" />{failed} Failed</span>
 <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-400" />{blocked} Blocked</span>
 <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-slate-300" />{total - completed} Pending</span>
 </div>
 <div className="text-xs font-bold text-slate-500">
 {completed}/{total} completed · {progress}%
 </div>
 </div>
 </div>
 )}
 </div>

 {total === 0 ? (
 <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
 <div className="h-20 w-20 rounded-md bg-slate-50 flex items-center justify-center text-slate-400 mb-6">
 <Database size={40} weight="duotone" />
 </div>
 <h3 className="text-2xl font-bold text-slate-900">Execution Group is Empty</h3>
 <p className="mt-3 text-slate-600 max-w-md mx-auto text-base">
 This execution group doesn&apos;t have any cases yet. Add at least one test case to start
 execution.
 </p>
 <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
 <Link
 href={`/test-cases/detail/${executionToken}`}
 className="inline-flex h-11 items-center gap-2 rounded-md bg-blue-600 px-6 font-semibold text-white shadow-sm transition duration-200 hover:bg-blue-700 active:scale-95"
 >
 Add Test Case <FastForward size={16} weight="bold" />
 </Link>
 <Link
 href="/test-execution"
 className="inline-flex h-11 items-center gap-2 rounded-md border border-slate-200 bg-white px-6 font-semibold text-slate-600 shadow-sm transition duration-200 hover:bg-slate-50"
 >
 Go Back
 </Link>
 </div>
 </div>
 ) : (
 <div className="grid gap-6 lg:grid-cols-12">
 {/* ── Left: Case list ── */}
 <div className="lg:col-span-4 space-y-4">
 <div className="flex items-center justify-between px-1">
 <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500">
 Cases ({items.length})
 </h3>
 </div>

 <div className="max-h-[65vh] overflow-y-auto space-y-2 pr-2 scrollbar-thin">
 {items.map((item) => (
 <div
 key={item.id}
 onClick={() => setSelectedId(item.id)}
 className={cn(
"group relative cursor-pointer overflow-hidden rounded-xl border p-3.5 transition-all duration-200",
 selectedId === item.id
 ?"border-blue-600 bg-blue-50/50 ring-1 ring-blue-600 shadow-sm"
 :"border-slate-200 bg-white hover:border-blue-300",
 )}
 >
 <div className="flex items-center justify-between gap-3">
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2 mb-1">
 <span
 className={cn(
"h-2 w-2 rounded-full",
 item.status ==="Passed"
 ?"bg-emerald-500 shadow-[0_0_8px_#10b981]"
 : item.status ==="Failed"
 ?"bg-rose-500 shadow-[0_0_8px_#f43f5e]"
 : item.status ==="Blocked"
 ?"bg-amber-500 shadow-[0_0_8px_#f59e0b]"
 :"bg-slate-300",
 )}
 />
 <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
 {item.code}
 </p>
 </div>
 <h4
 className={cn(
"truncate text-sm font-semibold transition-colors",
 selectedId === item.id
 ?"text-blue-900"
 :"text-slate-700",
 )}
 >
 {item.caseName}
 </h4>
 </div>
 {(item.status ==="Passed" ||
 item.status ==="Failed" ||
 item.status ==="Blocked") && (
 <div
 className={cn(
"flex h-6 w-6 items-center justify-center rounded-md text-white shadow-sm transition-transform animate-in zoom-in",
 item.status ==="Passed"
 ?"bg-emerald-500"
 : item.status ==="Failed"
 ?"bg-rose-500"
 :"bg-amber-500",
 )}
 >
 {item.status ==="Passed" ? (
 <CheckCircle size={14} weight="bold" />
 ) : item.status ==="Failed" ? (
 <XCircle size={14} weight="bold" />
 ) : (
 <Warning size={14} weight="bold" />
 )}
 </div>
 )}
 </div>
 </div>
 ))}
 </div>
 </div>

 {/* ── Right: Case detail ── */}
 <div className="lg:col-span-8">
 {selectedCase && (
 <div className="sticky top-6 flex flex-col gap-5">
 <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-6 border-b border-slate-100">
 <div className="flex items-center gap-4">
 <div className="flex h-12 w-12 items-center justify-center rounded-md bg-blue-600 text-white shadow-sm">
 <Play size={24} weight="fill" />
 </div>
 <div>
 <p className="text-xs font-semibold tracking-widest text-slate-500 uppercase mb-1">
 {selectedCase.code}
 </p>
 <h2 className="text-2xl font-bold text-slate-900 leading-tight">
 {selectedCase.caseName}
 </h2>
 </div>
 </div>
 <div className="flex items-center gap-1">
 <button
 onClick={goToPrev}
 disabled={selectedIndex === 0}
 title="Previous Case (K / ↑)"
 className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-400 transition hover:bg-slate-50 hover:text-blue-600 active:scale-90 disabled:opacity-30"
 >
 <CaretLeft size={18} weight="bold" />
 </button>
 <div className="px-3 text-xs font-bold text-slate-400 uppercase tracking-widest">
 {selectedIndex + 1} / {items.length}
 </div>
 <button
 onClick={goToNext}
 disabled={selectedIndex === items.length - 1}
 title="Next Case (J / ↓)"
 className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-400 transition hover:bg-slate-50 hover:text-blue-600 active:scale-90 disabled:opacity-30"
 >
 <CaretRight size={18} weight="bold" />
 </button>
 </div>
 </div>

 <div className="grid gap-8 md:grid-cols-2">
 <div className="space-y-6">
 <section>
 <div className="flex items-center gap-2 mb-2.5">
 <div className="h-1.5 w-1.5 rounded-full bg-slate-400" />
 <h5 className="text-xs font-semibold uppercase tracking-widest text-slate-500">
 Pre-conditions
 </h5>
 </div>
 <div className="text-sm font-medium leading-relaxed text-slate-600 bg-slate-50 p-4 rounded-md border border-slate-200 break-words overflow-hidden">
 {selectedCase.preCondition ||"No specific preconditions."}
 </div>
 </section>

 <section>
 <div className="flex items-center gap-2 mb-2.5">
 <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
 <h5 className="text-xs font-semibold uppercase tracking-widest text-blue-600">
 Steps to Reproduce
 </h5>
 </div>
 <div className="text-sm font-medium leading-relaxed text-slate-700 bg-blue-50/50 p-5 rounded-md border border-blue-100 whitespace-pre-line shadow-inner break-words overflow-hidden">
 {selectedCase.testStep}
 </div>
 </section>
 </div>

 <div className="space-y-6">
 <section>
 <div className="flex items-center gap-2 mb-2.5">
 <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
 <h5 className="text-xs font-semibold uppercase tracking-widest text-emerald-600">
 Expected Outcome
 </h5>
 </div>
 <div className="text-sm font-medium leading-relaxed text-emerald-700 bg-emerald-50 p-5 rounded-md border border-emerald-100 break-words overflow-hidden">
 {selectedCase.expectedResult}
 </div>
 </section>

 <div className="rounded-xl bg-slate-900 p-6 text-white shadow-sm border border-slate-800">
 <div className="flex items-center justify-between mb-4">
 <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
 Execution Verdict
 </p>
 {selectedCase.status && <Badge value={selectedCase.status} />}
 </div>

 <div className="mb-4">
 <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
 Actual Result
 </label>
 <textarea
 rows={2}
 value={selectedCase.actualResult ||""}
 onChange={(e) => updateActualResult(selectedCase.id, e.target.value)}
 placeholder="What actually happened?"
 className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
 />
 </div>

 <div className="flex items-center gap-2">
 <button
 onClick={() => updateStatus(selectedCase.id,"Passed", true)}
 className={cn(
"flex-1 group/btn h-14 rounded-md flex flex-col items-center justify-center gap-1 transition-all active:scale-95",
 selectedCase.status ==="Passed"
 ?"bg-emerald-500 text-white shadow-sm"
 :"bg-slate-800 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400 border border-slate-700",
 )}
 >
 <CheckCircle
 size={20}
 weight={selectedCase.status ==="Passed" ?"fill" :"bold"}
 />
 <span className="text-[10px] font-semibold uppercase tracking-widest">
 Pass
 </span>
 </button>
 <button
 onClick={() => updateStatus(selectedCase.id,"Failed", true)}
 className={cn(
"flex-1 group/btn h-14 rounded-md flex flex-col items-center justify-center gap-1 transition-all active:scale-95",
 selectedCase.status ==="Failed"
 ?"bg-rose-500 text-white shadow-sm"
 :"bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700",
 )}
 >
 <XCircle
 size={20}
 weight={selectedCase.status ==="Failed" ?"fill" :"bold"}
 />
 <span className="text-[10px] font-semibold uppercase tracking-widest">
 Fail
 </span>
 </button>
 <button
 onClick={() => updateStatus(selectedCase.id,"Blocked", true)}
 className={cn(
"flex-1 group/btn h-14 rounded-md flex flex-col items-center justify-center gap-1 transition-all active:scale-95",
 selectedCase.status ==="Blocked"
 ?"bg-amber-500 text-white shadow-sm"
 :"bg-slate-800 hover:bg-amber-500/20 text-slate-400 hover:text-amber-400 border border-slate-700",
 )}
 >
 <Warning
 size={20}
 weight={selectedCase.status ==="Blocked" ?"fill" :"bold"}
 />
 <span className="text-[10px] font-semibold uppercase tracking-widest">
 Block
 </span>
 </button>
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 )}
 </div>
 </div>
 )}
 </div>
 );
}
