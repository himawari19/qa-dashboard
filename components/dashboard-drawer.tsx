"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { ArrowRight, CaretRight, X } from "@phosphor-icons/react";
import { Badge } from "@/components/badge";

export type DashboardDrawerItem = {
  label: string;
  sub?: string;
  badge?: string;
  badge2?: string;
  href: string;
};

type DashboardDrawerProps = {
  title: string;
  subtitle?: string;
  items: DashboardDrawerItem[];
  loading?: boolean;
  onClose: () => void;
  viewAllHref?: string;
};

export function DashboardDrawer({ title, subtitle, items, loading, onClose, viewAllHref }: DashboardDrawerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", keyHandler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", keyHandler);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-sm animate-in fade-in duration-200">
      <div ref={ref} className="flex h-full w-full max-w-sm flex-col bg-white shadow-2xl animate-in slide-in-from-right duration-300 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={16} weight="bold" />
          </button>
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto p-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-md bg-slate-100 dark:bg-slate-800" />
            ))
          ) : items.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">No items found.</div>
          ) : (
            items.map((item, i) => (
              <Link
                key={i}
                href={item.href}
                onClick={onClose}
                className="group flex items-center gap-3 rounded-md border border-slate-100 p-3 transition hover:border-blue-200 hover:bg-blue-50/40 dark:border-slate-800 dark:hover:border-blue-800/40 dark:hover:bg-blue-950/20"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800 transition group-hover:text-blue-700 dark:text-slate-200 dark:group-hover:text-blue-400">
                    {item.label}
                  </p>
                  {item.sub && <p className="mt-0.5 truncate text-xs text-slate-400">{item.sub}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  {item.badge && <Badge value={item.badge} />}
                  {item.badge2 && <Badge value={item.badge2} />}
                </div>
                <CaretRight size={12} className="shrink-0 text-slate-300 transition group-hover:text-blue-500" />
              </Link>
            ))
          )}
        </div>

        {viewAllHref && (
          <div className="border-t border-slate-100 p-4 dark:border-slate-800">
            <Link
              href={viewAllHref}
              onClick={onClose}
              className="flex h-10 items-center justify-center gap-2 rounded-md bg-slate-900 text-sm font-bold text-white transition hover:bg-blue-600 dark:bg-white dark:text-slate-900 dark:hover:bg-blue-50"
            >
              View All <ArrowRight size={14} weight="bold" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
