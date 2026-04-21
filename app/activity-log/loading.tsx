import { Skeleton } from "@/components/skeleton";

export default function ActivityLogLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-32 w-full rounded-[30px]" />
      <div className="space-y-2">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
