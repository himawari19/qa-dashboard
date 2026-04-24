export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-slate-200 dark:bg-slate-800 ${className}`}
    />
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 pb-12">
      <Skeleton className="h-[300px] w-full rounded-md" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-md" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Skeleton className="h-[400px] rounded-md" />
        <Skeleton className="h-[400px] rounded-md" />
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-md border border-slate-200 bg-white px-6 py-10 text-center shadow-sm">
      <p className="text-sm font-black uppercase tracking-[0.28em] text-slate-400">{title}</p>
      <p className="mt-3 text-sm text-slate-500">{description}</p>
    </div>
  );
}
