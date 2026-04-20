import { db } from "@/lib/db";
import { Badge } from "@/components/badge";
import { PageShell } from "@/components/page-shell";

export const dynamic = "force-dynamic";

type ScenarioRow = {
  id: string;
  moduleName: string;
  projectName: string;
};

type BugRow = {
  id: number;
  title: string;
};

export default async function RtmPage() {
  let scenarios: ScenarioRow[] = [];
  let bugs: BugRow[] = [];

  try {
    scenarios = await db.query<ScenarioRow>('SELECT * FROM "TestCaseScenario"');
  } catch (error) {
    console.error("Failed to load RTM scenarios:", error);
  }

  try {
    bugs = await db.query<BugRow>('SELECT * FROM "Bug"');
  } catch (error) {
    console.error("Failed to load RTM bugs:", error);
  }

  return (
    <PageShell
      eyebrow="Reports"
      title="Traceability Matrix"
      description="Mapping scenarios to defects."
    >
      <div className="space-y-4">
        {scenarios.length > 0 ? (
          scenarios.map((scenario) => {
            const linkedBugs = bugs.filter((bug) => bug.title.includes(scenario.moduleName));
            return (
              <div key={scenario.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="font-bold text-slate-900">{scenario.moduleName}</h3>
                <p className="mb-3 text-xs text-slate-400">{scenario.projectName}</p>
                <div className="flex flex-wrap gap-2">
                  {linkedBugs.length > 0 ? (
                    linkedBugs.map((bug) => <Badge key={bug.id} value={bug.title} />)
                  ) : (
                    <span className="text-sm text-slate-500">No linked bugs.</span>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
            No scenarios found.
          </div>
        )}
      </div>
    </PageShell>
  );
}
