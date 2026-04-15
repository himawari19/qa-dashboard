import { notFound } from "next/navigation";
import { getTestCaseScenario, getTestCasesByScenario } from "@/lib/data";
import { TestCaseGrid } from "@/components/test-case-grid";
import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";

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
    <div className="space-y-6">
      <section className="bg-white border-b border-[#c9d7e3]">
        <div className="flex items-center px-6 py-4 border-b border-[#d9e2ea] bg-slate-50 relative">
          <Link
            href="/test-case-management"
            className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-sky-700 transition"
          >
            <ArrowLeft size={16} weight="bold" />
            Back to Scenarios
          </Link>
        </div>
        <div className="px-6 py-6 border-b border-[#d9e2ea] bg-white">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-700">
            Scenario / Parent Context
          </p>
          <div className="mt-2 flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 leading-none">
                {String((scenario as any).moduleName)}
              </h2>
              <p className="mt-1.5 text-[10px] font-bold text-slate-400 tracking-wider">
                ID: TCS-{String((scenario as any).id).substring(0, 8)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 md:mt-1">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-700 border border-sky-200">
                PROJ: {String((scenario as any).projectName)}
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700 border border-purple-200">
                REF: {String((scenario as any).referenceDocument)}
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">
                BY: {String((scenario as any).createdBy)}
              </span>
            </div>
          </div>
        </div>
      </section>

      <TestCaseGrid
        scenario={plainScenario}
        rows={rows}
      />
    </div>
  );
}
