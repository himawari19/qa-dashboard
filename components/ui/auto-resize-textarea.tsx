"use client";

import { cn } from "@/lib/utils";

interface AutoResizeTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export function AutoResizeTextarea({ error, className, ...props }: AutoResizeTextareaProps) {
  return (
    <textarea
      {...props}
      rows={props.rows ?? 3}
      className={cn(
        "w-full resize-none overflow-y-auto rounded-md border bg-slate-50/50 dark:bg-slate-800/50 px-4 py-[13.5px] text-sm leading-relaxed text-slate-800 dark:text-slate-200 outline-none transition focus:bg-white dark:focus:bg-slate-700 focus:shadow-[0_0_0_4px_rgba(56,189,248,0.1)] focus:border-sky-300",
        error ? "border-rose-400" : "border-slate-200 dark:border-slate-600",
        className
      )}
    />
  );
}
