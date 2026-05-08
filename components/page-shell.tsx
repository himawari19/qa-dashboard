"use client";

import React, { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Breadcrumb } from "@/components/breadcrumb";

export function PageShell({
  icon,
  eyebrow,
  title,
  description,
  actions,
  controls,
  children,
  className,
  crumbs,
}: {
  icon?: ReactNode;
  eyebrow: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  controls?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  crumbs?: { label: string; href?: string }[];
}) {
  return (
    <section className={cn("space-y-6", className)}>
      {crumbs && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-500">
          <Breadcrumb crumbs={crumbs} />
        </div>
      )}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-white/10">
        <div className="border-b border-slate-200 px-6 py-6 dark:border-slate-800">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0 max-w-3xl">
              <div className="flex items-start gap-3">
                {icon ? (
                  <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-400/20">
                    {icon}
                  </div>
                ) : null}
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-700 dark:text-blue-400">{eyebrow}</p>
                  <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{title}</h1>
                </div>
              </div>
              {description ? <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400">{description}</p> : null}
            </div>
            {actions ? (
              <div className="flex w-full min-w-0 flex-wrap items-center justify-start gap-2 overflow-x-auto xl:w-auto xl:justify-end">
                {actions}
              </div>
            ) : null}
          </div>
        </div>
        {controls ? <div className="border-b border-slate-200/60 dark:border-white/10 bg-white dark:bg-slate-900/40 px-6 py-5 text-sm text-slate-600 dark:text-slate-400">{controls}</div> : null}
        <div className="min-w-0 px-6 py-6">{children}</div>
      </div>
    </section>
  );
}

export function ActionButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex h-11 items-center gap-2 rounded-xl bg-white border border-slate-200 px-5 text-sm font-bold text-blue-700 dark:bg-slate-800 dark:border-white/10 dark:text-blue-400 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:bg-blue-600 hover:text-white hover:border-blue-600",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function IconActionLink({
  children,
  className,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      {...props}
      className={cn(
        "inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white border border-slate-200 text-blue-700 dark:bg-slate-800 dark:border-white/10 dark:text-blue-400 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:bg-blue-600 hover:text-white hover:border-blue-600",
        className,
      )}
    >
      {children}
    </a>
  );
}
