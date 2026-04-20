import { getTestSuite, getTestCasesByIdStrings } from "@/lib/data";
import { notFound } from "next/navigation";
import { SuiteExecutionView } from "./execution-view";

export const dynamic = "force-dynamic";

export default async function SuiteExecutePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const suiteRaw = await getTestSuite(id);
  if (!suiteRaw) notFound();

  const caseIds = String((suiteRaw as any).caseIds ?? "").trim();
  const casesRaw = caseIds ? await getTestCasesByIdStrings(caseIds) : [];
  
  const suite = JSON.parse(JSON.stringify(suiteRaw));
  const cases = JSON.parse(JSON.stringify(casesRaw));

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <SuiteExecutionView suite={suite} cases={cases} />
    </div>
  );
}
