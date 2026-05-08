"use client";

import { X } from "@phosphor-icons/react";

type DashboardStandupModalProps = {
  open: boolean;
  text: string;
  onClose: () => void;
  onCopy: () => void;
};

export function DashboardStandupModal({ open, text, onClose, onCopy }: DashboardStandupModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl glass-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200/60 p-5 dark:border-white/10">
          <h2 className="text-base font-black text-slate-900 dark:text-white">Standup Log</h2>
          <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 dark:hover:bg-slate-800">
            <X size={15} weight="bold" />
          </button>
        </div>
        <div className="p-5">
          <pre className="whitespace-pre-wrap rounded-xl glass-card bg-white/40 dark:bg-slate-800/40 p-4 font-mono text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            {text}
          </pre>
        </div>
        <div className="flex gap-3 p-5 pt-0">
          <button onClick={onClose} className="flex h-10 flex-1 items-center justify-center rounded-lg glass-card text-sm font-bold text-slate-600 transition-all duration-300 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10 hover:-translate-y-0.5 hover:shadow-md">
            Cancel
          </button>
          <button onClick={onCopy} className="flex h-10 flex-1 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white transition-all duration-300 hover:bg-blue-500 hover:-translate-y-0.5 hover:shadow-md">
            Copy to Clipboard
          </button>
        </div>
      </div>
    </div>
  );
}
