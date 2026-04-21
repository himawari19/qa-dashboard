"use client";

import { Printer } from "@phosphor-icons/react";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 print:hidden"
    >
      <Printer size={18} weight="bold" />
      Print Report
    </button>
  );
}
