import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded-md bg-slate-200 dark:bg-slate-700", className)} />
  );
}

export function ChartSkeleton({ bars = 7 }: { bars?: number }) {
  const heights = [55, 75, 45, 85, 60, 70, 50, 65, 40, 80].slice(0, bars);
  return (
    <div className="flex h-full w-full items-end gap-1.5 px-2 pb-4 animate-pulse">
      {heights.map((h, i) => (
        <div
          key={i}
          className="flex-1 rounded-t bg-slate-200 dark:bg-slate-700"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-10 w-10 rounded-lg bg-slate-200 dark:bg-slate-700" />
      </div>
      <div className="space-y-2">
        <div className="h-8 w-14 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-3 w-20 rounded bg-slate-100 dark:bg-slate-800" />
      </div>
    </div>
  );
}
