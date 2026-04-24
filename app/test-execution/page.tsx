import { getModuleRows } from "@/lib/data";
import { PageShell } from "@/components/page-shell";
import { Breadcrumb } from "@/components/breadcrumb";
import { Badge } from "@/components/badge";
import Link from "next/link";
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock,
  ArrowRight,
  ClipboardText,
  Table
} from "@phosphor-icons/react/dist/ssr";

export const dynamic = "force-dynamic";

export default async function TestExecutionPage() {
  const suitesRaw = await getModuleRows("test-suites");
  const plansRaw = await getModuleRows("test-plans");
  
  const suites = JSON.parse(JSON.stringify(suitesRaw));
  const plans = JSON.parse(JSON.stringify(plansRaw));

  // Map plans for easy lookup
  const planMap = new Map();
  plans.forEach((p: any) => planMap.set(String(p.id), p));

  // Filter only active/draft suites for execution
  const activeSuites = suites.filter((s: any) => s.status !== "archived");

  // Group by plan
  const grouped = new Map();
  activeSuites.forEach((suite: any) => {
    const planId = String(suite.testPlanId || "unplanned");
    const plan = planMap.get(planId);
    const planName = plan?.title || "Standalone Suites";
    const project = plan?.project || "General";
    
    if (!grouped.has(planId)) {
      grouped.set(planId, {
        planName,
        project,
        suites: []
      });
    }
    grouped.get(planId).suites.push(suite);
  });

  const planGroups = Array.from(grouped.values());

  return (
    <PageShell 
      eyebrow="Execution" 
      title="Execution Center" 
      description="Select a test suite to begin your execution session. All results are tracked automatically."
    >
      <Breadcrumb crumbs={[{ label: "Test Execution" }]} className="mb-6" />

      {planGroups.length === 0 ? (
        <div className="rounded-md border border-dashed border-slate-200 bg-slate-50/50 p-20 text-center dark:border-slate-800 dark:bg-slate-900/50">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-md bg-slate-100 text-slate-400 dark:bg-slate-800">
            <Play size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">No active suites found</h3>
          <p className="mt-2 text-slate-500 max-w-sm mx-auto">Create a test suite and set its status to Active or Draft to start executing cases.</p>
          <Link href="/test-suites" className="mt-6 inline-flex items-center gap-2 rounded-md bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700 shadow-lg shadow-indigo-500/20">
            Manage Test Suites
          </Link>
        </div>
      ) : (
        <div className="space-y-10 pb-20">
          {planGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-4">
              <div className="flex items-end justify-between px-1">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-500 mb-1">
                    <ClipboardText size={14} weight="bold" />
                    {group.project}
                  </div>
                  <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                    {group.planName}
                  </h3>
                </div>
                <div className="text-[11px] font-semibold text-slate-400">
                  {group.suites.length} Suite{group.suites.length !== 1 ? 's' : ''}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.suites.map((suite: any) => (
                  <div 
                    key={suite.id} 
                    className="group relative flex flex-col overflow-hidden rounded-md border border-slate-200 bg-white p-5 transition-all hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-900"
                  >
                    <div className="mb-4 flex items-start justify-between">
                      <div className="h-10 w-10 rounded-md bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors dark:bg-slate-800 dark:group-hover:bg-indigo-950/30">
                        <Table size={20} weight="bold" />
                      </div>
                      <Badge value={suite.status} />
                    </div>

                    <h4 className="mb-1 text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {suite.title}
                    </h4>
                    <p className="mb-6 text-sm text-slate-500 line-clamp-2 min-h-[40px]">
                      {suite.notes || "No additional notes provided for this suite."}
                    </p>

                    <div className="mt-auto flex items-center justify-between border-t border-slate-50 pt-4 dark:border-slate-800/50">
                      <div className="flex items-center gap-3 text-xs font-bold text-slate-400">
                        <div className="flex items-center gap-1">
                          <CheckCircle size={14} className="text-emerald-500" />
                          {suite.passed || 0}
                        </div>
                        <div className="flex items-center gap-1">
                          <XCircle size={14} className="text-rose-500" />
                          {suite.failed || 0}
                        </div>
                      </div>
                      
                      <Link 
                        href={`/test-suites/execute/${suite.publicToken}`}
                        className="inline-flex h-9 items-center gap-2 rounded-md bg-slate-900 px-4 text-xs font-black uppercase tracking-wider text-white transition-all hover:bg-indigo-600 hover:pr-5 dark:bg-white dark:text-slate-900 dark:hover:bg-indigo-50"
                      >
                        Execute
                        <Play size={14} weight="fill" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}
