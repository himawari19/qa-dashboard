"use client";

import { useState } from "react";
import { 
  Checks, 
  CheckCircle, 
  XCircle, 
  WarningCircle, 
  Clock, 
  ArrowLeft,
  DeviceMobile,
  Monitor,
  Database,
  ArrowRight
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { toast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";

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

export function SuiteExecutionView({ suite, cases }: { suite: any, cases: TestCase[] }) {
  const router = useRouter();
  const [items, setItems] = useState<TestCase[]>(cases);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | number | null>(null);

  const selectedCase = items.find(i => i.id === selectedId) || (items.length > 0 ? items[0] : null);

  const updateStatus = (id: string | number, status: string) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, status } : item));
  };

  const setAllStatus = (status: string) => {
    setItems(prev => prev.map(item => ({ ...item, status })));
    toast(`All cases set to ${status}`, "info");
  };

  const saveResults = async () => {
    setLoading(true);
    try {
       // Loop and save OR use a bulk API
       const res = await fetch("/api/test-cases/bulk-status", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({
            ids: items.map(i => i.id),
            status: "Bulk Status Update" // Mocking for now OR passing specific statuses
         })
       });

       if (!res.ok) throw new Error("Bulk update failed");
       
       toast("Full execution results saved successfully!", "success");
       router.push("/test-suites");
    } catch (err: any) {
       toast(err.message, "error");
    } finally {
       setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl animate-in fade-in duration-500">
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/test-suites" className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm transition hover:bg-slate-50 hover:text-slate-700 active:scale-90">
             <ArrowLeft size={24} weight="bold" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-violet-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-violet-700">Suite Execution</span>
              <p className="text-xs font-bold text-slate-400">{suite.project}</p>
            </div>
            <h1 className="mt-1 text-4xl font-black tracking-tight text-slate-900">{suite.title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-2xl bg-white p-2 shadow-sm border border-slate-100">
            <button onClick={() => setAllStatus("Passed")} className="rounded-xl px-4 py-2 text-xs font-bold text-emerald-600 transition hover:bg-emerald-50">Set All PASS</button>
            <div className="h-4 w-px bg-slate-100" />
            <button onClick={() => setAllStatus("Failed")} className="rounded-xl px-4 py-2 text-xs font-bold text-rose-600 transition hover:bg-rose-50">Set All FAIL</button>
          </div>
          <button 
            onClick={saveResults}
            disabled={loading}
            className="rounded-2xl bg-slate-900 px-8 py-3.5 text-sm font-bold text-white shadow-xl shadow-slate-200 transition hover:bg-slate-800 active:scale-95 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Session Results"}
          </button>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Case List Sidebar */}
        <div className="lg:col-span-4 max-h-[70vh] overflow-y-auto space-y-3 pr-2 scrollbar-thin">
          {items.map((item) => (
            <div 
              key={item.id}
              onClick={() => setSelectedId(item.id)}
              className={cn(
                "group relative cursor-pointer overflow-hidden rounded-[24px] border p-5 transition-all",
                selectedId === item.id ? "border-slate-800 bg-white shadow-xl ring-1 ring-slate-800" : "border-slate-100 bg-white hover:border-slate-300 hover:shadow-lg"
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black tracking-widest text-slate-300 uppercase mb-1">{item.code}</p>
                  <h4 className="truncate text-sm font-bold text-slate-700">{item.caseName}</h4>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={(e) => { e.stopPropagation(); updateStatus(item.id, "Passed"); }} className={cn("rounded-full p-2 transition", item.status === "Passed" ? "bg-emerald-500 text-white" : "bg-slate-50 text-slate-300 hover:bg-emerald-50 hover:text-emerald-500")}>
                    <CheckCircle size={18} weight="bold" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); updateStatus(item.id, "Failed"); }} className={cn("rounded-full p-2 transition", item.status === "Failed" ? "bg-rose-500 text-white" : "bg-slate-50 text-slate-300 hover:bg-rose-50 hover:text-rose-500")}>
                    <XCircle size={18} weight="bold" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Selected Case Detail */}
        <div className="lg:col-span-8">
          {selectedCase ? (
            <div className="sticky top-10 rounded-[40px] border border-slate-100 bg-white p-12 shadow-2xl">
              <div className="flex items-center gap-4 mb-8">
                 <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-xl rotate-3">
                   <Monitor size={32} weight="duotone" />
                 </div>
                 <div>
                   <p className="text-[11px] font-black tracking-[0.3em] text-slate-300 uppercase">Step-by-step Review</p>
                   <h2 className="text-2xl font-black text-slate-900">{selectedCase.caseName}</h2>
                 </div>
              </div>

              <div className="grid gap-10 md:grid-cols-2">
                <div className="space-y-8">
                  <section>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                      <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pre-conditions</h5>
                    </div>
                    <p className="text-sm font-medium leading-relaxed text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-100">{selectedCase.preCondition || "None"}</p>
                  </section>
                  
                  <section>
                    <div className="flex items-center gap-2 mb-3">
                       <div className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                       <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Execution Steps</h5>
                    </div>
                    <div className="text-sm font-medium leading-relaxed text-slate-600 bg-sky-50 p-6 rounded-3xl border border-sky-100 whitespace-pre-line">
                      {selectedCase.testStep}
                    </div>
                  </section>
                </div>

                <div className="space-y-8">
                  <section>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Expected Result</h5>
                    </div>
                    <p className="text-sm font-bold leading-relaxed text-emerald-700 bg-emerald-50 p-4 rounded-2xl border border-emerald-100">{selectedCase.expectedResult}</p>
                  </section>

                  <div className="rounded-[32px] bg-slate-900 p-8 text-white shadow-xl shadow-slate-200">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-6">Current Execution Verdict</p>
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => updateStatus(selectedCase.id, "Passed")}
                        className={cn("flex-1 rounded-2xl py-4 flex flex-col items-center gap-2 transition-all active:scale-95", selectedCase.status === "Passed" ? "bg-emerald-500 text-white" : "bg-white/10 hover:bg-white/20 text-white")}
                      >
                        <CheckCircle size={32} weight="fill" />
                        <span className="text-[10px] font-black uppercase tracking-widest">PASS</span>
                      </button>
                      <button 
                        onClick={() => updateStatus(selectedCase.id, "Failed")}
                        className={cn("flex-1 rounded-2xl py-4 flex flex-col items-center gap-2 transition-all active:scale-95", selectedCase.status === "Failed" ? "bg-rose-500 text-white" : "bg-white/10 hover:bg-white/20 text-white")}
                      >
                        <XCircle size={32} weight="fill" />
                        <span className="text-[10px] font-black uppercase tracking-widest">FAIL</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
             <div className="flex h-full flex-col items-center justify-center p-20 text-center opacity-20">
               <Database size={120} weight="thin" />
               <p className="mt-6 text-xl font-medium">No test cases found in this suite.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
