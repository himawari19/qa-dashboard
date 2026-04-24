"use client";

import { Printer } from "@phosphor-icons/react";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex h-11 items-center gap-2 rounded-md bg-slate-900 px-6 text-sm font-black uppercase tracking-wider text-white shadow-lg shadow-slate-900/20 transition-all hover:bg-slate-800 hover:scale-[1.02] active:scale-95 print:hidden dark:bg-white dark:text-slate-900"
    >
      <Printer size={18} weight="bold" />
      Generate PDF Report
    </button>
  );
}
