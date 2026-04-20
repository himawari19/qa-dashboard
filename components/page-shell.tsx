"use client";

import React from "react";
import { cn } from "@/lib/utils";

export function PageShell({
  eyebrow,
  title,
  description,
  actions,
  controls,
  children,
  className,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  controls?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-6", className)}>
      <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-[#f4f8fb] px-6 py-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-700">{eyebrow}</p>
              <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-900">{title}</h1>
              {description ? <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p> : null}
            </div>
            {actions ? <div className="flex w-full flex-wrap items-center gap-2 xl:w-auto xl:justify-end">{actions}</div> : null}
          </div>
        </div>
        {controls ? <div className="border-b border-slate-200 bg-white px-6 py-5 text-sm text-slate-600">{controls}</div> : null}
        <div className="px-6 py-6">{children}</div>
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
        "inline-flex h-11 items-center gap-2 rounded-full border border-sky-200 bg-white px-5 text-sm font-semibold text-sky-700 shadow-sm transition duration-200 hover:border-sky-600 hover:bg-sky-600 hover:text-white hover:shadow-md",
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
        "inline-flex h-11 w-11 items-center justify-center rounded-full border border-sky-200 bg-white text-sky-700 shadow-sm transition duration-200 hover:border-sky-600 hover:bg-sky-600 hover:text-white hover:shadow-md",
        className,
      )}
    >
      {children}
    </a>
  );
}
