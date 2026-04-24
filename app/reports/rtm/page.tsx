import Link from "next/link";
import { db } from "@/lib/db";
import { Badge } from "@/components/badge";
import { PageShell } from "@/components/page-shell";
import { cn } from "@/lib/utils";
import { Breadcrumb } from "@/components/breadcrumb";
import { CheckCircle, Warning, Clock, Bug, Tray, ArrowRight } from "@phosphor-icons/react/dist/ssr";

export const dynamic = "force-dynamic";

type SuiteRow = {
  id: string;
  title: string;
  status: string;
};

type BugRow = {
  id: number;
  title: string;
  severity: string;
  status: string;
};

type TestCaseCount = { total: number; passed: number; failed: number; executed: number };

async function getTestCaseStats(suiteId: string): Promise<TestCaseCount> {
  try {
    const total = await db.get<{ count: number }>(
      'SELECT COUNT(*) as count FROM "TestCase" WHERE "testSuiteId" = ? AND "deletedAt" IS NULL',
      [suiteId],
    );
    const passed = await db.get<{ count: number }>(
      'SELECT COUNT(*) as count FROM "TestCase" WHERE "testSuiteId" = ? AND "deletedAt" IS NULL AND LOWER(status) IN (?, ?)',
      [suiteId, "passed", "success"],
    );
    const failed = await db.get<{ count: number }>(
      'SELECT COUNT(*) as count FROM "TestCase" WHERE "testSuiteId" = ? AND "deletedAt" IS NULL AND LOWER(status) IN (?, ?)',
      [suiteId, "failed", "failure"],
    );
    const executed = await db.get<{ count: number }>(
      'SELECT COUNT(*) as count FROM "TestCase" WHERE "testSuiteId" = ? AND "deletedAt" IS NULL AND LOWER(status) NOT IN (?, ?)',
      [suiteId, "pending", "draft"],
    );

    return { 
      total: Number(total?.count ?? 0), 
      passed: Number(passed?.count ?? 0),
      failed: Number(failed?.count ?? 0),
      executed: Number(executed?.count ?? 0) 
    };
  } catch {
    return { total: 0, passed: 0, failed: 0, executed: 0 };
  }
}

export default async function RtmPage() {
  const suites = JSON.parse(JSON.stringify(await db.query<SuiteRow>("SELECT id, title, status FROM TestSuite WHERE deletedAt IS NULL"))) as SuiteRow[];
  const bugs = JSON.parse(JSON.stringify(await db.query<BugRow>("SELECT id, title, severity, status FROM Bug"))) as BugRow[];

  const statsMap = await Promise.all(
    suites.map(async (s) => ({ id: s.id, ...(await getTestCaseStats(s.id)) })),
  );
  const statsById = Object.fromEntries(statsMap.map((s) => [s.id, s]));

  return (
    <PageShell 
      eyebrow="Compliance Report" 
      title="Traceability Matrix" 
      description="Holistic view of requirements, test coverage, and defect density."
      crumbs={[{ label: "Reports", href: "/reports" }, { label: "Traceability Matrix" }]}
    >
      <div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-2xl shadow-slate-200/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 backdrop-blur-md border-b border-slate-200">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Suite / Requirement</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 text-center">Execution Coverage</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Status</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Defect Density</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">System Health</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {suites.length > 0 ? (
                suites.map((suite) => {
                  const stats = statsById[suite.id] || { total: 0, passed: 0, failed: 0, executed: 0 };
                  const pct = stats.total ? Math.round((stats.executed / stats.total) * 100) : 0;
                  
                  const linkedBugs = bugs.filter((bug) => 
                    bug.title.toLowerCase().includes(suite.title.toLowerCase()) || 
                    suite.title.toLowerCase().includes(bug.title.toLowerCase())
                  );

                  return (
                    <tr key={suite.id} className="hover:bg-indigo-50/30 transition-all duration-300 group">
                      <td className="px-8 py-6">
                        <Link href={`/test-suites/execute/${suite.id}`} className="flex flex-col gap-1 group/title">
                          <span className="font-extrabold text-slate-900 text-lg tracking-tight group-hover/title:text-indigo-600 transition-colors">
                            {suite.title}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 text-[9px] font-black text-slate-500 uppercase tracking-wider">
                              REQ-ID: {suite.id}
                            </span>
                            <ArrowRight size={10} weight="bold" className="text-indigo-600 opacity-0 group-hover/title:opacity-100 transition-opacity" />
                          </div>
                        </Link>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col items-center gap-2 min-w-[140px]">
                          <div className="flex w-full items-end justify-between">
                            <span className="text-xl font-black text-slate-900 leading-none">{pct}<span className="text-xs text-slate-400">%</span></span>
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 uppercase tracking-tighter">
                              {stats.executed} / {stats.total} TC
                            </span>
                          </div>
                          <div className="h-2.5 w-full rounded-md bg-slate-100 border border-slate-200/50 p-0.5 shadow-inner">
                            <div 
                              className={cn(
                                "h-full rounded-md transition-all duration-1000 shadow-sm",
                                pct === 100 ? "bg-gradient-to-r from-emerald-400 to-emerald-600" : "bg-gradient-to-r from-indigo-400 to-indigo-600"
                              )} 
                              style={{ width: `${pct}%` }} 
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <Badge value={suite.status} />
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-wrap gap-2 max-w-[220px]">
                          {linkedBugs.length > 0 ? (
                            linkedBugs.slice(0, 3).map((bug) => (
                              <div key={bug.id} className="group/bug flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-50 border border-rose-100 text-[10px] font-black text-rose-600 hover:bg-rose-600 hover:text-white transition-all cursor-default">
                                <Bug size={12} weight="bold" className="group-hover/bug:animate-pulse" />
                                {bug.severity.toUpperCase()}
                              </div>
                            ))
                          ) : (
                            <span className="text-[10px] font-black text-slate-300 uppercase italic tracking-widest">No Issues Found</span>
                          )}
                          {linkedBugs.length > 3 && (
                            <div className="flex items-center px-2 py-1 rounded-md bg-slate-50 border border-slate-200 text-[10px] font-black text-slate-400">
                              +{linkedBugs.length - 3}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        {stats.total === 0 ? (
                          <div className="flex items-center gap-2 text-slate-300">
                            < Tray size={20} weight="light" />
                            <span className="text-[11px] font-black uppercase tracking-widest">Untested</span>
                          </div>
                        ) : stats.failed > 0 ? (
                          <div className="flex items-center gap-2 text-rose-500 bg-rose-50/50 px-3 py-1.5 rounded-md border border-rose-100 shadow-sm animate-pulse">
                            <Warning size={20} weight="bold" />
                            <span className="text-[11px] font-black uppercase tracking-widest">Critical Alert</span>
                          </div>
                        ) : pct < 100 ? (
                          <div className="flex items-center gap-2 text-amber-500 bg-amber-50/50 px-3 py-1.5 rounded-md border border-amber-100">
                            <Clock size={20} weight="bold" />
                            <span className="text-[11px] font-black uppercase tracking-widest">Coverage Gap</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-emerald-500 bg-emerald-50/50 px-3 py-1.5 rounded-md border border-emerald-100 shadow-sm">
                            <CheckCircle size={20} weight="bold" />
                            <span className="text-[11px] font-black uppercase tracking-widest">Certified</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Tray size={48} weight="thin" className="text-slate-200" />
                      <p className="text-slate-400 font-medium italic tracking-tight">No traceability data found in current context.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PageShell>
  );
}
