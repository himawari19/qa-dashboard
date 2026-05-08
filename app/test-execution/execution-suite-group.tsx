"use client";

import { useRef, useState, useEffect } from"react";
import Link from"next/link";
import { Badge } from"@/components/badge";
import {
 Play,
 CheckCircle,
 XCircle,
 Warning,
 CaretLeft,
 CaretRight,
 Table,
} from"@phosphor-icons/react";

type Suite = {
 id: string | number;
 title: string;
 notes?: string;
 status: string;
 publicToken: string;
 passed?: number;
 failed?: number;
 blocked?: number;
};

export function ExecutionSuiteGroup({ suites }: { suites: Suite[] }) {
 const scrollRef = useRef<HTMLDivElement>(null);
 const [canScrollLeft, setCanScrollLeft] = useState(false);
 const [canScrollRight, setCanScrollRight] = useState(false);

 const checkScroll = () => {
 const el = scrollRef.current;
 if (!el) return;
 setCanScrollLeft(el.scrollLeft > 4);
 setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
 };

 useEffect(() => {
 checkScroll();
 const el = scrollRef.current;
 if (!el) return;
 el.addEventListener("scroll", checkScroll);
 window.addEventListener("resize", checkScroll);
 return () => {
 el.removeEventListener("scroll", checkScroll);
 window.removeEventListener("resize", checkScroll);
 };
 }, [suites]);

 const scroll = (dir:"left" |"right") => {
 const el = scrollRef.current;
 if (!el) return;
 const cardWidth = 300 + 16;
 el.scrollBy({ left: dir ==="left" ? -cardWidth : cardWidth, behavior:"smooth" });
 };

 const showArrows = suites.length > 3;

 return (
 <div className="relative">
 {showArrows && canScrollLeft && (
 <button
 type="button"
 onClick={() => scroll("left")}
 className="absolute left-2 top-1/2 -translate-y-1/2 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full glass-card text-slate-700 shadow-xl transition-all hover:scale-110 hover:bg-slate-100"
 aria-label="Scroll left"
 >
 <CaretLeft size={17} weight="bold" className="text-slate-700" />
 </button>
 )}
 {showArrows && canScrollRight && (
 <button
 type="button"
 onClick={() => scroll("right")}
 className="absolute right-2 top-1/2 -translate-y-1/2 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full glass-card text-slate-700 shadow-xl transition-all hover:scale-110 hover:bg-slate-100"
 aria-label="Scroll right"
 >
 <CaretRight size={17} weight="bold" className="text-slate-700" />
 </button>
 )}

 <div
 ref={scrollRef}
 className="flex gap-4 overflow-x-auto scroll-smooth pb-2"
 style={{ scrollbarWidth:"none" }}
 >
 {suites.map((suite) => (
 <div
 key={suite.id}
 className="group relative flex flex-col overflow-hidden rounded-2xl glass-card bg-white p-5 transition-all duration-300 hover:border-blue-400 hover:shadow-xl flex-shrink-0 w-[300px]"
 >
 <div className="mb-4 flex items-start justify-between">
 <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-blue-50 transition-colors">
 <Table size={20} weight="bold" />
 </div>
 <Badge value={suite.status} />
 </div>

 <h4 className="mb-1 text-base font-bold text-slate-900 transition-colors">
 {suite.title}
 </h4>
 <p className="mb-6 text-sm text-slate-500 line-clamp-2 min-h-[40px]">
 {suite.notes ||"No additional notes provided for this suite."}
 </p>

 <div className="mt-auto flex items-center justify-between border-t border-slate-50 pt-4">
 <div className="flex items-center gap-3 text-xs font-bold text-slate-400">
 <div className="flex items-center gap-1" title="Passed">
 <CheckCircle size={14} className="text-emerald-500" />
 {suite.passed ?? 0}
 </div>
 <div className="flex items-center gap-1" title="Failed">
 <XCircle size={14} className="text-rose-500" />
 {suite.failed ?? 0}
 </div>
 <div className="flex items-center gap-1" title="Blocked">
 <Warning size={14} className="text-amber-500" />
 {suite.blocked ?? 0}
 </div>
 </div>

 <Link
 href={`/test-execution/${suite.publicToken}`}
 className="inline-flex h-9 items-center gap-2 rounded-md bg-slate-900 px-4 text-xs font-black uppercase tracking-wider text-white transition-all hover:bg-blue-600 hover:pr-5"
 >
 Execute
 <Play size={14} weight="fill" />
 </Link>
 </div>
 </div>
 ))}
 </div>
 </div>
 );
}
