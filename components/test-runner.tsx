"use client";

import { useState } from "react";
import { X, CheckCircle, XCircle, SkipForward, CaretLeft, CaretRight, FloppyDisk } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/badge";

type TestRow = Record<string, unknown>;

export function TestRunner({
  scenario,
  rows,
  onClose,
  onComplete
}: {
  scenario: TestRow;
  rows: TestRow[];
  onClose: () => void;
  onComplete: (updatedRows: TestRow[]) => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [testStates, setTestStates] = useState<TestRow[]>(() => [...rows]);

  const currentCase = testStates[currentIndex];

  const handleUpdateCurrent = (status: string, actualResult?: string) => {
    const newStates = [...testStates];
    newStates[currentIndex] = {
      ...newStates[currentIndex],
      status,
      ...(actualResult !== undefined && { actualResult })
    };
    setTestStates(newStates);

    if (currentIndex < rows.length - 1) {
      setCurrentIndex(curr => curr + 1);
    }
  };

  const handleFinish = () => {
    onComplete(testStates);
  };

  const isDone = currentIndex === rows.length - 1 && testStates[currentIndex].status !== "Pending" && testStates[currentIndex].status !== undefined;

  const passedCount = testStates.filter(r => r.status === "Success").length;
  const failedCount = testStates.filter(r => r.status === "Failed").length;
  const pendingCount = testStates.filter(r => r.status !== "Success" && r.status !== "Failed").length;

  return (
    <div className="fixed inset-0 z-[100] flex animate-in fade-in zoom-in-95 duration-200">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative m-auto flex h-[82vh] w-[88vw] max-w-5xl flex-col overflow-hidden rounded-[24px] bg-[#f8fafc] shadow-2xl transition-all">
        
        {/* Header */}
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
              <CheckCircle size={28} weight="fill" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">Test Execution Mode</h2>
              <p className="text-sm font-semibold text-slate-500">{String(scenario.moduleName ?? "")}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex gap-4 text-sm font-bold">
              <span className="text-emerald-600 flex items-center gap-1"><CheckCircle weight="fill" size={16}/> {passedCount} Pass</span>
              <span className="text-rose-600 flex items-center gap-1"><XCircle weight="fill" size={16}/> {failedCount} Fail</span>
              <span className="text-slate-400 flex items-center gap-1"><SkipForward weight="fill" size={16}/> {pendingCount} Pending</span>
            </div>
            <button onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition">
              <X size={20} weight="bold" />
            </button>
          </div>
        </header>

        {/* Content */}
        {rows.length === 0 ? (
          <div className="flex flex-1 items-center justify-center text-slate-500 font-semibold">No test cases to execute.</div>
        ) : (
          <div className="flex flex-1 overflow-hidden">
            
            {/* Sidebar Flow */}
            <div className="w-[300px] flex-shrink-0 border-r border-slate-200 bg-white overflow-y-auto">
              <div className="p-4 space-y-2">
                {testStates.map((row, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={cn(
                      "w-full text-left p-3 rounded-2xl border transition-all text-sm",
                      currentIndex === idx ? "bg-sky-50 border-sky-300 shadow-sm" : "border-transparent hover:bg-slate-50",
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={cn("font-bold", currentIndex === idx ? "text-sky-800" : "text-slate-700")}>
                        {String(row.tcId || `TC-${idx+1}`)}
                      </span>
                      {row.status === "Success" && <CheckCircle size={16} weight="fill" className="text-emerald-500" />}
                      {row.status === "Failed" && <XCircle size={16} weight="fill" className="text-rose-500" />}
                      {row.status === "Pending" && <div className="h-2 w-2 rounded-full bg-slate-300" />}
                    </div>
                    <p className="line-clamp-2 text-xs font-medium text-slate-500">{String(row.caseName || "Unnamed Case")}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Execution Panel */}
            <div className="flex-1 overflow-y-auto p-8 relative pb-32">
              <div className="mx-auto max-w-3xl space-y-8">
                
                <div className="flex items-center justify-between">
                  <div className="px-3 py-1 rounded-full border border-slate-200 text-xs font-bold text-slate-500 bg-white">
                    Step {currentIndex + 1} of {rows.length}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setCurrentIndex(c => Math.max(0, c-1))} disabled={currentIndex===0} className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50"><CaretLeft size={16} weight="bold"/></button>
                    <button onClick={() => setCurrentIndex(c => Math.min(rows.length-1, c+1))} disabled={currentIndex===rows.length-1} className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50"><CaretRight size={16} weight="bold"/></button>
                  </div>
                </div>

                <div>
                  <h3 className="text-3xl font-extrabold text-slate-900 mb-2">{String(currentCase.caseName || "No Case Name")}</h3>
                  <div className="flex items-center gap-3">
                    <Badge value={String(currentCase.typeCase || "Positive")} />
                    <span className="text-sm font-semibold text-slate-500">ID: {String(currentCase.tcId || "-")}</span>
                  </div>
                </div>

                {!!currentCase.preCondition && (
                  <div className="rounded-3xl border border-slate-200 bg-white p-6">
                    <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Pre-Conditions</div>
                    <div className="prose prose-sm prose-slate max-w-none font-medium whitespace-pre-wrap">{String(currentCase.preCondition)}</div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-6">
                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Test Steps</div>
                    <div className="prose prose-sm prose-slate max-w-none font-medium whitespace-pre-wrap">{String(currentCase.testStep)}</div>
                  </div>
                  <div className="rounded-3xl border border-sky-100 bg-sky-50/50 p-6 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-sky-100 rounded-bl-full -z-10 opacity-50" />
                    <div className="text-xs font-bold uppercase tracking-widest text-sky-600/80 mb-3">Expected Result</div>
                    <div className="prose prose-sm prose-slate max-w-none font-semibold text-slate-900 whitespace-pre-wrap">{String(currentCase.expectedResult)}</div>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Actual Result (Optional Notes)</div>
                  <textarea 
                    className="w-full min-h-[120px] rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium outline-none transition focus:border-sky-300 focus:bg-white"
                    placeholder="Enter what actually happened during the test..."
                    defaultValue={String(currentCase.actualResult || "")}
                    onChange={(e) => {
                      const newStates = [...testStates];
                      newStates[currentIndex].actualResult = e.target.value;
                      setTestStates(newStates);
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Action Footer Always visible */}
            <div className="absolute bottom-0 left-[300px] right-0 flex items-center justify-between border-t border-slate-200 bg-white/80 backdrop-blur-md px-8 py-5">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => handleUpdateCurrent("Success")}
                  className="group flex h-14 items-center gap-3 rounded-full bg-emerald-50 pl-2 pr-6 font-bold text-emerald-700 transition hover:bg-emerald-100 active:scale-95"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm transition group-hover:scale-105"><CheckCircle size={20} weight="bold" /></div>
                  PASS
                </button>
                <button 
                  onClick={() => handleUpdateCurrent("Failed")}
                  className="group flex h-14 items-center gap-3 rounded-full bg-rose-50 pl-2 pr-6 font-bold text-rose-700 transition hover:bg-rose-100 active:scale-95"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-500 text-white shadow-sm transition group-hover:scale-105"><XCircle size={20} weight="bold" /></div>
                  FAIL
                </button>
                <button 
                  onClick={() => handleUpdateCurrent("Pending")}
                  className="group flex h-14 items-center gap-3 rounded-full bg-slate-100 pl-2 pr-6 font-bold text-slate-600 transition hover:bg-slate-200 active:scale-95"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-300 text-white shadow-sm transition group-hover:scale-105"><SkipForward size={20} weight="bold" /></div>
                  SKIP
                </button>
              </div>

              {(isDone || currentIndex === rows.length - 1) && (
                <button 
                  onClick={handleFinish}
                  className="flex h-14 items-center gap-3 rounded-full bg-sky-700 px-8 font-bold text-white shadow-lg transition hover:bg-sky-800 active:scale-95"
                >
                  <FloppyDisk size={20} weight="bold" />
                  Save Final Results
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
