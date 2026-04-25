import { notFound } from "next/navigation";
import { getTestPlanByToken, getTestSuitesByPlanId, getTestCasesByIdStrings } from "@/lib/data";
import { PageShell } from "@/components/page-shell";
import { Breadcrumb } from "@/components/breadcrumb";
import { Badge } from "@/components/badge";
import Link from "next/link";
import { 
  FolderSimple, 
  Target, 
  CaretRight, 
  Play, 
  CheckCircle, 
  XCircle, 
  Table 
} from "@phosphor-icons/react/dist/ssr";

export const dynamic = "force-dynamic";

type TestCaseEntity = {
  status: string;
};

type SuiteEntity = {
  id: string;
  publicToken: string;
  title: string;
  assignee: string;
  status: string;
  notes?: string;
};

export default async function TestPlanDetailPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const planRaw = await getTestPlanByToken(token);
  if (!planRaw) notFound();
  const plan = JSON.parse(JSON.stringify(planRaw));

  const planId = String(plan.id);
  const suitesRaw = await getTestSuitesByPlanId(planId);
  const suites = JSON.parse(JSON.stringify(suitesRaw)) as SuiteEntity[];

  // Compute stats per suite
  const suiteStats = await Promise.all(
    suites.map(async (suite) => {
      const casesRaw = await getTestCasesByIdStrings(suite.id);
      const cases = JSON.parse(JSON.stringify(casesRaw)) as TestCaseEntity[];
      const total = cases.length;
      let passed = 0;
      let failed = 0;
      cases.forEach((c) => {
        const s = String(c.status).toLowerCase();
        if (s === "passed") passed++;
        if (s === "failed") failed++;
      });
      return { ...suite, total, passed, failed };
    })
  );

  const totalSuites = suites.length;
  const totalCases = suiteStats.reduce((sum, s) => sum + s.total, 0);
  const totalPassed = suiteStats.reduce((sum, s) => sum + s.passed, 0);
  const totalFailed = suiteStats.reduce((sum, s) => sum + s.failed, 0);
  const successRate = totalCases > 0 ? Math.round((totalPassed / totalCases) * 100) : 0;

  return (
    <PageShell 
      eyebrow="Test Plans" 
      title={plan.title || "Untitled Plan"} 
      description="Comprehensive suite tracking and execution readiness."
      crumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Test Plans", href: "/test-plans" }, { label: plan.title || "Plan Detail" }]}
    >
      
      {/* Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 mb-2">
            <FolderSimple size={20} weight="bold" className="text-blue-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider">Project Info</h3>
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-white truncate">
            {plan.project || "-"}
          </div>
          <div className="text-sm font-semibold text-slate-500 mt-1">
            Sprint: {plan.sprint || "N/A"}
          </div>
        </div>

        <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 mb-2">
            <Target size={20} weight="bold" className="text-blue-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider">Goal Progress</h3>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {successRate}% 
            <span className="text-sm font-semibold text-slate-500 ml-2">Success Rate</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-md mt-3 overflow-hidden flex">
            <div style={{ width: `${totalCases ? (totalPassed/totalCases)*100 : 0}%` }} className="bg-blue-600 h-full transition-all"></div>
            <div style={{ width: `${totalCases ? (totalFailed/totalCases)*100 : 0}%` }} className="bg-sky-400 h-full transition-all"></div>
          </div>
        </div>

        <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 mb-2">
            <CheckCircle size={20} weight="bold" className="text-blue-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider">Passed / Total</h3>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {totalPassed} <span className="text-slate-400 font-medium">/</span> {totalCases}
          </div>
          <div className="text-sm font-semibold text-blue-600 dark:text-blue-400 mt-1">
            Cases verified
          </div>
        </div>

        <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Plan Status</h3>
            <Badge value={plan.status} />
          </div>
          <div className="flex items-center justify-between text-sm py-1 border-t border-slate-100 dark:border-slate-700/50 mt-1">
            <span className="text-slate-500">Start:</span>
            <span className="font-semibold text-slate-700 dark:text-slate-200">{plan.startDate || "-"}</span>
          </div>
          <div className="flex items-center justify-between text-sm py-1">
            <span className="text-slate-500">End:</span>
            <span className="font-semibold text-slate-700 dark:text-slate-200">{plan.endDate || "-"}</span>
          </div>
        </div>
      </div>

      {/* Linked Suites List */}
      <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mb-4">
        Linked Test Suites <span className="text-slate-400 ml-2 text-sm font-semibold">({totalSuites})</span>
      </h3>
      
      {suiteStats.length === 0 ? (
        <div className="rounded-md border border-slate-200 border-dashed bg-slate-50 p-10 text-center dark:border-slate-700 dark:bg-slate-800/50">
          <p className="text-base font-bold text-slate-700 dark:text-slate-200">No test suites linked yet</p>
          <p className="mt-1 text-sm text-slate-500">Create a test suite and select this plan to link it.</p>
          <Link href="/test-suites" className="mt-4 inline-flex items-center gap-2 rounded-md bg-sky-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-sky-700">
            Go to Test Suites
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {suiteStats.map((suite) => (
            <div key={suite.id} className="group relative overflow-hidden rounded-md border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                      {suite.title}
                    </h4>
                    <Badge value={suite.status} />
                  </div>
                  <p className="text-sm text-slate-500 line-clamp-1 max-w-2xl">
                    {suite.notes || "No additional notes provided."}
                  </p>
                  {suite.assignee && (
                    <div className="text-xs font-semibold text-slate-400 mt-2 bg-slate-100 dark:bg-slate-700/50 inline-block px-2 py-1 rounded-md">
                      Assignee: <span className="text-slate-600 dark:text-slate-300">{suite.assignee}</span>
                    </div>
                  )}
                </div>

                {/* Right side stats & actions */}
                <div className="flex flex-wrap items-center gap-6 shrink-0 border-t border-slate-100 dark:border-slate-700/50 pt-4 md:border-none md:pt-0">
                  <div className="flex items-center gap-4 text-center">
                    <div>
                      <div className="text-xs font-bold text-slate-400 uppercase">Total</div>
                      <div className="text-lg font-black text-slate-700 dark:text-slate-200">{suite.total}</div>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-emerald-500 uppercase">Pass</div>
                      <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">{suite.passed}</div>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-rose-500 uppercase">Fail</div>
                      <div className="text-lg font-black text-rose-600 dark:text-rose-400">{suite.failed}</div>
                    </div>
                  </div>

                  <div className="h-10 w-px bg-slate-200 dark:bg-slate-700 hidden md:block"></div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Link
                      href={`/test-cases/detail/${suite.publicToken}`}
                      className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-sky-200 bg-sky-50 px-4 text-xs font-bold tracking-wide text-sky-700 transition hover:bg-sky-100 hover:text-sky-800 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-400 dark:hover:bg-sky-900"
                    >
                      <Table size={14} weight="bold" />
                      TEST CASES
                    </Link>
                    <Link
                      href={`/test-suites/execute/${suite.publicToken}`}
                      className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-slate-900 px-4 text-xs font-bold tracking-wide text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white shadow-sm"
                    >
                      <Play size={14} weight="fill" className="text-emerald-400 dark:text-emerald-500" />
                      EXECUTE
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}
