import { getExecutiveData, getQualityTrend } from "@/lib/data";
import { 
  ShieldCheck, 
  TrendUp, 
  TrendDown, 
  Minus,
  WarningCircle,
  CheckCircle,
  XCircle,
  Printer,
  Clock
} from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

export default async function ExecutiveSummaryPage() {
  const dataRaw = await getExecutiveData();
  const trendRaw = await getQualityTrend();
  const data = JSON.parse(JSON.stringify(dataRaw));
  const trend = JSON.parse(JSON.stringify(trendRaw));

  return (
    <div className="min-h-screen bg-slate-50 p-8 print:bg-white print:p-0">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 flex items-end justify-between border-b border-slate-200 pb-8 print:border-slate-300">
          <div>
            <div className="flex items-center gap-3 text-sky-700">
              <ShieldCheck size={32} weight="bold" />
              <p className="text-xs font-bold uppercase tracking-widest">Strategic Insight</p>
            </div>
            <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-slate-900">
              Executive Quality Summary
            </h1>
            <p className="mt-2 text-slate-500 font-medium">
              High-level snapshots for decision makers and stakeholders.
            </p>
          </div>
          <button 
            className="flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-slate-600 shadow-sm transition hover:bg-slate-50 hover:shadow-md active:scale-95 print:hidden"
          >
            <Printer size={18} weight="bold" />
            Print Report
          </button>
        </header>

        <section className="mb-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {data.metrics.map((metric: any) => (
            <div key={metric.label} className="group relative overflow-hidden rounded-[32px] border border-white bg-white p-8 shadow-sm transition-all hover:shadow-xl print:border-slate-100 print:shadow-none">
              <div className={cn(
                "absolute -right-4 -top-4 h-24 w-24 rounded-full opacity-5 transition-transform group-hover:scale-150",
                metric.status === "success" ? "bg-emerald-500" : 
                metric.status === "danger" ? "bg-rose-500" : "bg-amber-500"
              )} />
              
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{metric.label}</p>
                {metric.trend === "up" ? <TrendUp size={20} className="text-emerald-500" weight="bold" /> :
                 metric.trend === "down" ? <TrendDown size={20} className="text-rose-500" weight="bold" /> :
                 <Minus size={20} className="text-slate-300" weight="bold" />}
              </div>
              
              <div className="flex items-baseline gap-2">
                <span className={cn(
                  "text-4xl font-black tracking-tight",
                  metric.status === "success" ? "text-emerald-600" : 
                  metric.status === "danger" ? "text-rose-600" : "text-amber-600"
                )}>
                  {metric.value}
                </span>
              </div>
            </div>
          ))}
        </section>

        <div className="grid gap-8 lg:grid-cols-3 mb-10">
          <div className="lg:col-span-2">
            <div className="rounded-[40px] bg-sky-900 p-10 text-white shadow-2xl print:bg-sky-950 print:shadow-none">
              <div className="flex items-center gap-3 mb-6">
                {data.summary.health === "Healthy" ? (
                  <CheckCircle size={32} className="text-emerald-400" weight="fill" />
                ) : (
                  <WarningCircle size={32} className="text-amber-400" weight="fill" />
                )}
                <h3 className="text-2xl font-bold">Health Assessment: {data.summary.health}</h3>
              </div>
              <p className="text-lg leading-relaxed text-sky-100 font-medium">
                {data.summary.message}
              </p>
              
              <div className="mt-10 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl bg-white/10 p-6 backdrop-blur-md">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-300">Strategy</p>
                  <p className="mt-1 text-sm font-semibold">Focus on clearing P0 defects before the next release window.</p>
                </div>
                <div className="rounded-3xl bg-white/10 p-6 backdrop-blur-md">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-300">Recommendation</p>
                  <p className="mt-1 text-sm font-semibold">Automate standard login and checkout flows for stability.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[40px] border border-slate-200 bg-white p-10 shadow-sm print:shadow-none">
            <h3 className="mb-6 text-xl font-bold text-slate-900">Release Decision</h3>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 print:bg-slate-100">
                  <CheckCircle size={24} weight="bold" />
                </div>
                <div>
                  <p className="font-bold text-slate-800">Functionality</p>
                  <p className="text-xs text-slate-500 font-medium">Core features are tested and stable.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600 print:bg-slate-100">
                  <WarningCircle size={24} weight="bold" />
                </div>
                <div>
                  <p className="font-bold text-slate-800">Performance</p>
                  <p className="text-xs text-slate-500 font-medium">Latency on mobile is slightly above target.</p>
                </div>
              </div>
              <div className={cn(
                "mt-8 flex flex-col items-center justify-center rounded-[32px] p-8",
                data.summary.health === "Healthy" ? "bg-emerald-600" : "bg-amber-600"
              )}>
                <p className="text-xs font-bold uppercase tracking-widest text-white/70">Final Status</p>
                <p className="mt-2 text-3xl font-black text-white">{data.summary.health === "Healthy" ? "GO" : "CAUTION"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* #5 Quality Trend Section */}
        <section className="mb-10 rounded-[40px] border border-slate-200 bg-white p-10 shadow-sm print:shadow-none">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-violet-50 rounded-xl text-violet-600">
              <Clock size={24} weight="bold" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Historical Quality Trend</h3>
              <p className="text-sm text-slate-500 font-medium">Weekly comparison of reported vs fixed bugs.</p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 items-end h-40">
            {trend.map((w: any, idx: number) => (
              <div key={idx} className="flex flex-col items-center group">
                <div className="flex items-end gap-1 w-full justify-center mb-2">
                  <div 
                    title={`${w.bugs} bugs`}
                    className="w-4 bg-rose-400 rounded-t-sm transition-all group-hover:bg-rose-500" 
                    style={{ height: `${Math.max(10, w.bugs * 10)}%` }} 
                  />
                  <div 
                    title={`${w.fixed} fixed`}
                    className="w-4 bg-emerald-400 rounded-t-sm transition-all group-hover:bg-emerald-500" 
                    style={{ height: `${Math.max(10, w.fixed * 10)}%` }} 
                  />
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{w.label}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-8 flex items-center gap-6 justify-center">
             <div className="flex items-center gap-2">
               <div className="w-3 h-3 bg-rose-400 rounded-sm" />
               <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Reported Bugs</span>
             </div>
             <div className="flex items-center gap-2">
               <div className="w-3 h-3 bg-emerald-400 rounded-sm" />
               <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Fixed Bugs</span>
             </div>
          </div>
        </section>

        {/* #2 Release Notes Section */}
        <section className="rounded-[40px] border border-slate-900 bg-slate-900 p-12 text-white shadow-2xl print:bg-white print:text-slate-900 print:border-slate-200 print:shadow-none">
           <div className="flex items-center justify-between mb-10">
              <div>
                <h3 className="text-3xl font-black tracking-tight">Release Notes Preview</h3>
                <p className="text-slate-400 font-medium mt-1">Automatically compiled from your fixed bugs and finished tasks.</p>
              </div>
              <div className="rounded-2xl bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white ring-1 ring-white/20 print:hidden">Sprint Summary</div>
           </div>

           <div className="grid gap-12 lg:grid-cols-2">
              <div>
                 <h4 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-emerald-400 mb-6">
                   <CheckCircle size={18} weight="bold" />
                   Verification Completed
                 </h4>
                 <ul className="space-y-4">
                    {data.releaseNotes.completedTasks.map((t: any) => (
                      <li key={t.code} className="flex gap-4 items-start group">
                        <span className="text-[10px] font-black tracking-widest text-slate-500 mt-1">{t.code}</span>
                        <span className="text-sm font-semibold group-hover:text-emerald-400 transition-colors">{t.title}</span>
                      </li>
                    ))}
                    {data.releaseNotes.completedTasks.length === 0 && <li className="text-slate-500 italic text-sm">No tasks completed in this window.</li>}
                 </ul>
              </div>

              <div>
                 <h4 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-rose-400 mb-6">
                   <WarningCircle size={18} weight="bold" />
                   Fixed Defects
                 </h4>
                 <ul className="space-y-4">
                    {data.releaseNotes.fixedBugs.map((b: any) => (
                      <li key={b.code} className="flex gap-4 items-start group">
                        <span className="text-[10px] font-black tracking-widest text-slate-500 mt-1">{b.code}</span>
                        <div className="flex-1">
                          <span className="text-sm font-semibold group-hover:text-rose-400 transition-colors">{b.title}</span>
                          <span className={cn("ml-2 text-[9px] font-black px-1.5 py-0.5 rounded", 
                            b.severity === 'critical' ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-700 text-slate-400'
                          )}>{String(b.severity || 'low').toUpperCase()}</span>
                        </div>
                      </li>
                    ))}
                    {data.releaseNotes.fixedBugs.length === 0 && <li className="text-slate-500 italic text-sm">No bugs fixed in this window.</li>}
                 </ul>
              </div>
           </div>
        </section>
      </div>
    </div>
  );
}

