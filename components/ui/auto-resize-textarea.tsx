"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface AutoResizeTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export function AutoResizeTextarea({ error, className, ...props }: AutoResizeTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    // Reset height to calculate scrollHeight correctly
    textarea.style.height = "auto";
    // Set height based on scrollHeight, but respect min-height of 48px
    const newHeight = Math.max(48, textarea.scrollHeight);
    textarea.style.height = `${newHeight}px`;
  };

  useEffect(() => {
    // Small delay to ensure styles are applied before measuring
    const timeout = setTimeout(adjustHeight, 0);
    return () => clearTimeout(timeout);
  }, [props.value, props.defaultValue]);

  return (
    <textarea
      {...props}
      ref={textareaRef}
      rows={1}
      onInput={(e) => {
        adjustHeight();
        props.onInput?.(e);
      }}
      className={cn(
        "w-full resize-none overflow-hidden rounded-md border bg-slate-50/50 dark:bg-slate-800/50 px-4 py-[13.5px] text-sm text-slate-800 dark:text-slate-200 outline-none transition focus:bg-white dark:focus:bg-slate-700 focus:shadow-[0_0_0_4px_rgba(56,189,248,0.1)] focus:border-sky-300",
        error ? "border-rose-400" : "border-slate-200 dark:border-slate-600",
        className
      )}
    />
  );
}
