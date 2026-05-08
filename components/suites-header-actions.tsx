"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { FilePdf, FileXls, MagnifyingGlass, UploadSimple } from "@phosphor-icons/react";

export function SuitesHeaderActions({
  initialSearch,
  placeholder = "Search suites...",
  exportModule = "test-suites",
  importModule = "test-suites",
}: {
  initialSearch: string;
  placeholder?: string;
  exportModule?: string;
  importModule?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const uploadRef = useRef<HTMLInputElement | null>(null);
  const [value, setValue] = useState(initialSearch);
  const [, startTransition] = useTransition();

  function updateQuery(nextValue: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (nextValue.trim()) params.set("q", nextValue.trim());
    else params.delete("q");
    const query = params.toString();
    startTransition(() => router.replace(query ? `${pathname}?${query}` : pathname));
  }

  async function handleUpload(file: File | undefined) {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    await fetch(`/api/import/${importModule}`, { method: "POST", body: formData });
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative w-full max-w-[360px] flex-1">
        <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={value}
          onChange={(event) => {
            const nextValue = event.target.value;
            setValue(nextValue);
            updateQuery(nextValue);
          }}
          placeholder={placeholder}
          className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-700 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100"
        />
      </div>
      <Link
        href={`/api/export/${exportModule}`}
        title="Export Excel"
        aria-label="Export Excel"
        className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:shadow-md hover:bg-blue-500 hover:text-white hover:border-blue-500 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300"
      >
        <FileXls size={16} weight="bold" />
      </Link>
      <Link
        href={`/api/export/${exportModule}?format=pdf`}
        title="Print / Export PDF"
        aria-label="Print / Export PDF"
        className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:shadow-md hover:bg-blue-500 hover:text-white hover:border-blue-500 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300"
      >
        <FilePdf size={16} weight="bold" />
      </Link>
      <button
        type="button"
        onClick={() => uploadRef.current?.click()}
        className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:shadow-md hover:bg-blue-500 hover:text-white hover:border-blue-500 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300"
      >
        <UploadSimple size={16} weight="bold" />
      </button>
      <input
        ref={uploadRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          void handleUpload(file);
          event.currentTarget.value = "";
        }}
      />
    </div>
  );
}
