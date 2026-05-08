"use client";

import React, { type ReactNode } from"react";
import { cn } from"@/lib/utils";
import { Breadcrumb } from"@/components/breadcrumb";

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
 eyebrow?: string;
 title: string;
 description?: string;
 actions?: React.ReactNode;
 controls?: React.ReactNode;
 children: React.ReactNode;
 className?: string;
 crumbs?: { label: string; href?: string }[];
}) {
 return (
 <section className={cn("space-y-5", className)}>
 {crumbs && (
 <div className="animate-in fade-in slide-in-from-top-2 duration-500">
 <Breadcrumb crumbs={crumbs} />
 </div>
 )}
 <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
 <div className="border-b border-slate-200 px-6 py-5">
 <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
 <div className="min-w-0 max-w-3xl">
 <div className="flex items-center gap-3">
 {icon ? (
 <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
 {icon}
 </div>
 ) : null}
 <div className="min-w-0">
 {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-700">{eyebrow}</p> : null}
 <h1 className={eyebrow ?"mt-2 text-2xl font-bold tracking-tight md:text-3xl text-slate-900" :"text-2xl font-bold tracking-tight md:text-3xl text-slate-900"}>{title}</h1>
 </div>
 </div>
 {description ? <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{description}</p> : null}
 </div>
 {actions ? (
 <div className="flex w-full min-w-0 flex-wrap items-center justify-start gap-2 overflow-x-auto xl:w-auto xl:justify-end">
 {actions}
 </div>
 ) : null}
 </div>
 </div>
 {controls ? <div className="border-b border-slate-200/60 bg-white px-6 py-4 text-sm text-slate-600">{controls}</div> : null}
 <div className="min-w-0 px-6 py-5">{children}</div>
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
"inline-flex h-10 items-center gap-2 rounded-xl bg-white border border-slate-200 px-5 outline-none focus:outline-none text-sm font-bold text-blue-700 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:bg-blue-600 hover:text-white hover:border-blue-600",
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
"inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-slate-200 outline-none focus:outline-none text-blue-700 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:bg-blue-600 hover:text-white hover:border-blue-600",
 className,
 )}
 >
 {children}
 </a>
 );
}
