"use client";

import type { KeyboardEvent, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { CaretDown } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export type TestCaseRow = {
  id?: number;
  testSuiteId: string;
  tcId: string;
  caseName: string;
  typeCase: string;
  preCondition: string;
  testStep: string;
  expectedResult: string;
  actualResult?: string;
  status: string;
  evidence: string;
  priority: string;
};

export type FieldKey =
  | "tcId"
  | "caseName"
  | "typeCase"
  | "preCondition"
  | "testStep"
  | "expectedResult"
  | "actualResult"
  | "status"
  | "priority"
  | "evidence";

export const fieldOrder: FieldKey[] = [
  "tcId",
  "caseName",
  "typeCase",
  "preCondition",
  "testStep",
  "expectedResult",
  "actualResult",
  "status",
  "priority",
  "evidence",
];

export const typeOptions = ["Positive", "Negative"] as const;
export const statusOptions = ["Pending", "Passed", "Failed", "Blocked"] as const;
export const priorityOptions = ["Critical", "High", "Medium", "Low"] as const;

const typeCellClass: Record<string, string> = {
  Positive: "bg-emerald-500 text-white",
  Negative: "bg-rose-500 text-white",
};
const statusCellClass: Record<string, string> = {
  Pending: "bg-amber-400 text-amber-950",
  Passed: "bg-emerald-500 text-white",
  PASSED: "bg-emerald-500 text-white",
  Success: "bg-emerald-500 text-white",
  SUCCESS: "bg-emerald-500 text-white",
  Failed: "bg-rose-500 text-white",
  FAILED: "bg-rose-500 text-white",
  Blocked: "bg-slate-500 text-white",
  BLOCKED: "bg-slate-500 text-white",
};
const priorityCellClass: Record<string, string> = {
  Critical: "bg-red-500 text-white",
  High: "bg-orange-500 text-white",
  Medium: "bg-blue-500 text-white",
  Low: "bg-slate-500 text-white",
};

export function badgeClass(fieldKey: string, value: string) {
  if (fieldKey === "typeCase") return typeCellClass[value] ?? "bg-slate-300 text-slate-700";
  if (fieldKey === "status") return statusCellClass[value] ?? "bg-slate-300 text-slate-700";
  if (fieldKey === "priority") return priorityCellClass[value] ?? "bg-slate-300 text-slate-700";
  return "bg-slate-300 text-slate-700";
}

export const COLS = [
  { key: "tcId", label: "TC ID", width: 100 },
  { key: "caseName", label: "Case Name", width: 220 },
  { key: "typeCase", label: "Type", width: 110 },
  { key: "preCondition", label: "Pre Condition", width: 220 },
  { key: "testStep", label: "Test Step", width: 260 },
  { key: "expectedResult", label: "Expected Result", width: 260 },
  { key: "actualResult", label: "Actual Result", width: 260 },
  { key: "status", label: "Status", width: 120 },
  { key: "priority", label: "Priority", width: 120 },
  { key: "evidence", label: "Evidence", width: 180 },
  { key: "__action__", label: "Action", width: 100 },
] as const;

export const TOTAL_WIDTH = COLS.reduce((s, c) => s + c.width, 0);
export const colMap = Object.fromEntries(COLS.map((c) => [c.key, c.width])) as Record<string, number>;

export function Th({ children, w, className }: { children?: ReactNode; w: number; className?: string }) {
  return (
    <th
      style={{ width: w, minWidth: w, maxWidth: w }}
      className={cn(
        "border border-slate-300 bg-slate-100 px-2 py-[5px] text-left text-[11px] font-bold uppercase tracking-wide text-slate-600 select-none dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function ReadCell({ value, w, onClick }: { value: string; w: number; onClick?: () => void }) {
  return (
    <td
      style={{ width: w, minWidth: w, maxWidth: w }}
      onClick={onClick}
      className={cn(
        "border border-slate-200 px-[6px] py-[4px] align-top text-[12px] leading-[1.4] transition-colors dark:border-slate-600",
        onClick ? "cursor-text hover:bg-white/50" : "text-slate-700 dark:text-slate-300",
      )}
    >
      <div className="min-h-[22px] whitespace-pre-wrap break-words">
        {value || <span className="text-slate-300 dark:text-slate-600">—</span>}
      </div>
    </td>
  );
}

export function BadgeCell({ value, w, fieldKey, onClick }: { value: string; w: number; fieldKey: string; onClick?: () => void }) {
  return (
    <td
      style={{ width: w, minWidth: w, maxWidth: w }}
      onClick={onClick}
      className="border border-slate-200 p-0 align-top dark:border-slate-600"
    >
      <div
        className={cn(
          "flex min-h-[28px] h-full w-full items-center justify-between gap-1 px-[6px] text-[11px] font-bold uppercase tracking-wide focus:outline-none focus:ring-2 focus:ring-inset focus:ring-sky-400",
          badgeClass(fieldKey, value)
            ? cn(badgeClass(fieldKey, value), "rounded-none")
            : "text-slate-400 bg-white dark:bg-slate-800 dark:text-slate-500",
        )}
      >
        <span>{value || "Select"}</span>
      </div>
    </td>
  );
}

export function EditTextCell({
  value,
  w,
  placeholder,
  multiline,
  onChange,
  onKeyDown,
  setRef,
}: {
  value: string;
  w: number;
  placeholder?: string;
  multiline?: boolean;
  onChange: (v: string) => void;
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  setRef?: (el: HTMLInputElement | HTMLTextAreaElement | null) => void;
}) {
  const sharedClass =
    "block w-full border-0 bg-transparent px-[6px] py-[4px] text-[12px] leading-[1.4] text-slate-800 outline-none focus:ring-0 placeholder:text-slate-300 dark:text-slate-200 dark:placeholder:text-slate-600";
  const innerRef = useRef<HTMLTextAreaElement | HTMLInputElement | null>(null);

  useEffect(() => {
    if (multiline && innerRef.current) {
      const t = innerRef.current as HTMLTextAreaElement;
      t.style.height = "0px";
      t.style.height = `${t.scrollHeight}px`;
    }
  }, [value, multiline]);

  return (
    <td
      style={{ width: w, minWidth: w, maxWidth: w }}
      onClick={() => innerRef.current?.focus()}
      className="border border-slate-200 p-0 align-top bg-white focus-within:ring-2 focus-within:ring-inset focus-within:ring-sky-400 dark:bg-slate-800 dark:border-slate-600"
    >
      {multiline ? (
        <textarea
          ref={(el) => {
            innerRef.current = el;
            if (setRef) setRef(el);
          }}
          value={value}
          placeholder={placeholder}
          rows={1}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown as (e: KeyboardEvent<HTMLTextAreaElement>) => void}
          className={cn(sharedClass, "resize-none overflow-hidden min-h-[28px]")}
        />
      ) : (
        <input
          ref={(el) => {
            innerRef.current = el;
            if (setRef) setRef(el);
          }}
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown as (e: KeyboardEvent<HTMLInputElement>) => void}
          className={cn(sharedClass, "h-[28px]")}
        />
      )}
    </td>
  );
}

export function CustomSelect({
  value,
  w,
  fieldKey,
  options,
  placeholder,
  onChange,
  onTabKey,
  setRef,
  autoFocusOpen,
}: {
  value: string;
  w: number;
  fieldKey: string;
  options: readonly string[];
  placeholder?: string;
  onChange: (v: string) => void;
  onTabKey?: () => void;
  setRef?: (el: HTMLButtonElement | null) => void;
  autoFocusOpen?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const tone = badgeClass(fieldKey, value);

  function openDropdown() {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setRect({ top: r.bottom, left: r.left, width: Math.max(r.width, 140) });
    }
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    function close(e: MouseEvent) {
      if (listRef.current && !listRef.current.contains(e.target as Node) && btnRef.current && !btnRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onScroll() {
      setOpen(false);
    }
    document.addEventListener("mousedown", close);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", close);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  function handleKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openDropdown();
      return;
    }
    if (e.key === "Tab" && onTabKey) onTabKey();
  }

  return (
    <td
      style={{ width: w, minWidth: w, maxWidth: w }}
      className="border border-slate-200 p-0 align-top dark:border-slate-600"
    >
      <button
        ref={(el) => {
          btnRef.current = el;
          if (setRef) setRef(el);
          if (autoFocusOpen && el) setTimeout(() => el.focus(), 0);
        }}
        type="button"
        onClick={openDropdown}
        onKeyDown={handleKeyDown}
        className={cn(
          "flex min-h-[28px] h-full w-full items-center justify-between gap-1 px-[6px] text-[11px] font-bold uppercase tracking-wide focus:outline-none focus:ring-2 focus:ring-inset focus:ring-sky-400",
          tone ? cn(tone, "rounded-none") : "text-slate-400 bg-white dark:bg-slate-800 dark:text-slate-500",
        )}
      >
        <span>{value || placeholder || "Select"}</span>
        <CaretDown size={10} weight="bold" className="shrink-0 opacity-70" />
      </button>
      {open && rect && (
        <ul
          ref={listRef}
          style={{ position: "fixed", top: rect.top, left: rect.left, minWidth: rect.width, zIndex: 9999 }}
          className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-xl dark:border-slate-600 dark:bg-slate-800"
        >
          {options.map((opt) => {
            const optTone = badgeClass(fieldKey, opt);
            return (
              <li key={opt}>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-[5px] text-left text-[11px] font-bold uppercase tracking-wide hover:bg-slate-50 dark:hover:bg-slate-700"
                  onClick={() => {
                    onChange(opt);
                    setOpen(false);
                  }}
                >
                  <span className={cn("inline-block h-2 w-2 shrink-0 rounded-md", optTone || "bg-slate-300")} />
                  <span className={optTone ? "" : "text-slate-600 dark:text-slate-300"}>{opt}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </td>
  );
}
