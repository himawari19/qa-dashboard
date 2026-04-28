import { getModuleRows } from "@/lib/data";
import { PageShell } from "@/components/page-shell";
import { ClipboardText } from "@phosphor-icons/react/dist/ssr";
import { Play } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { ExecutionSuiteGroup } from "./execution-suite-group";

export const dynamic = "force-dynamic";

export default async function TestExecutionPage() {
  const suitesRaw = await getModuleRows("test-suites");
  const plansRaw = await getModuleRows("test-plans");

  const suites = JSON.parse(JSON.stringify(suitesRaw));
  const plans = JSON.parse(JSON.stringify(plansRaw));

  const planMap = new Map();
  plans.forEach((p: any) => planMap.set(String(p.id), p));

  const activeSuites = suites.filter((s: any) => s.status !== "archived");

  const grouped = new Map();
  activeSuites.forEach((suite: any) => {
    const planId = String(suite.testPlanId || "unplanned");
    const plan = planMap.get(planId);
    const planName = plan?.title || "Standalone Suites";
    const project = plan?.project || "General";

    if (!grouped.has(planId)) {
      grouped.set(planId, { planName, project, suites: [] });
    }
    grouped.get(planId).suites.push(suite);
  });

  const planGroups = Array.from(grouped.values());

  return (
    <PageShell
      eyebrow="Execution"
      title="Execution Center"
      description="Select a test suite to begin your execution session. All results are tracked automatically."
      crumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Test Execution" }]}
    >
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
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-500 mb-1">
                    <ClipboardText size={14} weight="bold" />
                    {group.project}
                  </div>
                  <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                    {group.planName}
                  </h3>
                </div>
                <div className="text-[11px] font-semibold text-slate-400">
                  {group.suites.length} Suite{group.suites.length !== 1 ? "s" : ""}
                </div>
              </div>

              <ExecutionSuiteGroup suites={group.suites} />
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}
