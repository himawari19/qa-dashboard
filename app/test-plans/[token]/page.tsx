import { notFound } from "next/navigation";
import { getTestPlanByToken, getTestSuitesByPlanId, getTestCasesByScenario } from "@/lib/data";
import { TestPlanDetail } from "./test-plan-detail";

export const dynamic = "force-dynamic";

export default async function TestPlanDetailPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const planRaw = await getTestPlanByToken(token);
  if (!planRaw) notFound();
  const plan = JSON.parse(JSON.stringify(planRaw));

  const planId = String(plan.id);
  const suitesRaw = await getTestSuitesByPlanId(planId);
  const suites = JSON.parse(JSON.stringify(suitesRaw));

  const suitesWithCases = await Promise.all(
    suites.map(async (suite: Record<string, unknown>) => {
      const casesRaw = await getTestCasesByScenario(suite.id as string);
      const cases = JSON.parse(JSON.stringify(casesRaw));
      return { ...suite, cases };
    })
  );

  return <TestPlanDetail plan={plan} suites={suitesWithCases} />;
}
