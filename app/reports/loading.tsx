import { Skeleton } from "@/components/skeleton";

export default function ReportsLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-32 w-full rounded-md" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-64 rounded-md" />
        <Skeleton className="h-64 rounded-md" />
      </div>
    </div>
  );
}
