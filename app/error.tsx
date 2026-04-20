"use client";

import { WarningCircle } from "@phosphor-icons/react";

export default function Error({
  reset,
}: {
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6 py-16">
      <div className="w-full max-w-xl rounded-[28px] border border-rose-100 bg-rose-50/60 p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
          <WarningCircle size={28} weight="fill" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Page failed to load</h2>
        <p className="mt-2 text-sm text-slate-600">
          Refresh or reopen the menu. If it still fails, the route data needs a fallback fix.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 inline-flex h-11 items-center rounded-full bg-rose-600 px-5 text-sm font-semibold text-white transition hover:bg-rose-700"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
