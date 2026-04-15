"use client";

import React from "react";
import { Check, X, ArrowRight, ArrowLeft, Trophy } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export function TestRunnerUI({ scenarioId, initialCases }: { scenarioId: string, initialCases: any[] }) {
  const [index, setIndex] = React.useState(0);
  const [results, setResults] = React.useState<Record<number, string>>({});
  const [isFinished, setIsFinished] = React.useState(false);

  const currentCase = initialCases[index];

  const updateStatus = (status: "passed" | "failed") => {
    setResults({ ...results, [currentCase.id]: status });
    if (index < initialCases.length - 1) {
      setIndex(index + 1);
    } else {
      setIsFinished(true);
    }
  };

  if (initialCases.length === 0) return <div>No test cases in this scenario.</div>;

  if (isFinished) {
    return (
      <div className="rounded-[40px] border border-emerald-100 bg-emerald-50 p-12 text-center shadow-xl animate-in zoom-in-95">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg">
          <Trophy size={40} weight="fill" />
        </div>
        <h2 className="text-3xl font-black text-slate-900">Execution Complete!</h2>
        <p className="mt-2 text-slate-600">You have completed all {initialCases.length} steps in this scenario.</p>
        
        <div className="mt-8 grid grid-cols-2 gap-4 max-w-sm mx-auto">
           <div className="bg-white p-4 rounded-2xl border border-emerald-200">
              <span className="block text-2xl font-black text-emerald-600">{Object.values(results).filter(v => v === 'passed').length}</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Passed</span>
           </div>
           <div className="bg-white p-4 rounded-2xl border border-rose-200">
              <span className="block text-2xl font-black text-rose-600">{Object.values(results).filter(v => v === 'failed').length}</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Failed</span>
           </div>
        </div>
        
        <button 
          onClick={() => window.history.back()}
          className="mt-10 bg-slate-900 text-white px-8 py-3 rounded-full text-sm font-black uppercase tracking-widest hover:bg-slate-800 transition"
        >
          Return to List
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center px-2">
         <span className="text-xs font-bold text-slate-400">Step {index + 1} of {initialCases.length}</span>
         <div className="h-2 w-48 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-sky-500 transition-all duration-300" 
              style={{ width: `${((index + 1) / initialCases.length) * 100}%` }}
            />
         </div>
      </div>

      <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-2 h-full bg-sky-500" />
        
        <div className="space-y-8">
           <section>
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-600">Test Step</label>
              <p className="mt-2 text-xl font-bold text-slate-900 leading-relaxed">{currentCase.testStep}</p>
           </section>

           <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-100">
              <section>
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Expected Result</label>
                <p className="mt-2 text-sm font-semibold text-slate-700">{currentCase.expectedResult}</p>
              </section>
              <section>
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Status</label>
                <div className="mt-2">
                   {results[currentCase.id] ? (
                     <span className={cn(
                       "inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase",
                       results[currentCase.id] === 'passed' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                     )}>
                       {results[currentCase.id]}
                     </span>
                   ) : (
                     <span className="text-xs text-slate-300 italic">Waiting...</span>
                   )}
                </div>
              </section>
           </div>
        </div>
      </div>

      <div className="flex justify-between gap-4">
        <button 
          onClick={() => setIndex(Math.max(0, index - 1))}
          disabled={index === 0}
          className="flex items-center gap-2 bg-white border border-slate-200 px-6 py-4 rounded-2xl text-sm font-bold text-slate-400 hover:bg-slate-50 disabled:opacity-30"
        >
          <ArrowLeft size={18} />
          Previous
        </button>

        <div className="flex gap-4">
           <button 
             onClick={() => updateStatus("failed")}
             className="flex items-center gap-3 bg-rose-500 text-white px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-rose-600 shadow-lg shadow-rose-200 transition active:scale-95"
           >
             <X size={20} weight="bold" />
             Fail (Esc)
           </button>
           <button 
             onClick={() => updateStatus("passed")}
             className="flex items-center gap-3 bg-emerald-500 text-white px-10 py-4 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-emerald-600 shadow-lg shadow-emerald-200 transition active:scale-95"
           >
             <Check size={20} weight="bold" />
             Pass (Space)
           </button>
        </div>
      </div>
    </div>
  );
}
