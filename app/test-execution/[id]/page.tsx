import { getTestSuiteByToken, getTestCasesByIdStrings, getTestPlanById } from "@/lib/data";
import { notFound } from "next/navigation";
import { SuiteExecutionView } from "./execution-view";

export const dynamic = "force-dynamic";

type SuiteRow = {
  id: string | number;
  title: string;
  testPlanId: string;
  publicToken: string;
};

export default async function SuiteExecutePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: token } = await params;
  const suiteRaw = (await getTestSuiteByToken(token)) as SuiteRow | null;
  if (!suiteRaw) notFound();

  const suiteId = String(suiteRaw.id);
  const suiteToken = String((suiteRaw as Record<string, unknown>).publicToken ?? token);
  const casesRaw = await getTestCasesByIdStrings(suiteId);

  let project = "";
  let sprint = "";
  if (suiteRaw.testPlanId) {
    const plan = await getTestPlanById(suiteRaw.testPlanId) as Record<string, unknown> | null;
    project = String(plan?.project ?? "");
    sprint = String(plan?.sprint ?? "");
  }

  const suite = { ...JSON.parse(JSON.stringify(suiteRaw)), project, sprint };
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
