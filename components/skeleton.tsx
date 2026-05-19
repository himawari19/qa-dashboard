export function Skeleton({ className }: { className?: string }) {
 return (
 <div
 className={`animate-pulse  bg-gray-200 ${className}`}
 />
 );
}

export function DashboardSkeleton() {
 return (
 <div className="space-y-6 pb-12">
 <Skeleton className="h-[300px] w-full " />
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
 {[...Array(5)].map((_, i) => (
 <Skeleton key={i} className="h-32 " />
 ))}
 </div>
 <div className="grid gap-6 xl:grid-cols-2">
 <Skeleton className="h-[400px] " />
 <Skeleton className="h-[400px] " />
 </div>
 </div>
 );
}
