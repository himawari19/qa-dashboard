"use client";

import { useState, useEffect, useCallback } from "react";
import { CheckCircle, XCircle, ArrowLeft, Monitor, Database, Play, FastForward, Keyboard, ChartLineUp } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { toast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/badge";

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

type Suite = {
  project: string;
  title: string;
};

export function SuiteExecutionView({ suite, cases, scenarioId, suiteToken }: { suite: Suite; cases: TestCase[]; scenarioId: string; suiteToken: string }) {
  const router = useRouter();
  const [items, setItems] = useState<TestCase[]>(cases);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | number | null>(cases.length > 0 ? cases[0].id : null);

  const selectedCase = items.find(i => i.id === selectedId);
  const selectedIndex = items.findIndex(i => i.id === selectedId);

  // Stats calculation
  const total = items.length;
  const passed = items.filter(i => i.status === "Success").length;
  const failed = items.filter(i => i.status === "Failed").length;
  const completed = passed + failed;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  const goToNext = useCallback(() => {
    if (selectedIndex < items.length - 1) {
      setSelectedId(items[selectedIndex + 1].id);
    }
  }, [selectedIndex, items]);

  const goToPrev = useCallback(() => {
    if (selectedIndex > 0) {
      setSelectedId(items[selectedIndex - 1].id);
    }
  }, [selectedIndex, items]);

  const updateStatus = useCallback((id: string | number, status: string, advance = false) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, status } : item));
    if (advance) {
      setTimeout(goToNext, 150);
    }
  }, [goToNext]);

  const setAllStatus = (status: string) => {
    setItems(prev => prev.map(item => ({ ...item, status })));
    toast(`All cases set to ${status}`, "info");
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      switch (e.key.toLowerCase()) {
        case "p":
          if (selectedId) updateStatus(selectedId, "Success", true);
          break;
        case "f":
          if (selectedId) updateStatus(selectedId, "Failed", true);
          break;
        case "arrowdown":
        case "j":
          e.preventDefault();
          goToNext();
          break;
        case "arrowup":
        case "k":
          e.preventDefault();
          goToPrev();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedId, updateStatus, goToNext, goToPrev]);

  const saveResults = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/test-cases", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: items }),
      });

      if (!res.ok) throw new Error("Failed to save execution results");
        
      toast("Execution results synced successfully!", "success");
      router.push("/test-suites");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Failed to save results", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Interactive Header */}
      <div className="mb-8 rounded-md bg-white p-2 shadow-sm dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between px-6 py-5">
          <div className="flex items-center gap-5">
            <Link href="/test-execution" className="flex h-11 w-11 items-center justify-center rounded-md bg-slate-50 text-slate-400 transition hover:bg-sky-600 hover:text-white active:scale-90 dark:bg-slate-800">
               <ArrowLeft size={20} weight="bold" />
            </Link>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Link href="/test-suites" className="text-xs font-semibold text-sky-700 hover:text-sky-600 uppercase tracking-widest transition-colors">Test Suites</Link>
                <div className="h-1 w-1 rounded-md bg-slate-300" />
                <span className="text-xs font-semibold tracking-widest text-slate-500 uppercase">{suite.project}</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white leading-none">{suite.title}</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link 
              href={`/test-cases/detail/${suiteToken}`}
              className="inline-flex h-11 items-center gap-2 rounded-md border border-sky-200 bg-white px-5 text-sm font-semibold text-sky-700 transition hover:bg-sky-50 hover:border-sky-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
            >
              Add Test Case
            </Link>
            <div className="h-6 w-px bg-slate-200 mx-2 dark:bg-slate-700" />
            <button 
              onClick={saveResults}
              disabled={loading || total === 0}
              className="group relative inline-flex h-11 items-center gap-2 overflow-hidden rounded-md bg-slate-900 px-6 text-sm font-semibold text-white shadow-sm transition-all hover:bg-slate-800 active:scale-95 disabled:opacity-30 dark:bg-white dark:text-slate-900"
            >
              <CheckCircle size={18} weight="fill" className={cn(total > 0 ? "text-emerald-400" : "text-slate-400")} />
              {loading ? "Syncing..." : "Finish Session"}
            </button>
          </div>
        </div>
        
        {/* Progress bar only if cases exist */}
        {total > 0 && (
          <div className="px-6 pb-2">
             <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-md overflow-hidden">
                <div style={{ width: `${progress}%` }} className="bg-sky-600 h-full transition-all duration-1000" />
             </div>
             <div className="flex justify-between mt-2 mb-2">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Progress: {progress}%</div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{completed} of {total} Cases</div>
             </div>
          </div>
        )}
      </div>

      {total === 0 ? (
        /* Clean Full-width Empty State */
        <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-md border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900 shadow-sm">
          <div className="h-20 w-20 rounded-md bg-slate-50 flex items-center justify-center text-slate-400 mb-6 dark:bg-slate-800">
            <Database size={40} weight="duotone" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Suite is Empty</h3>
          <p className="mt-3 text-slate-600 max-w-md mx-auto text-base">
            This test suite doesn't have any scenarios yet. To start the execution process, you need to add at least one test case.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
            <Link href={`/test-cases/detail/${suiteToken}`} className="inline-flex h-11 items-center gap-2 rounded-md bg-sky-600 px-6 font-semibold text-white shadow-sm transition duration-200 hover:bg-sky-700 active:scale-95">
              Add Test Case <FastForward size={16} weight="bold" />
            </Link>
            <Link href="/test-execution" className="inline-flex h-11 items-center gap-2 rounded-md border border-slate-200 bg-white px-6 font-semibold text-slate-600 shadow-sm transition duration-200 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300">
              Go Back
            </Link>
          </div>
        </div>
      ) : (
        /* Normal Grid with Sidebar */
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Left Sidebar: Case List */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500">Scenarios ({items.length})</h3>
              <div className="flex items-center gap-1.5">
                 <button onClick={() => setAllStatus("Success")} className="p-1.5 rounded-md bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-sm" title="Mark All Pass">
                   <CheckCircle size={14} weight="bold" />
                 </button>
                 <button onClick={() => setAllStatus("Failed")} className="p-1.5 rounded-md bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all shadow-sm" title="Mark All Fail">
                   <XCircle size={14} weight="bold" />
                 </button>
              </div>
            </div>

            <div className="max-h-[65vh] overflow-y-auto space-y-2 pr-2 scrollbar-thin">
              {items.map((item) => (
                <div 
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  className={cn(
                    "group relative cursor-pointer overflow-hidden rounded-md border p-3.5 transition-all duration-200",
                    selectedId === item.id 
                      ? "border-sky-600 bg-sky-50/50 ring-1 ring-sky-600 shadow-sm dark:bg-sky-950/20" 
                      : "border-slate-200 bg-white hover:border-sky-300 dark:border-slate-800 dark:bg-slate-900"
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn(
                          "h-2 w-2 rounded-md",
                          item.status === "Success" ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : 
                          item.status === "Failed" ? "bg-rose-500 shadow-[0_0_8px_#f43f5e]" : 
                          "bg-slate-300"
                        )} />
                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">{item.code}</p>
                      </div>
                      <h4 className={cn(
                        "truncate text-sm font-semibold transition-colors",
                        selectedId === item.id ? "text-sky-900 dark:text-white" : "text-slate-700 dark:text-slate-300"
                      )}>{item.caseName}</h4>
                    </div>
                    {item.status && (
                      <div className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-md text-white shadow-sm transition-transform animate-in zoom-in",
                        item.status === "Success" ? "bg-emerald-500" : "bg-rose-500"
                      )}>
                        {item.status === "Success" ? <CheckCircle size={14} weight="bold" /> : <XCircle size={14} weight="bold" />}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-md bg-slate-50 p-4 border border-slate-200 dark:bg-slate-800/50 dark:border-slate-700">
               <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 uppercase mb-3">
                 <Keyboard size={16} weight="bold" />
                 Shortcuts
               </div>
               <div className="grid grid-cols-2 gap-3 text-xs font-medium text-slate-500 dark:text-slate-400">
                 <div className="flex items-center gap-2"><span className="bg-white px-1.5 py-0.5 rounded border border-slate-200 dark:bg-slate-800 dark:border-slate-700 font-mono text-slate-700 dark:text-slate-300">P</span> Pass</div>
                 <div className="flex items-center gap-2"><span className="bg-white px-1.5 py-0.5 rounded border border-slate-200 dark:bg-slate-800 dark:border-slate-700 font-mono text-slate-700 dark:text-slate-300">F</span> Fail</div>
                 <div className="flex items-center gap-2"><span className="bg-white px-1.5 py-0.5 rounded border border-slate-200 dark:bg-slate-800 dark:border-slate-700 font-mono text-slate-700 dark:text-slate-300">↓</span> Next</div>
                 <div className="flex items-center gap-2"><span className="bg-white px-1.5 py-0.5 rounded border border-slate-200 dark:bg-slate-800 dark:border-slate-700 font-mono text-slate-700 dark:text-slate-300">↑</span> Prev</div>
               </div>
            </div>
          </div>

          {/* Right Content: Case Details */}
          <div className="lg:col-span-8">
            {selectedCase && (
              <div className="sticky top-6 flex flex-col gap-5">
                <div className="rounded-md border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-6 border-b border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-center gap-4">
                       <div className="flex h-12 w-12 items-center justify-center rounded-md bg-sky-600 text-white shadow-sm animate-pulse">
                         <Play size={24} weight="fill" />
                       </div>
                       <div>
                         <p className="text-xs font-semibold tracking-widest text-slate-500 uppercase mb-1">Execution Mode</p>
                         <h2 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">{selectedCase.caseName}</h2>
                       </div>
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0">
                      <button 
                        onClick={() => updateStatus(selectedCase.id, "Success", true)}
                        className={cn(
                          "flex h-11 w-24 items-center justify-center gap-2 rounded-md font-semibold text-sm transition-all active:scale-95",
                          selectedCase.status === "Success" ? "bg-emerald-500 text-white shadow-sm" : "bg-emerald-50 hover:bg-emerald-500 hover:text-white text-emerald-600 border border-emerald-100"
                        )}
                      >
                        <CheckCircle size={18} weight="bold" /> PASS
                      </button>
                      <button 
                        onClick={() => updateStatus(selectedCase.id, "Failed", true)}
                        className={cn(
                          "flex h-11 w-24 items-center justify-center gap-2 rounded-md font-semibold text-sm transition-all active:scale-95",
                          selectedCase.status === "Failed" ? "bg-rose-500 text-white shadow-sm" : "bg-rose-50 hover:bg-rose-500 hover:text-white text-rose-600 border border-rose-100"
                        )}
                      >
                        <XCircle size={18} weight="bold" /> FAIL
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-8 md:grid-cols-2">
                    <div className="space-y-6">
                      <section>
                        <div className="flex items-center gap-2 mb-2.5">
                          <div className="h-1.5 w-1.5 rounded-md bg-slate-400" />
                          <h5 className="text-xs font-semibold uppercase tracking-widest text-slate-500">Pre-conditions</h5>
                        </div>
                        <div className="text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-md border border-slate-200 dark:border-slate-700">
                          {selectedCase.preCondition || "No specific preconditions."}
                        </div>
                      </section>
                      
                      <section>
                        <div className="flex items-center gap-2 mb-2.5">
                           <div className="h-1.5 w-1.5 rounded-md bg-sky-500" />
                           <h5 className="text-xs font-semibold uppercase tracking-widest text-sky-600">Steps to Reproduce</h5>
                        </div>
                        <div className="text-sm font-medium leading-relaxed text-slate-700 dark:text-slate-200 bg-sky-50/50 dark:bg-sky-950/10 p-5 rounded-md border border-sky-100 dark:border-sky-900/30 whitespace-pre-line shadow-inner">
                          {selectedCase.testStep}
                        </div>
                      </section>
                    </div>

                    <div className="space-y-6">
                      <section>
                        <div className="flex items-center gap-2 mb-2.5">
                          <div className="h-1.5 w-1.5 rounded-md bg-emerald-500" />
                          <h5 className="text-xs font-semibold uppercase tracking-widest text-emerald-600">Expected Outcome</h5>
                        </div>
                        <div className="text-sm font-medium leading-relaxed text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/10 p-5 rounded-md border border-emerald-100 dark:border-emerald-900/30">
                          {selectedCase.expectedResult}
                        </div>
                      </section>

                      <div className="rounded-md bg-slate-900 p-6 text-white shadow-sm dark:bg-black border border-slate-800">
                        <div className="flex items-center justify-between mb-5">
                          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Execution Verdict</p>
                          {selectedCase.status && <Badge value={selectedCase.status} />}
                        </div>
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => updateStatus(selectedCase.id, "Success", true)}
                            className={cn(
                              "flex-1 group/btn h-20 rounded-md flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95",
                              selectedCase.status === "Success" ? "bg-emerald-500 text-white shadow-sm" : "bg-slate-800 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400 border border-slate-700"
                            )}
                          >
                            <CheckCircle size={24} weight={selectedCase.status === "Success" ? "fill" : "bold"} className="transition-transform group-hover/btn:scale-110" />
                            <span className="text-xs font-semibold uppercase tracking-widest">Mark Pass</span>
                          </button>
                          <button 
                            onClick={() => updateStatus(selectedCase.id, "Failed", true)}
                            className={cn(
                              "flex-1 group/btn h-20 rounded-md flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95",
                              selectedCase.status === "Failed" ? "bg-rose-500 text-white shadow-sm" : "bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700"
                            )}
                          >
                            <XCircle size={24} weight={selectedCase.status === "Failed" ? "fill" : "bold"} className="transition-transform group-hover/btn:scale-110" />
                            <span className="text-xs font-semibold uppercase tracking-widest">Mark Fail</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Navigation Helpers */}
                <div className="flex items-center justify-between px-4 py-2">
                   <button onClick={goToPrev} disabled={selectedIndex === 0} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-sky-600 disabled:opacity-30 transition-colors">
                     <ArrowLeft size={16} weight="bold" /> PREVIOUS CASE
                   </button>
                   <button onClick={goToNext} disabled={selectedIndex === items.length - 1} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-sky-600 disabled:opacity-30 transition-colors">
                     NEXT CASE <FastForward size={16} weight="bold" />
                   </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}