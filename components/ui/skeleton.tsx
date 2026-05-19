import { cn } from"@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
 return (
 <div className={cn("animate-pulse  bg-gray-200", className)} />
 );
}

export function ChartSkeleton({ bars = 7 }: { bars?: number }) {
 const heights = [55, 75, 45, 85, 60, 70, 50, 65, 40, 80].slice(0, bars);
 return (
 <div className="flex h-full w-full items-end gap-1.5 px-2 pb-4 animate-pulse">
 {heights.map((h, i) => (
 <div
 key={i}
 className="flex-1 rounded-t bg-gray-200"
 style={{ height:`${h}%` }}
 />
 ))}
 </div>
 );
}
