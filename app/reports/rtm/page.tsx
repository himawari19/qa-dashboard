import { db } from "@/lib/db";
import { Badge } from "@/components/badge";
import { cn } from "@/lib/utils";
import { RTMFilter } from "@/components/rtm-filter";

export default async function RTMPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ req?: string; project?: string }> 
}) {
  const params = await searchParams;
  const filterReq = params.req || "";
  const filterProject = params.project || "";

  // Get options for filters
  const rawReqsRaw = await db.query('SELECT id, title FROM "Requirement" ORDER BY id');
  const rawReqs = JSON.parse(JSON.stringify(rawReqsRaw)) as { id: string, title: string }[];
  const allReqs = rawReqs.map(r => ({ id: String(r.id), title: String(r.title) }));
  
  const rawProjectsRaw = await db.query('SELECT DISTINCT "projectName" FROM "TestCaseScenario"');
  const rawProjects = JSON.parse(JSON.stringify(rawProjectsRaw)) as { projectName: string }[];
  const allProjects = rawProjects.map(p => String(p.projectName));

  let sql = `
    SELECT 
      r.id as "reqId", 
      r.title as "reqTitle", 
      r.status as "reqStatus",
      tcs.id as "scenarioId",
      tcs."projectName",
      tcs."moduleName",
      tc."tcId",
      tc."caseName",
      tc.status as "tcStatus",
      tc."automationResult"
    FROM "Requirement" r
    LEFT JOIN "TestCaseScenario" tcs ON tcs."requirementId" = r.id
    LEFT JOIN "TestCase" tc ON tc."scenarioId" = tcs.id
    WHERE 1=1
  `;

  const queryParams: any[] = [];
  if (filterReq) {
    sql += ` AND r.id = ? `;
    queryParams.push(filterReq);
  }
  if (filterProject) {
    sql += ` AND tcs."projectName" = ? `;
    queryParams.push(filterProject);
  }

  sql += ` ORDER BY r.id ASC `;

  const dataRaw = await db.query(sql, queryParams) as any[];
  const data = JSON.parse(JSON.stringify(dataRaw));

  // Group by Requirement
  const matrix = data.reduce((acc: any, curr: any) => {
    if (!acc[curr.reqId]) {
      acc[curr.reqId] = {
        id: curr.reqId,
        title: curr.reqTitle,
        status: curr.reqStatus,
        tests: []
      };
    }
    if (curr.tcId) {
      acc[curr.reqId].tests.push({
        id: curr.tcId,
        name: curr.caseName,
        status: curr.tcStatus,
        automation: curr.automationResult
      });
    }
    return acc;
  }, {});

  const requirements = Object.values(matrix);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-black italic uppercase">Traceability Matrix (RTM)</h1>
          <p className="mt-2 text-slate-600">Cross-reference between requirements, test cases, and execution status.</p>
        </div>
        <RTMFilter 
          requirements={allReqs} 
          projects={allProjects} 
        />
      </div>

      <div className="overflow-hidden rounded-[40px] border border-slate-200 bg-white shadow-xl shadow-slate-200/50">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-slate-50/80 backdrop-blur-md">
              <th className="px-6 py-4 text-xs font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">Requirement ID</th>
              <th className="px-6 py-4 text-xs font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">Title & Status</th>
              <th className="px-6 py-4 text-xs font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">Mapped Test Cases</th>
              <th className="px-6 py-4 text-xs font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 text-center">Coverage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {requirements.map((req: any) => (
              <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-5 align-top">
                  <span className="font-mono text-xs font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-100">{req.id}</span>
                </td>
                <td className="px-6 py-5 align-top">
                  <div className="space-y-1">
                    <p className="font-bold text-slate-800">{req.title}</p>
                    <Badge value={req.status} />
                  </div>
                </td>
                <td className="px-6 py-5 align-top">
                  {req.tests.length > 0 ? (
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {req.tests.map((test: any) => (
                        <div key={test.id} className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white p-2 text-[11px] shadow-sm">
                          <span className="font-bold text-slate-500">{test.id}</span>
                          <span className="truncate flex-1 font-medium">{test.name}</span>
                          <div className={cn(
                            "h-2 w-2 rounded-full",
                            test.status === "Success" ? "bg-emerald-500" : "bg-amber-500"
                          )} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs italic text-rose-500 font-semibold">⚠️ No test cases mapped</span>
                  )}
                </td>
                <td className="px-6 py-5 align-top text-center">
                  <div className="inline-flex flex-col items-center">
                    <span className={cn(
                      "text-lg font-black",
                      req.tests.length > 0 ? "text-sky-600" : "text-rose-600"
                    )}>
                      {req.tests.length > 0 ? "100%" : "0%"}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Covered</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
