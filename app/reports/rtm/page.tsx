import { db } from "@/lib/db";
import { Badge } from "@/components/badge";

export default async function RtmPage() {
  const scenarios = await db.query('SELECT * FROM "TestCaseScenario"');
  const bugs = await db.query('SELECT * FROM "Bug"');

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Traceability Matrix</h1>
      <p className="text-sm text-slate-500 mb-6">Mapping Scenarios to Defects.</p>
      
      <div className="space-y-4">
        {scenarios.map((s: any) => (
          <div key={s.id} className="p-4 border rounded-xl bg-white shadow-sm">
            <h3 className="font-bold">{s.moduleName}</h3>
            <p className="text-xs text-slate-400 mb-2">{s.projectName}</p>
            <div className="flex gap-2">
               {bugs.filter(b => b.title.includes(s.moduleName)).map((b: any) => (
                 <Badge key={b.id} value={b.title} />
               ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
