import { notFound } from "next/navigation";
import { getTestCasesByScenario, getTestSuiteByToken, getTestPlanById } from "@/lib/data";
import { TestCaseDetailPage } from "@/components/test-case-detail-page";

export const dynamic = "force-dynamic";

export default async function TestCaseDetailPageRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id: token } = await params;
  if (!token) notFound();

  const suite = await getTestSuiteByToken(token);
  if (!suite) notFound();

  const suiteId = String((suite as Record<string, unknown>).id ?? "");
  const suiteLabel = String((suite as Record<string, unknown>).title ?? "");
  const suiteToken = String((suite as Record<string, unknown>).publicToken ?? token);
  const planId = String((suite as Record<string, unknown>).testPlanId ?? "");
  
  const plan = planId ? await getTestPlanById(planId) : null;
  const testCases = suiteId ? await getTestCasesByScenario(suiteId) : [];

  const rows = JSON.parse(JSON.stringify(testCases)).map((row: Record<string, string | number>) => ({ ...row, id: Number(row.id) }));
  const plainSuite = JSON.parse(JSON.stringify(suite));
  const plainPlan = plan ? JSON.parse(JSON.stringify(plan)) : null;

  return (
    <TestCaseDetailPage 
      scenario={plainSuite} 
      rows={rows} 
      suiteLabel={suiteLabel} 
      suiteToken={suiteToken}
      plan={plainPlan}
    />
  );
}
