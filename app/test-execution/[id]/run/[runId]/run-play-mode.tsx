"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  CheckCircle, XCircle, Warning, CaretLeft, CaretRight, Play, X,
  Timer, ArrowsIn, ArrowsOut
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

type CaseItem = {
  verdictId: number;
  testCaseId: number;
  tcId: string;
  caseName: string;
  preCondition: string;
  testStep: string;
  expectedResult: string;
  actualResult: string;
  verdict: string;
  evidence: string;
  duration: number;
  priority: string;
  typeCase: string;
};

export function RunPlayMode({
  items: initialItems,
  runId,
  suiteTitle,
  onClose,
  onSaveVerdict,
}: {
  items: CaseItem[];
  runId: number;
  suiteTitle: string;
  onClose: (updated: CaseItem[]) => void;
  onSaveVerdict: (item: CaseItem) => Promise<void>;
}) {
  const [items, setItems] = useState<CaseItem[]>(initialItems);
  const [index, setIndex] = useState(() => {
    // Start at first pending case
    const firstPending = initialItems.findIndex(i => i.verdict === "Pending");
    return firstPending >= 0 ? firstPending : 0;
  });
  const [fullScreen, setFullScreen] = useState(false);
  const [startTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [caseStart, setCaseStart] = useState(Date.now());
  const currentCase = items[index];

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const updateStatus = useCallback((status: string) => {
    const caseDuration = Math.floor((Date.now() - caseStart) / 1000);
    setItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], verdict: status, duration: updated[index].duration + caseDuration };
      // Auto-save immediately
      onSaveVerdict(updated[index]);
      return updated;
    });
    // Advance to next pending
    setTimeout(() => {
      setItems(current => {
        const nextPending = current.findIndex((it, i) => i > index && it.verdict === "Pending");
        if (nextPending >= 0) {
          setIndex(nextPending);
        } else if (index < current.length - 1) {
          setIndex(index + 1);
        }
        return current;
      });
      setCaseStart(Date.now());
    }, 200);
  }, [index, caseStart, onSaveVerdict]);

  const updateActual = useCallback((val: string) => {
    setItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], actualResult: val };
      // Debounce save for text input
      return updated;
    });
  }, [index]);

  // Save actual result on blur
  const handleActualBlur = () => {
    onSaveVerdict(items[index]);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeys = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "p") updateStatus("Passed");
      if (e.key === "f") updateStatus("Failed");
      if (e.key === "b") updateStatus("Blocked");
      if (e.key === "ArrowRight" || e.key === "j") { setIndex(i => Math.min(items.length - 1, i + 1)); setCaseStart(Date.now()); }
      if (e.key === "ArrowLeft" || e.key === "k") { setIndex(i => Math.max(0, i - 1)); setCaseStart(Date.now()); }
      if (e.key === "Escape") onClose(items);
    };
    window.addEventListener("keydown", handleKeys);
    return () => window.removeEventListener("keydown", handleKeys);
  }, [index, items, updateStatus, onClose]);

  const completed = items.filter(i => i.verdict !== "Pending").length;
  const progress = Math.round((completed / items.length) * 100);

  return (
    <div className={cn(
      "fixed inset-0 z-[100] flex flex-col bg-slate-900 text-white transition-all duration-500",
      fullScreen ? "p-0" : "p-4 md:p-8"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-500/20">
            <Play size={20} weight="fill" />
          </div>
          <div>
            <h2 className="text-lg font-black leading-none">{suiteTitle}</h2>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mt-1">
              Focus Mode · {index + 1} of {items.length} · {completed} done
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-2 text-slate-400">
            <Timer size={16} />
            <span className="text-sm font-mono font-bold">{formatTime(elapsed)}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setFullScreen(!fullScreen)} className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-white/10 transition">
              {fullScreen ? <ArrowsIn size={20} /> : <ArrowsOut size={20} />}
            </button>
            <button onClick={() => onClose(items)} className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-rose-500 transition text-rose-400 hover:text-white">
              <X size={20} weight="bold" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full gap-6">
        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>

        {/* Mini case dots */}
        <div className="flex flex-wrap gap-1 justify-center">
          {items.map((item, i) => (
            <button
              key={item.testCaseId}
              onClick={() => { setIndex(i); setCaseStart(Date.now()); }}
              className={cn(
                "h-2.5 w-2.5 rounded-full transition-all",
                i === index ? "scale-150 ring-2 ring-white/50" : "",
                item.verdict === "Passed" ? "bg-emerald-500"
                : item.verdict === "Failed" ? "bg-rose-500"
                : item.verdict === "Blocked" ? "bg-amber-500"
                : "bg-white/20"
              )}
              title={`${item.tcId} - ${item.caseName}`}
            />
          ))}
        </div>

        {/* Card */}
        <div className="flex-1 rounded-3xl bg-white/5 border border-white/10 p-8 flex flex-col gap-8 shadow-2xl overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[11px] font-black uppercase tracking-widest border border-blue-500/30">
                {currentCase.tcId}
              </span>
              <h1 className="text-2xl md:text-3xl font-black mt-4 leading-tight">{currentCase.caseName}</h1>
            </div>
            {currentCase.verdict !== "Pending" && (
              <span className={cn(
                "px-3 py-1 rounded-full text-xs font-bold",
                currentCase.verdict === "Passed" ? "bg-emerald-500/20 text-emerald-400"
                : currentCase.verdict === "Failed" ? "bg-rose-500/20 text-rose-400"
                : "bg-amber-500/20 text-amber-400"
              )}>
                {currentCase.verdict}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 overflow-y-auto pr-2 scrollbar-thin flex-1">
            <div className="space-y-6">
              <section>
                <h5 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-3 flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-500" /> Test Steps
                </h5>
                <div className="text-base font-medium leading-relaxed text-slate-200 whitespace-pre-line">
                  {currentCase.testStep}
                </div>
              </section>
              {currentCase.preCondition && (
                <section>
                  <h5 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-2">Pre-Condition</h5>
                  <p className="text-sm text-slate-400 italic">{currentCase.preCondition}</p>
                </section>
              )}
            </div>

            <div className="space-y-6">
              <section>
                <h5 className="text-xs font-black uppercase tracking-[0.2em] text-emerald-500 mb-3 flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Expected Result
                </h5>
                <div className="text-base font-bold text-emerald-400/90 leading-relaxed">
                  {currentCase.expectedResult}
                </div>
              </section>

              <section>
                <h5 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-2">Actual Result / Notes</h5>
                <textarea
                  value={currentCase.actualResult || ""}
                  onChange={(e) => updateActual(e.target.value)}
                  onBlur={handleActualBlur}
                  placeholder="Type findings here..."
                  className="w-full h-20 rounded-2xl bg-white/5 border border-white/10 p-4 text-sm outline-none focus:border-blue-500/50 transition resize-none"
                />
              </section>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-4 pb-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setIndex(Math.max(0, index - 1)); setCaseStart(Date.now()); }}
              disabled={index === 0}
              className="h-14 w-14 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition disabled:opacity-20"
            >
              <CaretLeft size={24} />
            </button>
            <button
              onClick={() => { setIndex(Math.min(items.length - 1, index + 1)); setCaseStart(Date.now()); }}
              disabled={index === items.length - 1}
              className="h-14 w-14 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition disabled:opacity-20"
            >
              <CaretRight size={24} />
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center gap-3">
            <button
              onClick={() => updateStatus("Passed")}
              className={cn(
                "flex-1 h-16 rounded-2xl flex items-center justify-center gap-3 text-lg font-black transition-all active:scale-95",
                currentCase.verdict === "Passed" ? "bg-emerald-500 text-white" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20"
              )}
            >
              <CheckCircle size={24} weight="bold" /> PASS
            </button>
            <button
              onClick={() => updateStatus("Failed")}
              className={cn(
                "flex-1 h-16 rounded-2xl flex items-center justify-center gap-3 text-lg font-black transition-all active:scale-95",
                currentCase.verdict === "Failed" ? "bg-rose-500 text-white" : "bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20"
              )}
            >
              <XCircle size={24} weight="bold" /> FAIL
            </button>
            <button
              onClick={() => updateStatus("Blocked")}
              className={cn(
                "flex-1 h-16 rounded-2xl flex items-center justify-center gap-3 text-lg font-black transition-all active:scale-95",
                currentCase.verdict === "Blocked" ? "bg-amber-500 text-white" : "bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20"
              )}
            >
              <Warning size={24} weight="bold" /> BLOCK
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-4 text-slate-500 text-[11px] font-bold">
            <div className="flex items-center gap-1.5"><kbd className="bg-white/10 px-1.5 py-0.5 rounded border border-white/10">P</kbd> Pass</div>
            <div className="flex items-center gap-1.5"><kbd className="bg-white/10 px-1.5 py-0.5 rounded border border-white/10">F</kbd> Fail</div>
            <div className="flex items-center gap-1.5"><kbd className="bg-white/10 px-1.5 py-0.5 rounded border border-white/10">B</kbd> Block</div>
          </div>
        </div>
      </div>
    </div>
  );
}
