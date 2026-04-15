import { getTestSuite, getTestCasesByIdStrings } from "@/lib/data";
import { notFound } from "next/navigation";
import { SuiteExecutionView } from "./execution-view";

export default async function SuiteExecutePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const suiteRaw = await getTestSuite(id);
  if (!suiteRaw) notFound();

  const casesRaw = await getTestCasesByIdStrings((suiteRaw as any).caseIds as string);
  
  const suite = JSON.parse(JSON.stringify(suiteRaw));
  const cases = JSON.parse(JSON.stringify(casesRaw));

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <SuiteExecutionView suite={suite} cases={cases} />
    </div>
  );
}
