"use client";

import React from "react";
import Link from "next/link";
import { Badge } from "@/components/badge";
import { formatDate, cn } from "@/lib/utils";
import { Printer, FileXls, ChartPieSlice, ChartLineUp, Checks } from "@phosphor-icons/react";

type DashboardProps = {
  metrics: { label: string; value: number; caption: string }[];
  distribution: {
    tasks: { name: string; value: number }[];
    bugs: { name: string; value: number }[];
  };
  personalSuccessRate: number;
  spotlight?: {
    projectName: string;
    totalScenarios: number;
    totalBugs: number;
    completionRate: number;
    criticalBugs: { code: string; title: string; severity: string }[];
    priorityTasks: { code: string; title: string; priority: string }[];
  };
  recent: {
    tasks: { id: number; code: string; title: string; priority: string; status: string }[];
    bugs: {
      id: number;
      code: string;
      title: string;
      severity: string;
      priority: string;
      status: string;
    }[];
    testCases: { id: string; code: string; title: string; priority: string; status: string }[];
    meetings: { id: number; code: string; title: string; date: string }[];
    logs: { id: number; code: string; project: string; date: string }[];
  };
  sprintInfo?: {
    name: string;
    startDate: string;
    endDate: string;
    progress: number;
    taskTotal: number;
    taskDone: number;
  } | null;
};

