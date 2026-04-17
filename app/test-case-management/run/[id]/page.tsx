import React from "react";
import { db } from "@/lib/db";
import { TestRunnerUI } from "@/components/test-runner-ui";
import { notFound } from "next/navigation";

type ScenarioRow = {
  id: string;
  title: string;
};

type TestCaseRow = {
  id: number;
  scenarioId: string;
};

export default async function TestRunnerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const scenario = await db.get<ScenarioRow>('SELECT * FROM "TestCaseScenario" WHERE id = ?', [id]);
  
  if (!scenario) notFound();

  if (!scenario) return <div>Scenario not found</div>;
  const testCases = await db.query<TestCaseRow>('SELECT * FROM "TestCase" WHERE scenarioId = ? ORDER BY id ASC', [id]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <header className="flex items-center justify-between">
        <div>
           <span className="text-[10px] font-black uppercase tracking-[0.3em] text-sky-600">Test Execution Mode</span>
           <h1 className="text-3xl font-black text-slate-900 tracking-tight">{scenario.title}</h1>
        </div>
      </header>

      <TestRunnerUI scenarioId={id} initialCases={testCases} />
    </div>
  );
}
