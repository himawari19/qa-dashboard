"use client";

type ModulePaginationProps = {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPrev: () => void;
  onNext: () => void;
};

export function ModulePagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPrev,
  onNext,
}: ModulePaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-4 flex items-center justify-between border-t border-[#d9e2ea] pt-4 dark:border-slate-700">
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
        Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalItems)} of {totalItems} data
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={onPrev}
          className="h-8 rounded-md border border-[#c9d7e3] bg-white px-4 text-xs font-semibold text-slate-600 transition hover:border-sky-400 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
        >
          ← Prev
        </button>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={onNext}
          className="h-8 rounded-md border border-[#c9d7e3] bg-white px-4 text-xs font-semibold text-slate-600 transition hover:border-sky-400 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
