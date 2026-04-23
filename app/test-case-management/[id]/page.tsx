import { notFound } from "next/navigation";
import { getTestCaseScenario, getTestCasesByScenario } from "@/lib/data";
import { TestCaseGrid } from "@/components/test-case-grid";
import { PageShell } from "@/components/page-shell";
import { Breadcrumb } from "@/components/breadcrumb";

export const dynamic = "force-dynamic";

export default async function TestCaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const testCaseId = id;

  if (!testCaseId) {
    notFound();
  }

  const scenario = await getTestCaseScenario(testCaseId);

  if (!scenario) {
    notFound();
  }

  const testCases = await getTestCasesByScenario(String((scenario as any).testSuiteId || ""));

  // RSC boundary requires strictly plain objects
  const plainScenario = JSON.parse(JSON.stringify(scenario));
  const rows = JSON.parse(JSON.stringify(testCases)).map((row: Record<string, string | number>) => ({
    ...row,
    id: Number(row.id),
  }));

  const tcId = String((scenario as any).tcId || "");
  const caseName = String((scenario as any).caseName || "");
  const testSuiteId = String((scenario as any).testSuiteId || "");
  const typeCase = String((scenario as any).typeCase || "");

  return (
    <PageShell
      eyebrow="Test Cases"
      title={caseName || tcId}
      description="Test case details."
      actions={
        (tcId || testSuiteId) ? (
          <div className="flex flex-wrap gap-2">
            {tcId && (
              <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700">
                TC: {tcId}
              </span>
            )}
            {testSuiteId && (
              <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">
                Suite: {testSuiteId}
              </span>
            )}
            {typeCase && (
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                {typeCase}
              </span>
            )}
          </div>
        ) : undefined
      }
      controls={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
            ID: {String((scenario as any).id)}
          </span>
        </div>
      }
    >
      <Breadcrumb crumbs={[{ label: "Test Cases", href: "/test-case-management" }, { label: caseName || tcId }]} className="mb-2" />
      <TestCaseGrid scenario={plainScenario} rows={rows} />
    </PageShell>
  );
}
