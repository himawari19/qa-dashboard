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
 <div className="mt-4 flex items-center justify-between border-t border-[#d9e2ea] pt-4">
 <p className="text-xs font-medium text-slate-500">
 Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalItems)} of {totalItems} data
 </p>
 <div className="flex items-center gap-2">
 <button
 type="button"
 disabled={page <= 1}
 onClick={onPrev}
 className="h-8 rounded-md border border-[#c9d7e3] bg-white px-4 text-xs font-semibold text-slate-600 transition hover:border-sky-400 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-40"
 >
 ← Prev
 </button>
 <button
 type="button"
 disabled={page >= totalPages}
 onClick={onNext}
 className="h-8 rounded-md border border-[#c9d7e3] bg-white px-4 text-xs font-semibold text-slate-600 transition hover:border-sky-400 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-40"
 >
 Next →
 </button>
 </div>
 </div>
 );
}
