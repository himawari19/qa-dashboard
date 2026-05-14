import { getTestSuiteByToken, getTestCasesByIdStrings, getTestPlanById } from"@/lib/data";
import { notFound } from"next/navigation";
import { ExecutionView } from"./execution-view";

export const dynamic ="force-dynamic";

type ExecutionGroupRow = {
 id: string | number;
 title: string;
 testPlanId: string;
 publicToken: string;
};

export default async function SuiteExecutePage({ params }: { params: Promise<{ id: string }> }) {
 const { id: token } = await params;
 const executionGroupRaw = (await getTestSuiteByToken(token)) as ExecutionGroupRow | null;
 if (!executionGroupRaw) notFound();

 const executionGroupId = String(executionGroupRaw.id);
 const executionToken = String((executionGroupRaw as Record<string, unknown>).publicToken ?? token);
 const casesRaw = await getTestCasesByIdStrings(executionGroupId);

 let project ="";
 let sprint ="";
 if (executionGroupRaw.testPlanId) {
 const plan = await getTestPlanById(executionGroupRaw.testPlanId) as Record<string, unknown> | null;
 project = String(plan?.project ??"");
 sprint = String(plan?.sprint ??"");
}

 const executionGroup = { ...JSON.parse(JSON.stringify(executionGroupRaw)), project, sprint };
 const cases = JSON.parse(JSON.stringify(casesRaw));

 return (
 <div className="min-h-screen bg-slate-50/50">
 <ExecutionView
 executionGroup={executionGroup}
 cases={cases}
 scenarioId={executionGroupId}
 executionToken={executionToken}
 />
 </div>
 );
}
