"use client";

// Legacy ExecutionView - kept for backward compatibility with existing tests.
// The new execution flow uses /test-execution/[id]/run/[runId]/run-execution-view.tsx

import { useState, useEffect, useCallback } from "react";
import { CheckCircle, XCircle, ArrowLeft, Keyboard, Warning, CaretLeft, CaretRight, Play } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { toast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/badge";
import { Breadcrumb } from "@/components/breadcrumb";

type CaseItem = {
  verdictId?: number;
  testCaseId?: number;
  id?: string | number;
  code?: string;
  tcId?: string;
  caseName: string;
  preCondition: string;
  testStep: string;
  expectedResult: string;
  actualResult: string;
  verdict?: string;
  status?: string;
  evidence?: string;
  duration?: number;
  priority?: string;
  typeCase?: string;
};

type ExecutionGroup = {
  project: string;
  sprint: string;
  title: string;
};

export function ExecutionView({
  executionGroup,
  cases,
  executionToken,
}: {
  executionGroup: ExecutionGroup;
  cases: CaseItem[];
  scenarioId: string;
  executionToken: string;
}) {
  const router = useRouter();
  const [items, setItems] = useState<CaseItem[]>(cases);
  const [selectedIdx, setSelectedIdx] = useState(0);

  const selectedCase = items[selectedIdx];
  const total = items.length;
  const getStatus = (item: CaseItem) => item.verdict || item.status || "Pending";
  const passed = items.filter(i => getStatus(i) === "Passed").length;
  const failed = items.filter(i => getStatus(i) === "Failed").length;
  const blocked = items.filter(i => getStatus(i) === "Blocked").length;
  const completed = passed + failed + blocked;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  const updateStatus = useCallback((idx: number, status: string, advance = false) => {
    setItems(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], verdict: status, status };
      return updated;
    });
    if (advance && idx < items.length - 1) {
      setTimeout(() => setSelectedIdx(idx + 1), 150);
    }
  }, [items.length]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.key.toLowerCase()) {
        case "p": updateStatus(selectedIdx, "Passed", true); break;
        case "f": updateStatus(selectedIdx, "Failed", true); break;
        case "b": updateStatus(selectedIdx, "Blocked", true); break;
        case "arrowdown": case "j": e.preventDefault(); setSelectedIdx(i => Math.min(total - 1, i + 1)); break;
        case "arrowup": case "k": e.preventDefault(); setSelectedIdx(i => Math.max(0, i - 1)); break;
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedIdx, updateStatus, total]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
      <Breadcrumb crumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Test Sessions", href: "/test-execution" },
        { label: executionGroup.title },
      ]} />

      <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
        <div className="flex items-center gap-5 mb-4">
          <Link href="/test-execution" className="flex h-11 w-11 items-center justify-center rounded-md bg-slate-50 text-slate-400 hover:bg-blue-600 hover:text-white transition">
            <ArrowLeft size={20} weight="bold" />
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-1">
              {executionGroup.project && <span className="text-xs font-semibold text-blue-600 uppercase tracking-widest">{executionGroup.project}</span>}
              {executionGroup.sprint && <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{executionGroup.sprint}</span>}
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{executionGroup.title}</h1>
          </div>
        </div>

        {/* Progress */}
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
          <div className="flex h-full">
            <div style={{ width: `${total > 0 ? (passed / total) * 100 : 0}%` }} className="bg-emerald-500 transition-all" />
            <div style={{ width: `${total > 0 ? (failed / total) * 100 : 0}%` }} className="bg-rose-500 transition-all" />
            <div style={{ width: `${total > 0 ? (blocked / total) * 100 : 0}%` }} className="bg-amber-400 transition-all" />
          </div>
        </div>
        <div className="flex gap-4 text-[11px] font-semibold text-slate-400">
          <span>{passed} Passed</span>
          <span>{failed} Failed</span>
          <span>{blocked} Blocked</span>
          <span>{total - completed} Pending</span>
        </div>
      </div>

      {total > 0 && selectedCase && (
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-4 max-h-[65vh] overflow-y-auto space-y-1.5">
            {items.map((item, idx) => (
              <button key={item.id || item.testCaseId || idx} onClick={() => setSelectedIdx(idx)} className={cn(
                "w-full text-left rounded-xl border-2 p-3 transition-all",
                selectedIdx === idx ? "border-blue-500 bg-blue-50/50" : "border-slate-200 bg-white hover:border-blue-200"
              )}>
                <p className="text-[10px] font-semibold text-slate-400 uppercase">{item.code || item.tcId}</p>
                <p className="text-sm font-semibold text-slate-700 truncate">{item.caseName}</p>
              </button>
            ))}
          </div>
          <div className="lg:col-span-8 rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">{selectedCase.caseName}</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <div><h5 className="text-[10px] font-bold text-slate-500 uppercase mb-1">Steps</h5><p className="text-sm text-slate-700 whitespace-pre-line">{selectedCase.testStep}</p></div>
              </div>
              <div className="space-y-3">
                <div><h5 className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Expected</h5><p className="text-sm text-emerald-700">{selectedCase.expectedResult}</p></div>
                <div className="flex gap-2 mt-4">
                  <button onClick={() => updateStatus(selectedIdx, "Passed", true)} className={cn("flex-1 h-10 rounded-md flex items-center justify-center gap-1 text-xs font-bold transition", getStatus(selectedCase) === "Passed" ? "bg-emerald-500 text-white" : "border border-slate-200 text-slate-600 hover:bg-emerald-50")}><CheckCircle size={14} weight="bold" /> Pass</button>
                  <button onClick={() => updateStatus(selectedIdx, "Failed", true)} className={cn("flex-1 h-10 rounded-md flex items-center justify-center gap-1 text-xs font-bold transition", getStatus(selectedCase) === "Failed" ? "bg-rose-500 text-white" : "border border-slate-200 text-slate-600 hover:bg-rose-50")}><XCircle size={14} weight="bold" /> Fail</button>
                  <button onClick={() => updateStatus(selectedIdx, "Blocked", true)} className={cn("flex-1 h-10 rounded-md flex items-center justify-center gap-1 text-xs font-bold transition", getStatus(selectedCase) === "Blocked" ? "bg-amber-500 text-white" : "border border-slate-200 text-slate-600 hover:bg-amber-50")}><Warning size={14} weight="bold" /> Block</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
