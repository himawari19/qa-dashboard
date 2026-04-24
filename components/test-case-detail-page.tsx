"use client";

import Link from "next/link";
import { ArrowLeft, Plus } from "@phosphor-icons/react";
import { PageShell } from "@/components/page-shell";
import { Breadcrumb } from "@/components/breadcrumb";
import { TestCaseDetailEditor, type TestCaseRow } from "@/components/test-case-detail-editor";

export function TestCaseDetailPage({
  scenario,
  rows,
  suiteLabel,
  suiteToken,
  plan,
}: {
  scenario: Record<string, unknown>;
  rows: Array<Record<string, string | number>>;
  suiteLabel: string;
  suiteToken: string;
  plan: any;
}) {
  const suiteId = String(scenario.id ?? "");
  const planLabel = plan?.title || "Test Plan";
  const planToken = plan?.publicToken || plan?.id;

  const crumbs = [
    { label: "Test Plans", href: "/test-plans" },
  ] as { label: string; href?: string }[];

  if (plan) {
    crumbs.push({ label: planLabel, href: `/test-plans/detail/${planToken}` });
  }

  crumbs.push({ label: suiteLabel || suiteId, href: `/test-suites/execute/${suiteToken}` });
  crumbs.push({ label: "Cases" });

  return (
    <PageShell
      eyebrow="Test Cases"
      title={suiteLabel || "Test Case Detail"}
      description="Spreadsheet-style input for all test cases in this suite."
      actions={
        suiteId ? (
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">Suite: {suiteLabel || suiteId}</span>
            <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700">Cases: {rows.length}</span>
            {suiteToken && (
              <Link href={`/test-suites/execute/${suiteToken}`} className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-3 py-1 text-xs font-bold text-sky-700 transition hover:bg-sky-50">
                <ArrowLeft size={14} weight="bold" />
                Back to Execution Detail
              </Link>
            )}
          </div>
        ) : undefined
      }
      controls={<div className="flex flex-wrap items-center justify-between gap-3"><span className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">test suite ID: {suiteId}</span></div>}
    >
      <Breadcrumb crumbs={crumbs} className="mb-2" />
      <TestCaseDetailEditor suiteId={suiteId} suiteTitle={suiteLabel || "Test Case Detail"} initialCases={rows as unknown as TestCaseRow[]} />
    </PageShell>
  );
}
