import { Skeleton } from "@/components/skeleton";

export default function KanbanLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-32 w-full rounded-[30px]" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-[520px] rounded-[32px]" />
        ))}
      </div>
    </div>
  );
}
