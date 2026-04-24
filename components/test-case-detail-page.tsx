"use client";

import React, { useTransition } from "react";
import { useRouter } from "next/navigation";
import { PlayCircle } from "@phosphor-icons/react";
import { PageShell } from "@/components/page-shell";
import { toast } from "@/components/ui/toast";
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
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
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

  async function handleSubmitExecution() {
    if (rows.length === 0 || isPending) return;
    
    const total = rows.length;
    const p = rows.filter(c => String(c.status) === "Passed" || String(c.status) === "Success").length;
    const f = rows.filter(c => String(c.status) === "Failed").length;
    const b = rows.filter(c => String(c.status) === "Blocked").length;

    let resVal = "Pending";
    if (f > 0) resVal = "failed";
    else if (b > 0) resVal = "blocked";
    else if (p === total && total > 0) resVal = "passed";
    else if (p > 0) resVal = "partial";

    startTransition(async () => {
      const fd = new FormData();
      fd.append("date", new Date().toISOString().split("T")[0]);
      fd.append("project", suiteLabel.split(" ")[0] || "Project");
      fd.append("sprint", "Active");
      fd.append("tester", "QA Specialist");
      fd.append("scope", suiteLabel);
      fd.append("totalCases", String(total));
      fd.append("passed", String(p));
      fd.append("failed", String(f));
      fd.append("blocked", String(b));
      fd.append("result", resVal);
      fd.append("notes", `Automated submission from suite ${suiteLabel}`);
      
      try {
        const res = await fetch("/api/items/test-sessions", { method: "POST", body: fd });
        if (res.ok) {
          toast("Execution session recorded!", "success");
          router.push("/test-sessions");
        } else {
          toast("Failed to record session", "error");
        }
      } catch (err) {
        toast("An error occurred", "error");
      }
    });
  }

  const actions = (
    <button 
      onClick={handleSubmitExecution} 
      disabled={isPending || rows.length === 0}
      className="flex h-10 items-center gap-2 rounded-md bg-sky-600 px-4 text-xs font-bold text-white transition hover:bg-sky-700 disabled:opacity-50"
    >
      <PlayCircle size={18} weight="bold" />
      Submit for Test Execution
    </button>
  );

  return (
    <PageShell
      eyebrow="Test Cases"
      title={suiteLabel || "Test Case Detail"}
      description="Spreadsheet-style input for all test cases in this suite."
      crumbs={crumbs}
      actions={actions}
    >
      <TestCaseDetailEditor 
        suiteId={suiteId} 
        suiteTitle={suiteLabel || "Test Case Detail"} 
        initialCases={rows as unknown as TestCaseRow[]} 
      />
    </PageShell>
  );
}