export function Dashboard({ metrics, distribution, spotlight, recent, sprintInfo, personalSuccessRate }: DashboardProps) {
  const [mounted, setMounted] = React.useState(false);
  const handlePrint = () => {
    window.print();
  };

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="space-y-6 pb-12">
      {/* SPOTLIGHT SECTION */}
      {spotlight && (
        <section className="relative overflow-hidden rounded-[40px] border border-white/40 bg-white/40 p-10 shadow-2xl backdrop-blur-xl group">
          {/* Decorative Background Elements */}
          <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-sky-400/10 blur-[100px] transition-all duration-1000 group-hover:bg-sky-400/20" />
          <div className="absolute -left-20 -bottom-20 h-80 w-80 rounded-full bg-blue-600/5 blur-[100px] transition-all duration-1000 group-hover:bg-blue-600/10" />

          <div className="relative z-10 grid gap-12 lg:grid-cols-5 items-center">
            <div className="lg:col-span-3">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-[22px] bg-gradient-to-br from-sky-600 to-blue-700 text-white shadow-xl shadow-sky-200">
                  <ChartLineUp size={28} weight="duotone" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-sky-500 animate-pulse" />
                    <p className="text-[11px] font-black uppercase tracking-[0.3em] text-sky-600/80">Active Portfolio Showcase</p>
                  </div>
                  <h1 className="mt-1 text-4xl font-black tracking-tight text-slate-900 drop-shadow-sm leading-tight">
                    {spotlight.projectName}
                  </h1>
                </div>
              </div>
              
              <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-600/90 font-medium">
                {spotlight.projectDescription || "Tracking QA activities, defects, and test scenarios for this project."}
              </p>

              <div className="mt-10 grid grid-cols-3 gap-6">
                {[
                  { label: "Completion", value: `${spotlight.completionRate}%`, sub: "Pass Rate", color: "text-sky-600", border: "border-sky-500" },
                  { label: "Scenarios", value: spotlight.totalScenarios, sub: "Modules", color: "text-slate-900", border: "border-slate-200" },
                  { label: "Identified", value: spotlight.totalBugs, sub: "Defects", color: "text-rose-600", border: "border-rose-500" },
                ].map((item, idx) => (
                  <div key={idx} className={cn("group/item flex flex-col border-l-4 pl-5 transition-all duration-300 hover:pl-7", item.border)}>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover/item:text-slate-600 transition-colors">{item.label}</span>
                    <span className={cn("mt-1 text-3xl font-black tracking-tight", item.color)}>{item.value}</span>
                    <span className="text-[11px] font-bold text-slate-400">{item.sub}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2 flex justify-center lg:justify-end no-print">
               <div className="relative h-56 w-56 p-4">
                  {/* Outer Ring Decoration */}
                  <div className="absolute inset-0 rounded-full border border-slate-100/50 shadow-[inset_0_0_20px_rgba(0,0,0,0.02)]" />
                  
                  <svg className="h-full w-full rotate-[-90deg]" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="44" fill="none" stroke="#f1f5f9" strokeWidth="8" />
                    <circle 
                      cx="50" cy="50" r="44" 
                      fill="none" 
                      stroke="url(#grad1)" 
                      strokeWidth="8" 
                      strokeDasharray="276.46" 
                      strokeDashoffset={276.46 * (1 - spotlight.completionRate / 100)} 
                      strokeLinecap="round" 
                      className="transition-all duration-1000 ease-out"
                    />
                    <defs>
                      <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#0284c7" />
                        <stop offset="100%" stopColor="#3b82f6" />
                      </linearGradient>
                    </defs>
                  </svg>
                  
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-black tracking-tighter text-slate-900 drop-shadow-sm">{spotlight.completionRate}%</span>
                    <div className="mt-1 flex items-center gap-1 overflow-hidden rounded-full bg-sky-50 px-2.5 py-1 ring-1 ring-sky-100">
                      <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                      <span className="text-[9px] font-black uppercase tracking-tighter text-sky-700">Health</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

      {/* SPRINT PROGRESS (Idea 23) */}
      {sprintInfo && (
        <section className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-100">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active Sprint
                </span>
                <h3 className="mt-3 text-xl font-black text-slate-900">{sprintInfo.name}</h3>
                <p className="mt-1 text-xs font-bold text-slate-400">
                  {formatDate(sprintInfo.startDate)} — {formatDate(sprintInfo.endDate)}
                </p>
              </div>
              <div className="text-right">
                <span className="text-3xl font-black text-emerald-600">{sprintInfo.progress}%</span>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Completed</p>
              </div>
            </div>
            
            <div className="mt-6">
              <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100 p-0.5">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 shadow-sm transition-all duration-1000 ease-out"
                  style={{ width: `${sprintInfo.progress}%` }}
                />
              </div>
              <div className="mt-3 flex justify-between text-[11px] font-bold text-slate-500">
                <span>{sprintInfo.taskDone} Tasks Done</span>
                <span>{sprintInfo.taskTotal} Total Tasks</span>
              </div>
            </div>
          </div>
          
          <div className="rounded-[32px] border border-sky-100 bg-sky-50 p-6 flex flex-col justify-center">
             <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-700">Sprint Goal</p>
             <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-700 italic">
               "{sprintInfo.goal || 'Deliver quality outcomes for this sprint cycle.'}"
             </p>
          </div>
        </section>
      )}


      {/* HEADER SECTION (Secondary Actions) */}
      <section className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-white p-7 shadow-sm transition hover:shadow-md">
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-sky-700">
              <ChartLineUp size={16} weight="bold" />
              Project Insights
            </div>
            <h2 className="mt-3 text-4xl font-black tracking-tight text-slate-900">QA Portfolio Summary</h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-600">
              Comprehensive overview of testing activities, including bug distribution, task health, and recent documentation logs.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 no-print">
            <button
              onClick={handlePrint}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:shadow-md"
            >
              <Printer size={18} weight="bold" />
              Export PDF / Print
            </button>
            <Link
              href="/api/export/all"
              className="inline-flex h-11 items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-5 text-sm font-bold text-sky-700 shadow-sm transition hover:bg-sky-600 hover:text-white hover:shadow-md"
            >
              <FileXls size={18} weight="bold" />
              Export Excel
            </Link>
          </div>
        </div>
        
        {/* PRINT ONLY HEADER */}
        <div className="print-only mt-8 border-t border-slate-200 pt-6">
          <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <div>Report Date: {mounted ? new Date().toLocaleDateString('en-GB') : "-"}</div>
            <div className="text-right">Generated by QA Daily Hub</div>
          </div>
        </div>

        {/* PRINT ONLY EXECUTIVE SUMMARY */}
        {spotlight && (
          <div className="print-only mt-10">
            <h2 className="text-xl font-bold text-slate-900 border-b-2 border-slate-900 pb-2 mb-4">Executive Summary</h2>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="text-sm font-bold text-rose-700 uppercase tracking-widest mb-3">Critical Defects</h3>
                <div className="space-y-2">
                  {spotlight.criticalBugs.map(bug => (
                    <div key={bug.code} className="flex gap-3 text-xs border-b border-slate-100 pb-2">
                      <span className="font-bold text-slate-400 shrink-0">{bug.code}</span>
                      <span className="text-slate-800 line-clamp-1">{bug.title}</span>
                      <span className="ml-auto font-black text-rose-600 uppercase italic">{bug.severity}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-bold text-sky-700 uppercase tracking-widest mb-3">Priority Tasks</h3>
                <div className="space-y-2">
                  {spotlight.priorityTasks.map(task => (
                    <div key={task.code} className="flex gap-3 text-xs border-b border-slate-100 pb-2">
                      <span className="font-bold text-slate-400 shrink-0">{task.code}</span>
                      <span className="text-slate-800 line-clamp-1">{task.title}</span>
                      <span className="ml-auto font-black text-sky-600 uppercase italic">{task.priority}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* PERSONAL SHIELD & METRICS GRID #7 */}
      <section className="grid gap-6 lg:grid-cols-4">
        <div className="relative overflow-hidden rounded-[40px] border border-[#f1f5f9] bg-slate-900 p-8 text-white shadow-2xl col-span-2">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500 shadow-lg shadow-violet-500/30">
                  <Checks size={24} weight="bold" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Personal Quality Shield</h3>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-violet-300">My Success Rate</p>
                </div>
              </div>
              
              <div className="flex items-end gap-6">
                <div className="text-6xl font-black tracking-tighter text-white">{personalSuccessRate}%</div>
                <div className="mb-2 space-y-1">
                   {personalSuccessRate > 90 ? (
                     <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-[10px] font-bold text-emerald-400 ring-1 ring-emerald-500/40">ELITE QA</div>
                   ) : (
                     <div className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/20 px-3 py-1 text-[10px] font-bold text-sky-400 ring-1 ring-sky-500/40">ACTIVE PROTECTOR</div>
                   )}
                   <p className="text-[10px] text-slate-400 font-medium">Calculation based on your fixed bugs and completed verification tasks.</p>
                </div>
              </div>

              <div className="mt-8 h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div 
                  className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-1000"
                  style={{ width: `${personalSuccessRate}%` }} 
                />
              </div>
            </div>
            {/* Background decoration */}
            <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl" />
        </div>

        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
           {metrics.slice(0, 4).map((metric) => (
            <div key={metric.label} className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 group-hover:text-violet-600 transition">
                {metric.label}
              </p>
              <p className="mt-4 text-3xl font-black tracking-tight text-slate-900">{metric.value}</p>
              <p className="mt-1 text-[10px] font-bold text-slate-400">{metric.caption}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CHARTS / DISTRIBUTION */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
              <ChartPieSlice size={20} weight="bold" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Bug Severity Distribution</h3>
              <p className="text-xs text-slate-500">Breakdown of reported defects by criticality</p>
            </div>
          </div>
          <div className="space-y-5">
            {distribution.bugs.length > 0 ? distribution.bugs.map((item) => (
              <div key={item.name} className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                  <span className="text-slate-600">{item.name}</span>
                  <span className="text-slate-900">{item.value} bugs</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div 
                    className={cn(
                      "h-full transition-all duration-1000",
                      item.name === 'critical' ? 'bg-rose-600' :
                      item.name === 'high' ? 'bg-rose-500' :
                      item.name === 'medium' ? 'bg-amber-400' : 'bg-emerald-400'
                    )}
                    style={{ width: `${Math.min(100, (item.value / Math.max(1, metrics[1]?.value || 1)) * 100)}%` }}
                  />
                </div>
              </div>
            )) : <p className="text-sm text-slate-400 italic">No data available</p>}
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
              <ChartLineUp size={20} weight="bold" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Task Status Overview</h3>
              <p className="text-xs text-slate-500">Current state of daily testing tasks</p>
            </div>
          </div>
          <div className="space-y-5">
            {distribution.tasks.length > 0 ? distribution.tasks.map((item) => (
              <div key={item.name} className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                  <span className="text-slate-600">{item.name}</span>
                  <span className="text-slate-900">{item.value} tasks</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div 
                    className={cn(
                      "h-full transition-all duration-1000",
                      item.name === 'todo' ? 'bg-slate-400' :
                      item.name === 'doing' ? 'bg-sky-500' :
                      item.name === 'done' ? 'bg-emerald-500' : 'bg-fuchsia-400'
                    )}
                    style={{ width: `${Math.min(100, (item.value / Math.max(1, metrics[0]?.value || 1)) * 100)}%` }}
                  />
                </div>
              </div>
            )) : <p className="text-sm text-slate-400 italic">No data available</p>}
          </div>
        </section>
      </div>

      {/* RECENT ACTIVITY LOGS */}
      <section className="grid gap-6 xl:grid-cols-2">
        <Panel title="Recent Tasks" href="/tasks">
          {recent.tasks.map((item) => (
            <ListCard key={item.id} code={item.code} title={item.title}>
              <Badge value={item.priority} />
              <Badge value={item.status} />
            </ListCard>
          ))}
        </Panel>

        <Panel title="Recent Bugs" href="/bugs">
          {recent.bugs.map((item) => (
            <ListCard key={item.id} code={item.code} title={item.title}>
              <Badge value={item.severity} />
              <Badge value={item.priority} />
              <Badge value={item.status} />
            </ListCard>
          ))}
        </Panel>

        <Panel title="Recent Scenarios" href="/test-case-management">
          {recent.testCases.map((item) => (
            <ListCard key={item.id} code={item.code} title={item.title}>
              <div className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                {String(item.status)}
              </div>
            </ListCard>
          ))}
        </Panel>

        <Panel title="Meetings & Logs" href="/meeting-notes">
          {recent.meetings.map((item) => (
            <ListCard key={item.id} code={item.code} title={item.title} date={item.date} />
          ))}
          {recent.logs.map((item) => (
            <ListCard key={item.id} code={item.code} title={item.project} date={item.date} dashed />
          ))}
        </Panel>
      </section>
    </div>
  );
}

function Panel({
  title,
  href,
  children,
}: {
  title: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 bg-[#f4f8fb] px-6 py-4">
        <h3 className="text-base font-bold text-slate-900">{title}</h3>
        <Link className="no-print text-xs font-bold uppercase tracking-wider text-sky-700 hover:text-sky-900" href={href}>
          Open module
        </Link>
      </div>
      <div className="space-y-4 p-6">
        {React.Children.count(children) === 0 ? <p className="text-sm text-slate-400 italic">No recent activity</p> : children}
      </div>
    </div>
  );
}

function ListCard({
  code,
  title,
  date,
  children,
  dashed = false,
}: {
  code: string;
  title: string;
  date?: string;
  children?: React.ReactNode;
  dashed?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-3 transition hover:border-slate-300 hover:shadow-sm",
        dashed ? "border-dashed border-slate-200 bg-white" : "border-slate-100 bg-slate-50/50"
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
          {code}
        </span>
        {date ? <span className="text-[10px] font-medium text-slate-400">{formatDate(date)}</span> : null}
        <div className="flex flex-wrap gap-1.5 ml-auto">{children}</div>
      </div>
      <p className="mt-2 text-sm font-semibold text-slate-800 line-clamp-1">{title}</p>
    </div>
  );
}

