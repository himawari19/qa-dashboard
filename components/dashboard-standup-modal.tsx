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
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800">
          <h2 className="text-base font-black text-slate-900 dark:text-white">Standup Log</h2>
          <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 dark:hover:bg-slate-800">
            <X size={15} weight="bold" />
          </button>
        </div>
        <div className="p-5">
          <pre className="whitespace-pre-wrap rounded-md bg-slate-50 p-4 font-mono text-xs leading-relaxed text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {text}
          </pre>
        </div>
        <div className="flex gap-3 p-5 pt-0">
          <button onClick={onClose} className="flex h-10 flex-1 items-center justify-center rounded-md border border-slate-200 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
            Cancel
          </button>
          <button onClick={onCopy} className="flex h-10 flex-1 items-center justify-center rounded-md bg-slate-900 text-sm font-bold text-white transition hover:bg-blue-600 dark:bg-white dark:text-slate-900 dark:hover:bg-blue-50">
            Copy to Clipboard
          </button>
        </div>
      </div>
    </div>
  );
}
