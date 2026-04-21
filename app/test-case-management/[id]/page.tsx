import { notFound } from "next/navigation";
import { getTestCaseScenario, getTestCasesByScenario } from "@/lib/data";
import { TestCaseGrid } from "@/components/test-case-grid";
import { PageShell } from "@/components/page-shell";
import { Breadcrumb } from "@/components/breadcrumb";

export const dynamic = "force-dynamic";

export default async function TestCaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const scenarioId = id;

  if (!scenarioId) {
    notFound();
  }

  const scenario = await getTestCaseScenario(scenarioId);

  if (!scenario) {
    notFound();
  }

  const testCases = await getTestCasesByScenario(scenarioId);

  // RSC boundary requires strictly plain objects
  const plainScenario = JSON.parse(JSON.stringify(scenario));
  const rows = JSON.parse(JSON.stringify(testCases)).map((row: Record<string, string | number>) => ({
    ...row,
    id: Number(row.id),
  }));

  return (
    <PageShell
      eyebrow="Test Cases"
      title={String((scenario as any).moduleName)}
      description="Scenario details and executable cases for this module."
      actions={
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700">
            Project: {String((scenario as any).projectName)}
          </span>
          <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">
            Ref: {String((scenario as any).referenceDocument)}
          </span>
        </div>
      }
      controls={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
            ID: TCS-{String((scenario as any).id).substring(0, 8)}
          </span>
          <span className="text-xs font-semibold text-slate-500">
            Created by {String((scenario as any).createdBy)}
          </span>
        </div>
      }
    >
      <Breadcrumb crumbs={[{ label: "Test Cases", href: "/test-case-management" }, { label: String((scenario as any).moduleName) }]} className="mb-2" />
      <TestCaseGrid scenario={plainScenario} rows={rows} />
    </PageShell>
  );
}
