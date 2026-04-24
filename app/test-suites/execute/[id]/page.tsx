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
    <div className="min-h-screen bg-slate-50/50 dark:bg-black">
      <SuiteExecutionView 
        suite={suite} 
        cases={cases} 
        scenarioId={suiteId} 
        suiteToken={suiteToken}
      />
    </div>
  );
}
