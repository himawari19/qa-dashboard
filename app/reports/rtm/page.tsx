import { db } from "@/lib/db";
import { Badge } from "@/components/badge";
import { PageShell } from "@/components/page-shell";

export const dynamic = "force-dynamic";

type ScenarioRow = {
  id: string;
  moduleName: string;
  projectName: string;
  traceability?: string | null;
};

type BugRow = {
  id: number;
  title: string;
};

type TestCaseCount = { total: number; executed: number };

async function getTestCaseCoverage(scenarioId: string): Promise<TestCaseCount> {
  try {
    const total = await db.get<{ count: number }>(
      'SELECT COUNT(*) as count FROM "TestCase" WHERE "scenarioId" = ?',
      [scenarioId]
    );
    const executed = await db.get<{ count: number }>(
      'SELECT COUNT(*) as count FROM "TestCase" WHERE "scenarioId" = ? AND status != ?',
      [scenarioId, "Pending"]
    );
    return { total: Number(total?.count ?? 0), executed: Number(executed?.count ?? 0) };
  } catch {
    return { total: 0, executed: 0 };
  }
}

export default async function RtmPage() {
  let scenarios: ScenarioRow[] = [];
  let bugs: BugRow[] = [];

  try {
    scenarios = JSON.parse(JSON.stringify(await db.query<ScenarioRow>('SELECT * FROM "TestCaseScenario"')));
  } catch (error) {
    console.error("Failed to load RTM scenarios:", error);
  }

  try {
    bugs = JSON.parse(JSON.stringify(await db.query<BugRow>('SELECT * FROM "Bug"')));
  } catch (error) {
    console.error("Failed to load RTM bugs:", error);
  }

  const coverageMap = await Promise.all(
    scenarios.map(async (s) => ({ id: s.id, ...(await getTestCaseCoverage(s.id)) }))
  );
  const coverageById = Object.fromEntries(coverageMap.map((c) => [c.id, c]));

  return (
    <PageShell
      eyebrow="Reports"
      title="Traceability Matrix"
      description="Map scenarios to linked defects for quick coverage checks."
    >
      <div className="space-y-4">
        {scenarios.length > 0 ? (
          scenarios.map((scenario) => {
            const linkedBugs = bugs.filter((bug) => {
              if (scenario.traceability) {
                return scenario.traceability.includes(bug.title) || bug.title.includes(scenario.traceability);
              }
              return bug.title.includes(scenario.moduleName);
            });
            const cov = coverageById[scenario.id] ?? { total: 0, executed: 0 };
            const pct = cov.total > 0 ? Math.round((cov.executed / cov.total) * 100) : 0;

            return (
              <div key={scenario.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-900">{scenario.moduleName}</h3>
                    <p className="mb-1 text-xs text-slate-400">{scenario.projectName}</p>
                    {scenario.traceability && (
                      <p className="mb-3 text-xs font-semibold text-sky-600">Traceability: {scenario.traceability}</p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {linkedBugs.length > 0 ? (
                        linkedBugs.map((bug) => <Badge key={bug.id} value={bug.title} />)
                      ) : (
                        <span className="text-sm text-slate-500">No linked bugs.</span>
                      )}
                    </div>
                  </div>
                  {/* Upgrade 8: execution coverage */}
                  <div className="shrink-0 text-right">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Execution</p>
                    <p className="text-2xl font-black text-sky-700">{pct}%</p>
                    <p className="text-[10px] text-slate-400">{cov.executed}/{cov.total} cases</p>
                  </div>
                </div>
                {cov.total > 0 && (
                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-sky-500 transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                )}
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
