"use client";

import { useState, useEffect } from "react";
import { Check, X, ArrowLeft, Trophy, CheckCircle, XCircle } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

type TestCase = {
  id: number;
  testStep: string;
  expectedResult: string;
  caseName?: string;
  preCondition?: string;
};

export function TestRunnerUI({ initialCases }: { scenarioId: string; initialCases: TestCase[] }) {
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<Record<number, string>>({});
  const [isFinished, setIsFinished] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Keyboard shortcuts: Space = Pass, Esc = Fail
  useEffect(() => {
    if (isFinished) return;
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === "Space") { e.preventDefault(); updateStatus("Success"); }
      if (e.code === "Escape") { e.preventDefault(); updateStatus("Failed"); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, isFinished, results]);

  async function bulkUpdate(status: "Success" | "Failed") {
    setBulkLoading(true);
    try {
      const ids = initialCases.map((c) => c.id);
      await fetch("/api/test-cases/bulk-status", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ids, status }),
      });
      const newResults: Record<number, string> = {};
      for (const c of initialCases) newResults[c.id] = status;
      setResults(newResults);
      setIsFinished(true);
    } finally {
      setBulkLoading(false);
    }
  }

  const currentCase = initialCases[index];

  function updateStatus(status: string) {
    if (!currentCase) return;
    const next = { ...results, [currentCase.id]: status };
    setResults(next);
    if (index < initialCases.length - 1) {
      setIndex(index + 1);
    } else {
      setIsFinished(true);
    }
  }

  if (initialCases.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-12 text-center text-sm text-slate-400">
        No test cases in this scenario.
      </div>
    );
  }

  if (isFinished) {
    const passed = Object.values(results).filter(v => v === "Success").length;
    const failed = Object.values(results).filter(v => v === "Failed").length;
    return (
      <div className="rounded-[40px] border border-emerald-100 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 p-12 text-center shadow-xl animate-in zoom-in-95">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg">
          <Trophy size={40} weight="fill" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100">Execution Complete!</h2>
        <p className="mt-2 text-slate-600 dark:text-slate-400">Completed all {initialCases.length} test cases.</p>
        <div className="mt-8 grid grid-cols-2 gap-4 max-w-sm mx-auto">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800">
            <span className="block text-2xl font-black text-emerald-600">{passed}</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Passed</span>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-rose-200 dark:border-rose-800">
            <span className="block text-2xl font-black text-rose-600">{failed}</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Failed</span>
          </div>
        </div>
        <button
          onClick={() => window.history.back()}
          className="mt-10 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-8 py-3 rounded-full text-sm font-black uppercase tracking-widest hover:opacity-90 transition"
        >
          Return to List
        </button>
      </div>
    );
  }

  const progress = ((index + 1) / initialCases.length) * 100;

  return (
    <div className="space-y-5">
      {/* Bulk actions */}
      <div className="flex items-center justify-between rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 py-3 shadow-sm">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Bulk Actions</span>
        <div className="flex gap-3">
          <button type="button" disabled={bulkLoading} onClick={() => void bulkUpdate("Success")}
            className="flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-xs font-black uppercase tracking-widest text-white shadow-sm transition hover:bg-emerald-600 disabled:opacity-60">
            <CheckCircle size={14} weight="bold" /> Pass All
          </button>
          <button type="button" disabled={bulkLoading} onClick={() => void bulkUpdate("Failed")}
            className="flex items-center gap-2 rounded-full bg-rose-500 px-4 py-2 text-xs font-black uppercase tracking-widest text-white shadow-sm transition hover:bg-rose-600 disabled:opacity-60">
            <XCircle size={14} weight="bold" /> Fail All
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center justify-between gap-4 px-1">
        <span className="text-xs font-bold text-slate-400 dark:text-slate-500">Step {index + 1} of {initialCases.length}</span>
        <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div className="h-full rounded-full bg-sky-500 transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <span className="text-xs font-bold text-sky-600 dark:text-sky-400">{Math.round(progress)}%</span>
      </div>

      {/* Test case card */}
      <div className="rounded-[32px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-8 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-sky-500 to-blue-600 rounded-l-[32px]" />
        <div className="space-y-6 pl-2">
          {currentCase.preCondition && (
            <section>
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Pre-condition</label>
              <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">{currentCase.preCondition}</p>
            </section>
          )}
          <section>
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-600 dark:text-sky-400">Test Step</label>
            <p className="mt-2 text-xl font-bold text-slate-900 dark:text-slate-100 leading-relaxed">{currentCase.testStep}</p>
          </section>
          <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-100 dark:border-slate-700">
            <section>
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Expected Result</label>
              <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-300">{currentCase.expectedResult}</p>
            </section>
            <section>
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Status</label>
              <div className="mt-2">
                {results[currentCase.id] ? (
                  <span className={cn("inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase",
                    results[currentCase.id] === "Success" ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400" : "bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-400")}>
                    {results[currentCase.id]}
                  </span>
                ) : (
                  <span className="text-xs text-slate-300 dark:text-slate-600 italic">Waiting...</span>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between gap-4">
        <button onClick={() => setIndex(Math.max(0, index - 1))} disabled={index === 0}
          className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-6 py-4 rounded-2xl text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-30 transition">
          <ArrowLeft size={18} /> Previous
        </button>
        <div className="flex gap-3">
          <button onClick={() => updateStatus("Failed")}
            className="flex items-center gap-2 bg-rose-500 text-white px-7 py-4 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-rose-600 shadow-lg shadow-rose-200/50 dark:shadow-rose-900/30 transition active:scale-95">
            <X size={18} weight="bold" /> Fail <kbd className="ml-1 rounded bg-rose-400/40 px-1.5 py-0.5 text-[9px]">Esc</kbd>
          </button>
          <button onClick={() => updateStatus("Success")}
            className="flex items-center gap-2 bg-emerald-500 text-white px-9 py-4 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-emerald-600 shadow-lg shadow-emerald-200/50 dark:shadow-emerald-900/30 transition active:scale-95">
            <Check size={18} weight="bold" /> Pass <kbd className="ml-1 rounded bg-emerald-400/40 px-1.5 py-0.5 text-[9px]">Space</kbd>
          </button>
        </div>
      </div>
    </div>
  );
}
