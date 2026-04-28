"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { Badge } from "@/components/badge";
import {
  Play,
  CheckCircle,
  XCircle,
  Warning,
  CaretLeft,
  CaretRight,
  Table,
} from "@phosphor-icons/react";

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

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = 300 + 16;
    el.scrollBy({ left: dir === "left" ? -cardWidth : cardWidth, behavior: "smooth" });
  };

  const showArrows = suites.length > 3;

  return (
    <div className="relative">
      {showArrows && canScrollLeft && (
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 flex h-9 w-9 items-center justify-center rounded-md bg-white border border-slate-200 shadow-md text-slate-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300"
        >
          <CaretLeft size={16} weight="bold" />
        </button>
      )}
      {showArrows && canScrollRight && (
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 flex h-9 w-9 items-center justify-center rounded-md bg-white border border-slate-200 shadow-md text-slate-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300"
        >
          <CaretRight size={16} weight="bold" />
        </button>
      )}

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scroll-smooth pb-2"
        style={{ scrollbarWidth: "none" }}
      >
        {suites.map((suite) => (
          <div
            key={suite.id}
            className="group relative flex flex-col overflow-hidden rounded-md border border-slate-200 bg-white p-5 transition-all hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-900 flex-shrink-0 w-[300px]"
          >
            <div className="mb-4 flex items-start justify-between">
              <div className="h-10 w-10 rounded-md bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors dark:bg-slate-800 dark:group-hover:bg-blue-950/30">
                <Table size={20} weight="bold" />
              </div>
              <Badge value={suite.status} />
            </div>

            <h4 className="mb-1 text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {suite.title}
            </h4>
            <p className="mb-6 text-sm text-slate-500 line-clamp-2 min-h-[40px]">
              {suite.notes || "No additional notes provided for this suite."}
            </p>

            <div className="mt-auto flex items-center justify-between border-t border-slate-50 pt-4 dark:border-slate-800/50">
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
                href={`/test-suites/execute/${suite.publicToken}`}
                className="inline-flex h-9 items-center gap-2 rounded-md bg-slate-900 px-4 text-xs font-black uppercase tracking-wider text-white transition-all hover:bg-blue-600 hover:pr-5 dark:bg-white dark:text-slate-900 dark:hover:bg-blue-50"
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
