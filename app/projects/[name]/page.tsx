import { notFound } from "next/navigation";
import { getProjectData } from "@/lib/data";
import { PageShell } from "@/components/page-shell";
import { Breadcrumb } from "@/components/breadcrumb";
import { Badge } from "@/components/badge";
import Link from "next/link";
import {
  FolderSimple,
  Target,
  Bug,
  ListChecks,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  Note
} from "@phosphor-icons/react/dist/ssr";

export const dynamic = "force-dynamic";

interface TestPlan {
  id: string;
  publicToken: string;
  title: string;
  sprint: string;
  status: string;
}

interface BugEntity {
  id: string | number;
  code: string;
  title: string;
  module: string;
  severity: string;
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ name: string }> }) {
  const { name: encodedName } = await params;
  const projectName = decodeURIComponent(encodedName);

  const rawData = await getProjectData(projectName);
  const data = JSON.parse(JSON.stringify(rawData));

  const stats = data.stats;
  const plans = data.plans as TestPlan[];
  const bugs = data.bugs as BugEntity[];

  return (
    <PageShell 
      eyebrow="Project Name" 
      title={projectName} 
      description="Comprehensive project quality overview and activity tracking."
      crumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Test Plan", href: "/test-plans" }, { label: projectName }]}
    >

      {/* Executive Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 mb-2">
            <Target size={20} weight="bold" className="text-blue-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider">Quality Score</h3>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {stats.successRate}%
          </div>
          <div className="text-sm font-semibold text-slate-500 mt-1">
            {stats.passed} / {stats.totalCases} cases passed
          </div>
        </div>

        <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 mb-2">
            <XCircle size={20} weight="bold" className="text-slate-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider">Failed Cases</h3>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {stats.totalBugs}
          </div>
          <div className="text-sm font-semibold text-rose-600 dark:text-rose-400 mt-1">
            Requiring attention
          </div>
        </div>

        <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 mb-2">
            <ListChecks size={20} weight="bold" className="text-blue-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider">Active Tasks</h3>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {stats.totalTasks}
          </div>
          <div className="text-sm font-semibold text-slate-500 mt-1">
            Pending completion
          </div>
        </div>

        <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 mb-2">
            <CheckCircle size={20} weight="bold" className="text-blue-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider">Passed Total</h3>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {stats.totalPlans}
          </div>
          <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
            Active cycles
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Test Plans Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FolderSimple size={22} weight="bold" className="text-blue-500" />
              Test Plans
            </h3>
            <Link href="/test-plans" className="text-xs font-bold text-blue-600 hover:underline">View All</Link>
          </div>
          <div className="space-y-3">
            {plans.map(plan => (
              <div
                key={plan.id}
                className="flex items-center justify-between p-4 rounded-md border border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm transition-all dark:border-slate-700 dark:bg-slate-800 dark:hover:border-blue-500"
              >
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">{plan.title}</div>
                  <div className="text-xs text-slate-500 mt-1">Sprint: {plan.sprint}</div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge value={plan.status} />
                  <Link 
                    href={`/test-plans/detail/${plan.publicToken}`}
                    className="inline-flex h-9 items-center gap-2 rounded-md bg-slate-900 px-4 text-xs font-bold text-white transition hover:bg-blue-600 dark:bg-white dark:text-slate-900 dark:hover:bg-blue-50"
                  >
                    View Plan
                  </Link>
                </div>
              </div>
            ))}
            {plans.length === 0 && <p className="text-sm text-slate-400 py-4">No test plans found.</p>}
          </div>
        </section>

        {/* Recent Bugs Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Bug size={22} weight="bold" className="text-rose-500" />
              Project Defects
            </h3>
            <Link href="/bugs" className="text-xs font-bold text-rose-600 hover:underline">View All</Link>
          </div>
          <div className="space-y-3">
            {bugs.slice(0, 5).map(bug => (
              <div
                key={bug.id}
                className="flex items-center justify-between p-4 rounded-md border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800"
              >
                <div className="flex gap-3 items-start">
                  <span className="text-[10px] font-black bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-500">{bug.code}</span>
                  <div>
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-200">{bug.title}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{bug.module}</div>
                  </div>
                </div>
                <Badge value={bug.severity} />
              </div>
            ))}
            {bugs.length === 0 && <p className="text-sm text-slate-400 py-4">No bugs reported.</p>}
          </div>
        </section>
      </div>

      {/* Meeting Notes Section */}
      <section className="mt-10 mb-20">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-500">
              <Note size={20} weight="bold" />
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Recent Meeting Notes</h2>
          </div>
          <Link href="/meeting-notes" className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1">
            meeting notes <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {(data.meetings as any[]).slice(0, 6).map((meet: any) => (
            <div key={meet.id} className="group p-5 rounded-md border border-slate-200 bg-white hover:border-indigo-200 hover:shadow-lg transition-all dark:border-slate-700 dark:bg-slate-800">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-500">{meet.code}</span>
                <span className="text-xs font-bold text-slate-400">{meet.date ? new Date(meet.date).toLocaleDateString() : 'N/A'}</span>
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 transition-colors line-clamp-2 min-h-[48px]">
                {meet.title}
              </h3>
              <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-700/50 flex justify-end">
                <Link href="/meeting-notes" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-500">
                  Read Full Notes
                </Link>
              </div>
            </div>
          ))}
          {(data.meetings as any[]).length === 0 && (
            <div className="col-span-full py-10 text-center rounded-md border border-dashed border-slate-200 dark:border-slate-700">
              <p className="text-sm text-slate-400">No meeting documentation found for this project.</p>
            </div>
          )}
        </div>
      </section>
    </PageShell>
  );
}
