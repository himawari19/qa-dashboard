"use client";

import React from "react";
import Link from "next/link";
import { Badge } from "@/components/badge";
import { toast } from "@/components/ui/toast";
import { formatDate, cn } from "@/lib/utils";
import { Breadcrumb } from "@/components/breadcrumb";
import { Printer, FileXls, ChartPieSlice, ChartLineUp, Checks, Bug, ClipboardText, Table, PlayCircle, File, Note, SquaresFour, ShieldCheck, Clock, Tag, ArrowRight } from "@phosphor-icons/react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

type DashboardProps = {
  metrics: { label: string; value: number; caption: string }[];
  distribution: {
    tasks: { name: string; value: number }[];
    bugs: { name: string; value: number }[];
    bugByModule: { module: string; count: number }[];
  };
  personalSuccessRate: number;
  spotlight?: {
    projectName: string;
    projectDescription?: string;
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
  };
  sprintInfo?: {
    name: string;
    startDate: string;
    endDate: string;
    progress: number;
    taskTotal: number;
    taskDone: number;
    goal?: string;
  } | null;
  activity?: {
    id: number;
    entityType: string;
    entityId: string;
    action: string;
    summary: string;
    createdAt: string;
  }[];
  bugTrendData?: { date: string; count: number }[];
  sprints?: { id: number; name: string; startDate: string; endDate: string; status: string }[];
  todayActivity?: { type: string; label: string; status: string }[];
};

