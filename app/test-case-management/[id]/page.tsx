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

  const projectName = String((scenario as any).projectName || "");
  const referenceDocument = String((scenario as any).referenceDocument || "");
  const createdBy = String((scenario as any).createdBy || "");

  return (
    <PageShell
      eyebrow="Test Cases"
      title={String((scenario as any).moduleName)}
      description="Scenario details and executable cases for this module."
      actions={
        (projectName || referenceDocument) ? (
          <div className="flex flex-wrap gap-2">
            {projectName && (
              <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700">
                Project: {projectName}
              </span>
            )}
            {referenceDocument && (
              referenceDocument.startsWith("http") ? (
                <a href={referenceDocument} target="_blank" rel="noreferrer"
                  className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700 hover:bg-violet-100 transition">
                  Ref: {referenceDocument}
                </a>
              ) : (
                <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">
                  Ref: {referenceDocument}
                </span>
              )
            )}
          </div>
        ) : undefined
      }
      controls={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
            ID: TCS-{String((scenario as any).id).substring(0, 8)}
          </span>
          {createdBy && (
            <span className="text-xs font-semibold text-slate-500">
              Created by {createdBy}
            </span>
          )}
        </div>
      }
    >
      <Breadcrumb crumbs={[{ label: "Test Cases", href: "/test-case-management" }, { label: String((scenario as any).moduleName) }]} className="mb-2" />
      <TestCaseGrid scenario={plainScenario} rows={rows} />
    </PageShell>
  );
}
