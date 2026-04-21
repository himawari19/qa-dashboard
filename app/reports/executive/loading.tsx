import { Skeleton } from "@/components/skeleton";

export default function ExecutiveLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-32 w-full rounded-[30px]" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-[32px]" />
        ))}
      </div>
      <Skeleton className="h-64 w-full rounded-[40px]" />
      <Skeleton className="h-48 w-full rounded-[40px]" />
    </div>
  );
}