export function Dashboard({ 
  metrics, 
  distribution, 
  spotlight, 
  recent, 
  sprintInfo, 
  personalSuccessRate, 
  activity = [],
  bugTrendData = [], 
  sprints = [], 
  todayActivity = [] 
}: DashboardProps) {
  const [mounted, setMounted] = React.useState(false);
  const [showStandup, setShowStandup] = React.useState(false);
  const [selectedSprintId, setSelectedSprintId] = React.useState<number | null>(null);
  const handlePrint = () => { window.print(); };

  React.useEffect(() => { setMounted(true); }, []);

  const generateStandupText = () => {
    const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    let text = `*Standup Log - ${date}*\n\n`;
    
    const tasks = todayActivity.filter(a => a.type === 'Task');
    const bugs = todayActivity.filter(a => a.type === 'Bug');
    const sessions = todayActivity.filter(a => a.type === 'Session');

    text += `*Done Today:*\n`;
    if (tasks.length === 0 && bugs.length === 0 && sessions.length === 0) {
      text += `- Working on various QA activities\n`;
    } else {
      tasks.forEach(t => text += `- [Task] ${t.label} (${t.status})\n`);
      bugs.forEach(b => text += `- [Bug] ${b.label} (${b.status})\n`);
      sessions.forEach(s => text += `- [Test] Executed ${s.label} (Result: ${s.status})\n`);
    }

    text += `\n*Blockers:*\n- None\n\n*Next Plan:*\n- Continue testing current sprint items\n- Finalize pending bug verifications`;
    return text;
  };

  const copyStandup = () => {
    navigator.clipboard.writeText(generateStandupText());
    toast("Standup log copied to clipboard!", "success");
    setShowStandup(false);
  };

  const activeSprint = selectedSprintId
    ? sprints.find((s) => s.id === selectedSprintId) ?? null
    : null;
  const displayedSprint = activeSprint
    ? { ...sprintInfo, name: activeSprint.name, startDate: activeSprint.startDate, endDate: activeSprint.endDate, progress: sprintInfo?.progress ?? 0, taskDone: sprintInfo?.taskDone ?? 0, taskTotal: sprintInfo?.taskTotal ?? 0 }
    : sprintInfo;

  return (
    <div className="space-y-6 pb-12">
      <Breadcrumb crumbs={[{ label: "Overview" }]} />
      {/* HEADER & QUICK ACTIONS */}
      <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between no-print">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Overview</h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Welcome back! Here's your QA activity summary.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={handlePrint}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 text-xs font-bold text-slate-600 dark:text-slate-300 transition-all hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-black shadow-sm"
          >
            <Printer size={16} weight="bold" />
            Print Report
          </button>
          <button 
            onClick={() => setShowStandup(true)}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 dark:border-white/10 bg-indigo-600 px-4 text-xs font-bold text-white transition-all hover:bg-indigo-700 shadow-lg shadow-indigo-500/20"
          >
            <Note size={16} weight="bold" />
            Generate Standup
          </button>
          <div className="w-px h-6 bg-slate-200 dark:bg-white/10 mx-1 self-center" />
          <QuickActionBtn href="/bugs" icon={Bug} label="Bugs" />
          <QuickActionBtn href="/test-plans" icon={ClipboardText} label="Plans" />
          <QuickActionBtn href="/test-suites" icon={Table} label="Suites" />
          <QuickActionBtn href="/test-cases" icon={SquaresFour} label="Cases" />
          <QuickActionBtn href="/test-sessions" icon={PlayCircle} label="Execs" />
        </div>
      </header>

      {/* COMPACT STATS GRID */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.slice(0, 4).map((metric) => (
          <div key={metric.label} className="glass-card p-5 group transition-all duration-300 hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-indigo-600 transition">
              {metric.label}
            </p>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">{metric.value}</span>
              <span className="text-[10px] font-bold text-emerald-500">+12%</span>
            </div>
            <div className="mt-4 h-1 w-full bg-slate-100 dark:bg-white/5 rounded-md overflow-hidden">
               <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: '65%' }} />
            </div>
          </div>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* MAIN REPORTS */}
        <div className="lg:col-span-2 space-y-6">
          {/* SPOTLIGHT PROJECT */}
          {spotlight && (
            <section className="glass-card overflow-hidden animate-in fade-in slide-in-from-left-4 duration-700 fill-mode-both">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-8 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-black tracking-tight">{spotlight.projectName}</h2>
                    <p className="text-xs font-bold text-indigo-100 uppercase tracking-widest mt-1">Project Spotlight</p>
                  </div>
                  <div className="text-right">
                    <span className="text-4xl font-black tracking-tighter">{spotlight.completionRate}%</span>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-200">Execution Rate</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div className="bg-white/10 backdrop-blur-md rounded-md p-4 border border-white/10">
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Total Scenarios</p>
                    <p className="text-lg font-black mt-1">{spotlight.totalScenarios}</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-md p-4 border border-white/10">
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Open Bugs</p>
                    <p className="text-lg font-black mt-1">{spotlight.totalBugs}</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-md p-4 border border-white/10">
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Team Velocity</p>
                    <p className="text-lg font-black mt-1">2.4x</p>
                  </div>
                </div>
              </div>
              <div className="p-6 bg-white dark:bg-slate-900">
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <h3 className="text-[10px] font-black uppercase text-rose-500 tracking-widest mb-3 flex items-center gap-2">
                      <Bug size={14} weight="bold" />
                      Critical Defects
                    </h3>
                    <div className="space-y-2">
                      {spotlight.criticalBugs.slice(0, 3).map(bug => (
                        <div key={bug.code} className="flex items-center gap-3 text-xs bg-slate-50 dark:bg-white/5 p-2 rounded-md">
                          <span className="font-bold text-slate-400 w-12 shrink-0">{bug.code}</span>
                          <span className="text-slate-700 dark:text-slate-300 line-clamp-1 flex-1">{bug.title}</span>
                          <Badge value={bug.severity} className="text-[9px]" />
                        </div>
                      ))}
                      {spotlight.criticalBugs.length === 0 && <p className="text-xs text-slate-400 italic">No critical defects.</p>}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-[10px] font-black uppercase text-indigo-500 tracking-widest mb-3 flex items-center gap-2">
                      <Checks size={14} weight="bold" />
                      Priority Tasks
                    </h3>
                    <div className="space-y-2">
                      {spotlight.priorityTasks.slice(0, 3).map(task => (
                        <div key={task.code} className="flex items-center gap-3 text-xs bg-slate-50 dark:bg-white/5 p-2 rounded-md">
                          <span className="font-bold text-slate-400 w-12 shrink-0">{task.code}</span>
                          <span className="text-slate-700 dark:text-slate-300 line-clamp-1 flex-1">{task.title}</span>
                          <Badge value={task.priority} className="text-[9px]" />
                        </div>
                      ))}
                      {spotlight.priorityTasks.length === 0 && <p className="text-xs text-slate-400 italic">No pending priority tasks.</p>}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* CHARTS & HEATMAP */}
          <section className="grid gap-6 md:grid-cols-2">
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Bug Trend</h3>
                <span className="text-[10px] font-bold text-slate-400">Last 7 Days</span>
              </div>
              {bugTrendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={150}>
                  <LineChart data={bugTrendData}>
                    <XAxis dataKey="date" hide />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", fontSize: 11 }}
                      itemStyle={{ fontWeight: 'bold' }}
                    />
                    <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: "#6366f1", strokeWidth: 0 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : <div className="h-[150px] flex items-center justify-center text-xs text-slate-400 italic">No trend data</div>}
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Quality Heatmap</h3>
                <span className="text-[10px] font-bold text-slate-400">By Module</span>
              </div>
              <div className="grid grid-cols-5 gap-2 h-[150px]">
                {distribution.bugByModule?.length ? (
                  distribution.bugByModule.slice(0, 10).map((m, i) => {
                    const intensity = Math.min(Math.max(m.count * 10, 10), 90);
                    return (
                      <div 
                        key={i} 
                        className="group relative flex items-center justify-center rounded-md transition-all duration-300 hover:scale-110"
                        style={{ backgroundColor: `rgba(239, 68, 68, ${intensity / 100})` }}
                      >
                        <span className="text-[10px] font-black text-white drop-shadow-md">{m.count}</span>
                        <div className="absolute bottom-full left-1/2 mb-2 w-max -translate-x-1/2 rounded bg-slate-900 px-2 py-1 text-[9px] font-bold text-white opacity-0 transition group-hover:opacity-100 pointer-events-none z-20">
                          {m.module}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-5 flex items-center justify-center text-xs text-slate-400 italic">No module data</div>
                )}
              </div>
            </div>
          </section>

          {/* SEVERITY DISTRIBUTION */}
          <section className="glass-card p-6">
             <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Severity Distribution</h3>
                <ChartPieSlice size={16} className="text-slate-400" />
              </div>
              {distribution.bugs.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={distribution.bugs} barCategoryGap="30%">
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                    <YAxis hide />
                    <Tooltip cursor={{fill: 'transparent'}} />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {distribution.bugs.map((item) => {
                        const name = item.name.toLowerCase();
                        return (
                          <Cell
                            key={item.name}
                            fill={
                              name === "critical" ? "#ef4444" :
                              name === "high" ? "#f87171" :
                              name === "medium" ? "#fbbf24" : "#10b981"
                            }
                          />
                        );
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="h-[200px] flex items-center justify-center text-xs text-slate-400 italic">No distribution data</div>}
          </section>
        </div>

        {/* SIDEBAR AREA */}
        <div className="space-y-6">
          {/* PERSONAL QUALITY SHIELD */}
          <section className="bg-slate-900 dark:bg-indigo-950 rounded-md p-6 text-white shadow-xl relative overflow-hidden animate-in fade-in slide-in-from-right-4 duration-700 fill-mode-both">
            <div className="absolute -right-4 -bottom-4 h-32 w-32 rounded-md bg-indigo-500/10 blur-2xl" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-md bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                  <Checks size={20} weight="bold" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Quality Shield</h3>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-300">Personal Score</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-5xl font-black tracking-tighter">{personalSuccessRate}%</span>
                <div className="flex-1 h-2 rounded-md bg-white/10 overflow-hidden">
                  <div className="h-full bg-indigo-500" style={{ width: `${personalSuccessRate}%` }} />
                </div>
              </div>
            </div>
          </section>

          {/* ACTIVITY TIMELINE */}
          <section className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Live Activity</h3>
              <Clock size={16} className="text-slate-400 animate-pulse" />
            </div>
            <div className="relative space-y-6 before:absolute before:left-[11px] before:top-2 before:h-[calc(100%-16px)] before:w-px before:bg-slate-200 dark:before:bg-white/10">
              {activity.length > 0 ? activity.slice(0, 5).map((log) => (
                <div key={log.id} className="relative pl-8">
                  <div className="absolute left-0 top-1.5 h-[22px] w-[22px] rounded-md border-2 border-white dark:border-slate-800 bg-slate-50 dark:bg-slate-700 flex items-center justify-center z-10">
                    {log.entityType === 'Bug' ? <Bug size={10} className="text-rose-500" /> : <Tag size={10} className="text-indigo-500" />}
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-800 dark:text-white line-clamp-1">{log.summary}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{log.action}</span>
                      <span className="text-[9px] font-medium text-slate-400 opacity-60">•</span>
                      <span className="text-[9px] font-medium text-slate-400">{formatDate(log.createdAt)}</span>
                    </div>
                  </div>
                </div>
              )) : <p className="text-xs text-slate-400 italic text-center py-4">No recent activity.</p>}
            </div>
            <button className="w-full mt-6 py-2 rounded-md bg-slate-50 dark:bg-white/5 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10 transition">
              View Full History
            </button>
          </section>

          {/* SPRINT PROGRESS */}
          {displayedSprint && (
            <section className="glass-card p-6">
               <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{displayedSprint.name}</h3>
                  <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md ring-1 ring-emerald-100">{displayedSprint.progress}%</span>
               </div>
               <div className="h-2 w-full bg-slate-100 dark:bg-white/5 rounded-md overflow-hidden mb-3">
                  <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${displayedSprint.progress}%` }} />
               </div>
               <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <span>{displayedSprint.taskDone} Done</span>
                  <span>{displayedSprint.taskTotal} Total</span>
               </div>
            </section>
          )}
        </div>
      </div>

      {/* Standup Modal */}
      {showStandup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-md bg-white dark:bg-slate-900 p-8 shadow-2xl animate-in zoom-in-95 duration-200 ring-1 ring-slate-200 dark:ring-white/10">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-md bg-indigo-600 flex items-center justify-center text-white">
                <Note size={24} weight="bold" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Daily Standup Log</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Drafted from today's activity</p>
              </div>
            </div>
            
            <div className="bg-slate-50 dark:bg-white/5 rounded-md p-5 mb-8 font-mono text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap border border-slate-100 dark:border-white/5 max-h-[300px] overflow-y-auto">
              {generateStandupText()}
            </div>

            <div className="flex gap-3">
              <button 
                onClick={copyStandup}
                className="flex-1 h-12 rounded-md bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/20"
              >
                Copy to Clipboard
              </button>
              <button 
                onClick={() => setShowStandup(false)}
                className="px-6 h-12 rounded-md bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-200 dark:hover:bg-white/10 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function QuickActionBtn({ href, icon: Icon, label }: { href: string; icon: any; label: string }) {
  return (
    <Link 
      href={href} 
      className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 text-xs font-bold text-slate-600 dark:text-slate-300 transition-all hover:bg-indigo-600 hover:text-white hover:border-indigo-600 hover:-translate-y-0.5 shadow-sm"
    >
      <Icon size={16} weight="bold" />
      {label}
    </Link>
  );
}
