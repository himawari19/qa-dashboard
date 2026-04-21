import { db } from "@/lib/db";
import { TestRunnerUI } from "@/components/test-runner-ui";
import { PageShell } from "@/components/page-shell";
import { Breadcrumb } from "@/components/breadcrumb";
import { notFound } from "next/navigation";

type ScenarioRow = {
  id: string;
  title: string;
};

type TestCaseRow = {
  id: number;
  scenarioId: string;
  testStep?: string;
  expectedResult?: string;
  preCondition?: string;
  caseName?: string;
};

export const dynamic = "force-dynamic";

export default async function TestRunnerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let scenario: ScenarioRow | undefined;
  let testCases: TestCaseRow[] = [];

  try {
    const raw = await db.get<ScenarioRow>('SELECT * FROM "TestCaseScenario" WHERE id = ?', [id]);
    scenario = raw ? JSON.parse(JSON.stringify(raw)) : undefined;
  } catch (error) {
    console.error("Failed to load scenario:", error);
  }

  if (!scenario) notFound();

  try {
    testCases = JSON.parse(JSON.stringify(
      await db.query<TestCaseRow>('SELECT * FROM "TestCase" WHERE scenarioId = ? ORDER BY id ASC', [id])
    ));
  } catch (error) {
    console.error("Failed to load test cases:", error);
  }

  return (
    <PageShell
      eyebrow="Test Execution Mode"
      title={scenario.title}
      description="Run through test cases and record results."
    >
      <Breadcrumb crumbs={[{ label: "Test Cases", href: "/test-case-management" }, { label: scenario.title, href: `/test-case-management/${id}` }, { label: "Run" }]} className="mb-2" />
      <TestRunnerUI scenarioId={id} initialCases={testCases as any[]} />
    </PageShell>
  );
}
