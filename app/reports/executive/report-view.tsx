"use client";

import { 
  ShieldCheck, 
  TrendUp, 
  TrendDown, 
  Minus, 
  WarningCircle, 
  CheckCircle, 
  XCircle, 
  Printer, 
  Clock,
  Certificate,
  ChartBar,
  ListChecks,
  FileText
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { PrintButton } from "@/components/print-button";

type ExecutiveMetric = {
  label: string;
  value: string | number;
  trend: "up" | "down" | "stable";
  status: "success" | "warning" | "danger";
};

type ReleaseItem = { code: string; title: string; severity?: string };

type ExecutiveReportProps = {
  data: {
    metrics: ExecutiveMetric[];
    releaseNotes: { completedTasks: ReleaseItem[]; fixedBugs: ReleaseItem[] };
    summary: { health: string; message: string; planName: string; projectName: string };
  };
  trend: Array<{ label: string; bugs: number; fixed: number }>;
};

export function ExecutiveReportView({ data, trend }: ExecutiveReportProps) {
  const metrics = data.metrics || [];
  const completedTasks = data.releaseNotes?.completedTasks || [];
  const fixedBugs = data.releaseNotes?.fixedBugs || [];
  const summary = data.summary || { health: "N/A", message: "No data available." };
  const finalStatus = summary.health === "Healthy" ? "STABLE" : "ACTION REQUIRED";
  
  const today = new Date().toLocaleDateString('en-GB', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });

  return (
    <div className="mx-auto max-w-5xl space-y-10 pb-20 print:p-0 print:m-0">
      
      {/* PREMIUM HEADER - visible only in print */}
      <div className="hidden print:flex items-center justify-between border-b-2 border-slate-900 pb-8 mb-12">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-md bg-slate-900 text-white shadow-lg">
            <ShieldCheck size={40} weight="bold" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-slate-900">QA DAILY HUB</h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{summary.projectName}</p>
              <div className="h-1 w-1 rounded-full bg-slate-300" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-600">{summary.planName}</p>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs font-black uppercase text-slate-400">Report Generation Date</p>
          <p className="text-lg font-bold text-slate-900">{today}</p>
          <p className="text-[10px] font-bold text-rose-600 uppercase mt-1 tracking-widest italic">CONFIDENTIAL • INTERNAL ONLY</p>
        </div>
      </div>

      {/* WEB VIEW ACTIONS */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between no-print">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Executive Summary</h1>
          <div className="flex items-center gap-2 mt-1 text-[11px] font-bold uppercase tracking-wider">
            <span className="text-slate-500">{summary.projectName}</span>
            <span className="text-slate-300">/</span>
            <span className="text-sky-600">{summary.planName}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <PrintButton />
        </div>
      </div>

      {/* KEY KPIS - THE BOLD SECTION */}
      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <div 
            key={metric.label} 
            className={cn(
              "group relative overflow-hidden rounded-md border p-8 shadow-sm transition-all hover:shadow-xl print:shadow-none",
              metric.status === "success" ? "bg-emerald-50/20 border-emerald-100" :
              metric.status === "danger" ? "bg-rose-50/20 border-rose-100" : "bg-amber-50/20 border-amber-100",
              "bg-white dark:bg-slate-900"
            )}
          >
            <div className={cn(
              "absolute -right-4 -top-4 h-24 w-24 rounded-md opacity-10 transition-transform group-hover:scale-150",
              metric.status === "success" ? "bg-emerald-500" :
              metric.status === "danger" ? "bg-rose-500" : "bg-amber-500"
            )} />
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-widest text-slate-500">{metric.label}</p>
              {metric.trend === "up" ? <TrendUp size={20} weight="bold" className="text-emerald-500" /> :
               metric.trend === "down" ? <TrendDown size={20} weight="bold" className="text-rose-500" /> :
               <Minus size={20} weight="bold" className="text-slate-400" />}
            </div>
            <p className="text-5xl font-black tracking-tighter text-slate-900 dark:text-white">{metric.value}</p>
            <div className="mt-6 h-1 w-full rounded-md bg-slate-100 dark:bg-slate-800">
               <div 
                 className={cn(
                   "h-full rounded-md transition-all duration-1000",
                   metric.status === "success" ? "bg-emerald-500" :
                   metric.status === "danger" ? "bg-rose-500" : "bg-amber-500"
                 )} 
                 style={{ width: '40%' }} // Dummy for aesthetic
               />
            </div>
          </div>
        ))}
      </section>

      {/* STRATEGIC ASSESSMENT & STATUS */}
      <section className="grid gap-6 xl:grid-cols-[1fr_400px]">
        {/* Quality Message Card */}
        <div className="relative overflow-hidden rounded-md border border-slate-200 bg-white p-10 shadow-sm dark:border-slate-800 dark:bg-slate-900 print:shadow-none">
          <div className="absolute top-0 left-0 w-2 h-full bg-slate-900" />
          <div className="flex items-center gap-3 mb-6">
             <FileText size={24} weight="bold" className="text-slate-900 dark:text-slate-100" />
             <h3 className="text-xl font-bold text-slate-900 dark:text-white">Strategic Assessment</h3>
          </div>
          <div className="space-y-4">
            <p className="text-lg font-medium leading-8 text-slate-700 dark:text-slate-300 italic">
              "{summary.message}"
            </p>
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-slate-400">
              <span className="flex items-center gap-1"><Certificate size={16} /> Certified Quality Gate</span>
              <span className="flex items-center gap-1"><ChartBar size={16} /> Verified Metrics</span>
            </div>
          </div>
        </div>

        {/* Release Readiness Card */}
        <div className={cn(
          "flex flex-col items-center justify-center text-center rounded-md border p-10 shadow-sm print:shadow-none transition-colors",
          summary.health === "Healthy" ? "bg-slate-900 border-slate-900" : "bg-rose-900 border-rose-900"
        )}>
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-md bg-white/10 text-white backdrop-blur-md">
            <ShieldCheck size={44} weight="bold" />
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-white/60 mb-2">Final Readiness Status</p>
          <p className="text-4xl font-black text-white">{finalStatus}</p>
          <div className="mt-8 grid grid-cols-3 gap-2 w-full">
             <div className="h-1 rounded-md bg-emerald-500" />
             <div className="h-1 rounded-md bg-emerald-500" />
             <div className={cn("h-1 rounded-md", summary.health === "Healthy" ? "bg-emerald-500" : "bg-white/20")} />
          </div>
        </div>
      </section>

      {/* TREND ANALYSIS */}
      <section className="rounded-md border border-slate-200 bg-white p-10 shadow-sm dark:border-slate-800 dark:bg-slate-900 print:shadow-none">
        <div className="flex items-center gap-3 mb-10 border-b border-slate-100 dark:border-slate-800 pb-6">
          <ChartBar size={24} weight="bold" className="text-sky-600" />
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Trend Analysis</h3>
            <p className="text-sm font-medium text-slate-500">Historical comparison of defect resolution efficiency.</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {trend.map((item) => (
            <div key={item.label} className="relative rounded-md border border-slate-100 p-6 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">{item.label}</p>
              <div className="flex items-end gap-3">
                <p className="text-3xl font-black text-slate-900 dark:text-white">{item.bugs}</p>
                <div className="mb-1 text-[10px] font-bold text-rose-500 uppercase">Reported</div>
              </div>
              <div className="flex items-end gap-3 mt-1">
                <p className="text-xl font-bold text-emerald-600">{item.fixed}</p>
                <div className="mb-0.5 text-[10px] font-bold text-emerald-500 uppercase">Fixed</div>
              </div>
              <div className="mt-4 h-1 w-full bg-slate-200 dark:bg-slate-700 rounded-md overflow-hidden">
                 <div 
                   className="h-full bg-slate-900 dark:bg-white" 
                   style={{ width: `${item.bugs > 0 ? Math.min((item.fixed / item.bugs) * 100, 100) : 0}%` }} 
                 />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* RELEASE NOTES & DELIVERABLES */}
      <section className="grid gap-6 lg:grid-cols-2">
        {/* Completed Tasks */}
        <div className="rounded-md border border-slate-200 bg-white p-10 shadow-sm dark:border-slate-800 dark:bg-slate-900 print:shadow-none">
          <div className="flex items-center gap-3 mb-8">
            <div className="rounded-md bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
              <ListChecks size={24} weight="bold" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">Production Deliverables</h4>
          </div>
          <ul className="space-y-4">
            {completedTasks.map((t) => (
              <li key={t.code} className="flex gap-4 items-start border-b border-slate-50 dark:border-slate-800 pb-3 last:border-0">
                <span className="text-[10px] font-black tracking-widest text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md mt-0.5 shrink-0">{t.code}</span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-tight">{t.title}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Fixed Defects */}
        <div className="rounded-md border border-slate-200 bg-white p-10 shadow-sm dark:border-slate-800 dark:bg-slate-900 print:shadow-none">
          <div className="flex items-center gap-3 mb-8">
            <div className="rounded-md bg-rose-50 p-2 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
              <WarningCircle size={24} weight="bold" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">Defect Resolution</h4>
          </div>
          <ul className="space-y-4">
            {fixedBugs.map((b) => (
              <li key={b.code} className="flex gap-4 items-start border-b border-slate-50 dark:border-slate-800 pb-3 last:border-0">
                <span className="text-[10px] font-black tracking-widest text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md mt-0.5 shrink-0">{b.code}</span>
                <div className="flex-1">
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-tight">{b.title}</span>
                  <div className="mt-1">
                    <span className={cn(
                      "rounded px-1.5 py-0.5 text-[9px] font-black",
                      b.severity === "critical" ? "bg-rose-500 text-white" : "bg-slate-100 text-slate-500 dark:bg-slate-800"
                    )}>
                      {String(b.severity || "low").toUpperCase()}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* PROFESSIONAL FOOTER - visible only in print */}
      <div className="hidden print:block pt-12 mt-12 border-t border-slate-200">
        <div className="grid grid-cols-3 gap-12">
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 mb-8 tracking-widest">Report Prepared By</p>
            <div className="h-px w-full bg-slate-200 mb-2" />
            <p className="text-xs font-bold text-slate-900 uppercase">QA Lead / Department Head</p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 mb-8 tracking-widest">Approval Signature</p>
            <div className="h-px w-full bg-slate-200 mb-2" />
            <p className="text-xs font-bold text-slate-900 uppercase">Project Manager</p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 mb-8 tracking-widest">Executive Witness</p>
            <div className="h-px w-full bg-slate-200 mb-2" />
            <p className="text-xs font-bold text-slate-900 uppercase">CTO / Product Owner</p>
          </div>
        </div>
        <p className="mt-20 text-center text-[10px] text-slate-400 font-medium">
          This report was automatically generated by QA Daily Hub Strategic Engine. 
          Page 1 of 1 • System ID: {Math.random().toString(36).substring(7).toUpperCase()}
        </p>
      </div>
    </div>
  );
}
