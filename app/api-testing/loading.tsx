import { Skeleton } from "@/components/skeleton";

export default function ApiTestingLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-32 w-full rounded-md" />
      <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <div className="space-y-4">
          <Skeleton className="h-48 rounded-md" />
          <Skeleton className="h-48 rounded-md" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-48 rounded-md" />
          <Skeleton className="h-48 rounded-md" />
        </div>
      </div>
    </div>
  );
}
