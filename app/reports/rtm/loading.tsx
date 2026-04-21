import { Skeleton } from "@/components/skeleton";

export default function RtmLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-32 w-full rounded-[30px]" />
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} className="h-24 w-full rounded-2xl" />
      ))}
    </div>
  );
}
