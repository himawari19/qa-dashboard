"use client";

import Link from "next/link";
import { Badge } from "@/components/badge";
import { HighlightText } from "@/components/highlight-text";
import { cn, formatDate } from "@/lib/utils";
import type { ModuleKey } from "@/lib/modules";

type RelatedSuite = { id: string; title: string; token?: string };

type TableRow = {
  id: string | number;
  status?: string;
  createdAt?: string | number;
  relatedSuites?: RelatedSuite[];
  projectRowSpan?: number;
  testPlanRowSpan?: number;
  [key: string]: string | number | boolean | null | undefined | RelatedSuite[] | unknown;
};

type Column = {
  key: string;
  label: string;
  tone?: "priority" | "severity" | "status";
  multiline?: boolean;
  link?: boolean;
  internalLink?: (row: TableRow) => string;
};

type ModuleWorkspaceCellProps = {
  module: ModuleKey;
  row: TableRow;
  column: Column;
  value: unknown;
  statusOptions: Array<{ label: string; value: string }>;
  canEdit: boolean;
  statusDropdownId: string | number | null;
  index: number;
  visibleRowsLength: number;
  setStatusDropdownId: (value: string | number | null) => void;
  onUpdateStatus: (id: string | number, value: string) => void | Promise<void>;
};

export function ModuleWorkspaceCell({
  module,
  row,
  column,
  value,
  statusOptions,
  canEdit,
  statusDropdownId,
  index,
  visibleRowsLength,
  setStatusDropdownId,
  onUpdateStatus,
}: ModuleWorkspaceCellProps) {
  if (((module === "test-suites" || module === "test-cases") && column.key === "testPlanLabel") || (module === "test-plans" && column.key === "project")) {
    const rowSpanKey = module === "test-plans" ? "projectRowSpan" : "testPlanRowSpan";
    const rowSpan = Number(row[rowSpanKey] ?? 1);
    if (rowSpan === 0) return null;
    return (
      <td
        key={column.key}
        rowSpan={rowSpan}
        className="max-w-64 border border-[#d9e2ea] dark:border-slate-700 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 align-top whitespace-pre-wrap break-words"
      >
        {column.internalLink && value ? (
          <Link href={column.internalLink(row)} className="break-all text-blue-700 font-semibold hover:underline">
            <HighlightText text={String(value)} query="" linkify={false} />
          </Link>
        ) : (
          <HighlightText text={String(value || "-")} query="" linkify={!column.internalLink} />
        )}
      </td>
    );
  }

  return (
    <td
      key={column.key}
      className={cn("max-w-64 border border-[#d9e2ea] dark:border-slate-700 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 align-top whitespace-pre-wrap break-words")}
    >
      {column.internalLink && value ? (
        <Link href={column.internalLink(row)} className="break-all text-blue-700 font-semibold hover:underline">
          <HighlightText text={String(value)} query="" linkify={false} />
        </Link>
      ) : column.link && value ? (
        <a href={String(value)} target="_blank" rel="noreferrer" className="break-all text-blue-600 hover:underline">
          <HighlightText text={String(value)} query="" linkify={false} />
        </a>
      ) : column.tone === "status" && statusOptions.length > 0 && ["tasks", "bugs", "test-plans", "test-sessions", "test-suites", "sprints", "assignees", "users", "deployments"].includes(module) ? (
        <div className="relative" data-status-dropdown>
          <button
            type="button"
            onClick={() => {
              if (!canEdit) return;
              setStatusDropdownId(statusDropdownId === row.id ? null : row.id);
            }}
            className={cn(canEdit ? "cursor-pointer" : "cursor-default")}
            title={canEdit ? "Click to change status" : ""}
          >
            <Badge value={String(value)} />
          </button>
          {statusDropdownId === row.id && (
            <div
              className={cn(
                "absolute left-0 z-[100] mt-1 min-w-[140px] rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-1 shadow-2xl animate-in fade-in zoom-in-95 duration-200",
                index > visibleRowsLength - 3 && visibleRowsLength > 3 ? "bottom-full mb-1" : "top-full",
              )}
            >
              {statusOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    void onUpdateStatus(row.id, opt.value);
                    setStatusDropdownId(null);
                  }}
                  className={cn(
                    "flex w-full items-center px-3 py-1.5 text-xs font-semibold transition hover:bg-slate-50 dark:hover:bg-slate-700",
                    String(value) === opt.value ? "text-sky-700 dark:text-sky-400" : "text-slate-700 dark:text-slate-300",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : column.tone ? (
        <Badge value={String(value)} />
      ) : column.key.toLowerCase().includes("date") ? (
        formatDate(value == null ? null : String(value))
      ) : module === "test-plans" && column.key === "scope" && Array.isArray(row.relatedSuites) ? (
        <div className="flex max-h-36 flex-col gap-1.5 overflow-y-auto pr-1 scrollbar-thin">
          {row.relatedSuites.length > 0 ? (
            row.relatedSuites.map((suite) => (
              <Link
                key={suite.id}
                href={`/test-cases/detail/${suite.token}`}
                className="rounded-sm bg-sky-50 px-2 py-1 text-xs font-semibold text-sky-700 hover:bg-sky-100 dark:bg-sky-950/50 dark:text-sky-300"
              >
                {suite.title || suite.id}
              </Link>
            ))
          ) : (
            <span>-</span>
          )}
        </div>
      ) : column.multiline ? (
        <div
          className={cn(
            "max-w-[240px] rounded-sm bg-slate-50 p-2 text-xs leading-relaxed break-words whitespace-pre-wrap cursor-default dark:bg-slate-800",
            module === "test-suites" ? "min-h-12" : "h-24 overflow-y-auto",
          )}
          title={String(value || "")}
        >
          <HighlightText text={String(value || "-")} query="" />
        </div>
      ) : (
        <HighlightText text={String(value || "-")} query="" />
      )}
    </td>
  );
}
