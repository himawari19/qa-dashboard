"use client";

import { useState } from "react";
import { WarningCircle, CopySimple, CaretDown } from "@phosphor-icons/react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const isDev = process.env.NODE_ENV === "development";

  const copyError = () => {
    const text = [`Error: ${error?.message}`, ``, `Stack:`, error?.stack].join("\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

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
        {error.digest && (
          <p className="mt-1 text-xs font-mono text-slate-400">Digest: {error.digest}</p>
        )}
        <div className="mt-6 flex justify-center gap-2">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-11 items-center rounded-full bg-rose-600 px-5 text-sm font-semibold text-white transition hover:bg-rose-700"
          >
            Try Again
          </button>
          {isDev && (
            <button
              type="button"
              onClick={copyError}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <CopySimple size={16} weight="bold" />
              {copied ? "Copied!" : "Copy Error"}
            </button>
          )}
        </div>
        {isDev && error && (
          <div className="mt-4 text-left">
            <button
              onClick={() => setDetailsOpen((v) => !v)}
              className="flex items-center gap-1.5 text-xs font-semibold text-rose-700 hover:text-rose-900 transition mx-auto"
            >
              <CaretDown
                size={12}
                weight="bold"
                className={`transition-transform ${detailsOpen ? "rotate-180" : ""}`}
              />
              {detailsOpen ? "Hide" : "Show"} error details
            </button>
            {detailsOpen && (
              <div className="mt-2 rounded-xl border border-rose-200 bg-white p-4">
                <p className="text-xs font-bold text-rose-700 mb-1">{error.message}</p>
                <pre className="text-[10px] text-slate-600 overflow-auto max-h-48 whitespace-pre-wrap break-all">
                  {error.stack}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
