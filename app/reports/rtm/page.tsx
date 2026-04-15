import React from "react";
import { db } from "@/lib/db";
import { Badge } from "@/components/badge";
import { ArrowRight, Bug, Checks } from "@phosphor-icons/react";

export default async function RtmPage() {
  const scenarios = await db.query('SELECT * FROM "TestCaseScenario"');
  const bugs = await db.query('SELECT * FROM "Bug"');

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Traceability Matrix</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">Cross-referencing test scenarios with identified defects.</p>
      </header>

      <div className="rounded-[40px] border border-slate-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-8 py-5 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Test Scenario</th>
              <th className="px-8 py-5 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">Status</th>
              <th className="px-8 py-5 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Linked Defects</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {scenarios.map((s: any) => {
              const bugCode = `SCENARIO-${s.id}`;
              const linkedBugs = bugs.filter((b: any) => b.relatedItems?.includes(bugCode) || b.project === s.project);
              
              return (
                <tr key={s.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                       <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600 group-hover:bg-sky-600 group-hover:text-white transition-all duration-300">
                          <Checks size={20} weight="bold" />
                       </div>
                       <div>
                          <p className="text-sm font-bold text-slate-900">{s.title}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.project}</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center">
                     <Badge value={s.status} />
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-wrap gap-2">
                       {linkedBugs.length > 0 ? linkedBugs.map((b: any) => (
                         <div key={b.id} className="flex items-center gap-2 bg-rose-50 border border-rose-100 rounded-lg px-3 py-1.5 shadow-sm transition hover:scale-105">
                            <Bug size={14} className="text-rose-600" weight="fill" />
                            <span className="text-[10px] font-black text-rose-700">{b.code || `BUG-${b.id}`}</span>
                            <ArrowRight size={12} className="text-rose-300" />
                            <span className="text-[10px] font-bold text-rose-500 uppercase">{b.severity}</span>
                         </div>
                       )) : (
                         <span className="text-[10px] font-bold italic text-slate-300">No defects linked</span>
                       )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
