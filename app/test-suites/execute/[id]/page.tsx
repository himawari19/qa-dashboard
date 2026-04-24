import { getTestSuiteByToken, getTestCasesByIdStrings } from "@/lib/data";
import { notFound } from "next/navigation";
import { SuiteExecutionView } from "./execution-view";
import { Breadcrumb } from "@/components/breadcrumb";
import Link from "next/link";

export const dynamic = "force-dynamic";

type SuiteRow = {
  id: string | number;
  title: string;
  testPlanId: string;
};

export default async function SuiteExecutePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: token } = await params;
  const suiteRaw = (await getTestSuiteByToken(token)) as SuiteRow | null;
  if (!suiteRaw) notFound();

  const suiteId = String(suiteRaw.id);
  const suiteToken = String((suiteRaw as Record<string, unknown>).publicToken ?? token);
  const casesRaw = await getTestCasesByIdStrings(suiteId);
  
  const suite = JSON.parse(JSON.stringify(suiteRaw));
  const cases = JSON.parse(JSON.stringify(casesRaw));

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <Breadcrumb crumbs={[{ label: "Test Suites", href: "/test-suites" }, { label: suite.title }]} className="mb-4" />
      <div className="mb-4 flex justify-end">
        <Link
          href={`/test-cases/detail/${suiteToken}`}
          className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-4 py-2 text-sm font-semibold text-sky-700 shadow-sm transition hover:bg-sky-50"
        >
          Add Test Case
        </Link>
      </div>
      <SuiteExecutionView suite={suite} cases={cases} scenarioId={suiteId} />
    </div>
  );
}
