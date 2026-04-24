import { Skeleton } from "@/components/skeleton";

export default function RtmLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-32 w-full rounded-md" />
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} className="h-24 w-full rounded-md" />
      ))}
    </div>
  );
}
