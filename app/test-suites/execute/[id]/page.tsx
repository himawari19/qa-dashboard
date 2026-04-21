import { getTestSuite, getTestCasesByIdStrings } from "@/lib/data";
import { notFound } from "next/navigation";
import { SuiteExecutionView } from "./execution-view";
import { Breadcrumb } from "@/components/breadcrumb";

export const dynamic = "force-dynamic";

type SuiteRow = {
  id: string | number;
  title: string;
  project: string;
  caseIds?: string;
};

export default async function SuiteExecutePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const suiteRaw = await getTestSuite(id) as SuiteRow | null;
  if (!suiteRaw) notFound();

  const caseIds = String(suiteRaw.caseIds ?? "").trim();
  const casesRaw = caseIds ? await getTestCasesByIdStrings(caseIds) : [];
  
  const suite = JSON.parse(JSON.stringify(suiteRaw));
  const cases = JSON.parse(JSON.stringify(casesRaw));

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <Breadcrumb crumbs={[{ label: "Test Suites", href: "/test-suites" }, { label: suite.title }]} className="mb-4" />
      <SuiteExecutionView suite={suite} cases={cases} scenarioId={id} />
    </div>
  );
}
