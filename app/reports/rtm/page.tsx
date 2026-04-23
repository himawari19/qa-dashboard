import { db } from "@/lib/db";
import { Badge } from "@/components/badge";
import { PageShell } from "@/components/page-shell";

export const dynamic = "force-dynamic";

type SuiteRow = {
  id: string;
  title: string;
};

type BugRow = {
  id: number;
  title: string;
};

type TestCaseCount = { total: number; executed: number };

async function getTestCaseCoverage(suiteId: string): Promise<TestCaseCount> {
  try {
    const total = await db.get<{ count: number }>(
      'SELECT COUNT(*) as count FROM "TestCase" WHERE "testSuiteId" = ? AND "deletedAt" IS NULL',
      [suiteId],
    );
    const executed = await db.get<{ count: number }>(
      'SELECT COUNT(*) as count FROM "TestCase" WHERE "testSuiteId" = ? AND "deletedAt" IS NULL AND status != ?',
      [suiteId, "Pending"],
    );
    return { total: Number(total?.count ?? 0), executed: Number(executed?.count ?? 0) };
  } catch {
    return { total: 0, executed: 0 };
  }
}

export default async function RtmPage() {
  const suites = JSON.parse(JSON.stringify(await db.query<SuiteRow>('SELECT id, title FROM "TestSuite" WHERE "deletedAt" IS NULL'))) as SuiteRow[];
  const bugs = JSON.parse(JSON.stringify(await db.query<BugRow>('SELECT id, title FROM "Bug" WHERE "deletedAt" IS NULL'))) as BugRow[];

  const coverageMap = await Promise.all(
    suites.map(async (s) => ({ id: s.id, ...(await getTestCaseCoverage(s.id)) })),
  );
  const coverageById = Object.fromEntries(coverageMap.map((c) => [c.id, c]));

  return (
    <PageShell eyebrow="Reports" title="Traceability Matrix" description="Map suites to linked defects and execution coverage.">
      <div className="space-y-4">
        {suites.length > 0 ? (
          suites.map((suite) => {
            const cov = coverageById[suite.id] || { total: 0, executed: 0 };
            const pct = cov.total ? Math.round((cov.executed / cov.total) * 100) : 0;
            const linkedBugs = bugs.filter((bug) => bug.title.includes(suite.title));
            return (
              <div key={suite.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-900">{suite.title}</h3>
                    <p className="mb-1 text-xs text-slate-400">Suite ID: {suite.id}</p>
                    <div className="flex flex-wrap gap-2">
                      {linkedBugs.length > 0 ? linkedBugs.map((bug) => <Badge key={bug.id} value={bug.title} />) : <span className="text-sm text-slate-500">No linked bugs.</span>}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Execution</p>
                    <p className="text-2xl font-black text-sky-700">{pct}%</p>
                    <p className="text-[10px] text-slate-400">{cov.executed}/{cov.total} cases</p>
                  </div>
                </div>
                {cov.total > 0 && (
                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-sky-500 transition-all duration-700" style={{ width: `${pct}%` }} />
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
            No suites found.
          </div>
        )}
      </div>
    </PageShell>
  );
}
