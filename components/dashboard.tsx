"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Badge } from "@/components/badge";
import { toast } from "@/components/ui/toast";
import { formatDate, cn } from "@/lib/utils";
import { Breadcrumb } from "@/components/breadcrumb";
import { Printer, FileXls, ChartPieSlice, ChartLineUp, Checks, Bug, ClipboardText, Table, PlayCircle, File, Note, SquaresFour, ShieldCheck, Clock, Tag, ArrowRight, User } from "@phosphor-icons/react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const RESOURCE_COLORS = [
  "#3b82f6", // Blue
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#6366f1", // Indigo
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#f97316", // Orange
];

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
  heatmap?: { name: string; taskCount: number; bugCount: number; total: number }[];
  rolePersona?: string;
  roleRecommendations?: {
    title: string;
    items: { label: string; count: number }[];
  } | null;
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
  todayActivity = [],
  heatmap = [],
  rolePersona = "User",
  roleRecommendations = null
}: DashboardProps) {
  const [mounted, setMounted] = useState(false);
  const [showStandup, setShowStandup] = useState(false);
  const [selectedResource, setSelectedResource] = useState<any>(null);
  const [resourceItems, setResourceItems] = useState<any[]>([]);
  const [burnoutData, setBurnoutData] = useState<any[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [selectedSprintId, setSelectedSprintId] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
    // Fetch burnout data
    fetch('/api/dashboard/burnout').then(res => res.json()).then(data => setBurnoutData(data));
  }, []);

  const handlePrint = () => { window.print(); };

  useEffect(() => {
    if (selectedResource) {
      setLoadingDetails(true);
      fetch(`/api/dashboard/resource-details?name=${encodeURIComponent(selectedResource.name)}`)
        .then(res => res.json())
        .then(data => {
          const all = [...(data.tasks || []), ...(data.bugs || []), ...(data.suites || [])];
          setResourceItems(all);
          setLoadingDetails(false);
        })
        .catch(err => {
          console.error(err);
          setLoadingDetails(false);
        });
    } else {
      setResourceItems([]);
    }
  }, [selectedResource]);



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
      <Breadcrumb crumbs={[{ label: "Dashboard" }]} />
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
            className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 dark:border-white/10 bg-blue-600 px-4 text-xs font-bold text-white transition-all hover:bg-blue-700 shadow-lg shadow-blue-500/20"
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
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400 group-hover:text-blue-600 transition">
              {metric.label}
            </p>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">{metric.value}</span>
              <span className="text-[10px] font-bold text-blue-500 uppercase">Live</span>
            </div>
            <div className="mt-4 h-1 w-full bg-slate-100 dark:bg-white/5 rounded-md overflow-hidden">
               <div 
                 className="h-full bg-blue-500 transition-all duration-1000" 
                 style={{ width: `${Math.min(100, (metric.value / 20) * 100)}%` }} 
               />
            </div>
          </div>
        ))}
      </section>

      {/* ROLE-BASED FOCUS AREA */}
      {roleRecommendations && (
        <section className="animate-in fade-in slide-in-from-top-4 duration-700 fill-mode-both">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-6 w-6 rounded-md bg-blue-600 flex items-center justify-center text-white">
              <SquaresFour size={14} weight="bold" />
            </div>
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">
              {roleRecommendations.title} <span className="text-blue-500">• {rolePersona}</span>
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {roleRecommendations.items.map((item, idx) => (
              <div key={idx} className="glass-card p-4 border-l-4 border-l-blue-500">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{item.label}</p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-slate-900 dark:text-white">{item.count}</span>
                  <div className="h-8 w-8 rounded-full bg-blue-50 dark:bg-white/5 flex items-center justify-center text-blue-600">
                    <ArrowRight size={16} weight="bold" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* MAIN REPORTS */}
        <div className="lg:col-span-2 space-y-6">
          {/* PERSONAL QUALITY SHIELD (MOVED TO TOP OF MAIN) */}
          <section className="bg-slate-900 dark:bg-blue-950 rounded-md p-6 text-white shadow-xl relative overflow-hidden animate-in fade-in slide-in-from-left-4 duration-700 fill-mode-both">
            <div className="absolute -right-4 -bottom-4 h-32 w-32 rounded-md bg-blue-500/10 blur-2xl" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-md bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/30 shrink-0">
                  <Checks size={24} weight="bold" />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight">Personal Quality Shield</h3>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-blue-300">Performance Assessment</p>
                </div>
              </div>
              <div className="flex flex-1 items-center gap-6 max-w-md">
                <div className="flex flex-col items-end shrink-0">
                  <span className="text-4xl font-black tracking-tighter">{personalSuccessRate}%</span>
                  <span className="text-[9px] font-black uppercase text-blue-400 tracking-widest">Success Rate</span>
                </div>
                <div className="flex-1 h-3 rounded-full bg-white/10 overflow-hidden p-0.5">
                  <div className="h-full bg-blue-500 rounded-full shadow-[0_0_12px_rgba(59,130,246,0.5)] transition-all duration-1000" style={{ width: `${personalSuccessRate}%` }} />
                </div>
              </div>
            </div>
          </section>

          {/* SPOTLIGHT PROJECT */}
          {spotlight && (
            <section className="glass-card overflow-hidden animate-in fade-in slide-in-from-left-4 duration-700 fill-mode-both">
              <div className="bg-gradient-to-r from-blue-600 to-sky-500 px-6 py-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-black tracking-tight">{spotlight.projectName}</h2>
                    <p className="text-[10px] font-bold text-blue-100 uppercase tracking-widest mt-0.5">Project Spotlight</p>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-black tracking-tighter">{spotlight.completionRate}%</span>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-blue-200">Execution Rate</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white/10 backdrop-blur-md rounded-md p-3 border border-white/10">
                    <p className="text-[9px] font-black uppercase tracking-widest text-blue-100">Scenarios</p>
                    <p className="text-base font-black">{spotlight.totalScenarios}</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-md p-3 border border-white/10">
                    <p className="text-[9px] font-black uppercase tracking-widest text-blue-100">Open Bugs</p>
                    <p className="text-base font-black">{spotlight.totalBugs}</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-md p-3 border border-white/10">
                    <p className="text-[9px] font-black uppercase tracking-widest text-blue-100">Health</p>
                    <p className="text-base font-black">{spotlight.completionRate > 80 ? 'Good' : 'At Risk'}</p>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-white dark:bg-slate-900">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h3 className="text-[9px] font-black uppercase text-rose-500 tracking-widest mb-2 flex items-center gap-2">
                      <Bug size={12} weight="bold" />
                      Critical Defects
                    </h3>
                    <div className="space-y-1.5">
                      {spotlight.criticalBugs.slice(0, 2).map(bug => (
                        <div key={bug.code} className="flex items-center gap-2 text-[10px] bg-slate-50 dark:bg-white/5 p-2 rounded-md">
                          <span className="font-bold text-slate-400 w-10 shrink-0">{bug.code}</span>
                          <span className="text-slate-700 dark:text-slate-300 line-clamp-1 flex-1">{bug.title}</span>
                          <Badge value={bug.severity} className="text-[8px] h-4" />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-[9px] font-black uppercase text-blue-500 tracking-widest mb-2 flex items-center gap-2">
                      <Checks size={12} weight="bold" />
                      Priority Tasks
                    </h3>
                    <div className="space-y-1.5">
                      {spotlight.priorityTasks.slice(0, 2).map(task => (
                        <div key={task.code} className="flex items-center gap-2 text-[10px] bg-slate-50 dark:bg-white/5 p-2 rounded-md">
                          <span className="font-bold text-slate-400 w-10 shrink-0">{task.code}</span>
                          <span className="text-slate-700 dark:text-slate-300 line-clamp-1 flex-1">{task.title}</span>
                          <Badge value={task.priority} className="text-[8px] h-4" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* CHARTS GRID */}
          <section className="grid gap-6 md:grid-cols-3">
            {/* BUG TREND */}
            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Bug Trend</h3>
                <span className="text-[9px] font-bold text-slate-400">7D</span>
              </div>
              <div className="h-[120px]">
                {mounted && bugTrendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={bugTrendData}>
                      <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={false} />
                      <Tooltip contentStyle={{ fontSize: 10, borderRadius: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : <div className="h-full flex items-center justify-center text-[10px] text-slate-400 italic">No trend data</div>}
              </div>
            </div>

            {/* RESOURCE DISTRIBUTION */}
            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Resources</h3>
                <ChartPieSlice size={14} className="text-slate-400" />
              </div>
              <div className="h-[120px]">
                {mounted && heatmap.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={heatmap} cx="50%" cy="50%" innerRadius={35} outerRadius={50} dataKey="total">
                        {heatmap.map((_, index) => <Cell key={index} fill={RESOURCE_COLORS[index % RESOURCE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: 10, borderRadius: 8 }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <div className="h-full flex items-center justify-center text-[10px] text-slate-400 italic">No data</div>}
              </div>
            </div>

            {/* SEVERITY DISTRIBUTION */}
            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Severity</h3>
                <ShieldCheck size={14} className="text-slate-400" />
              </div>
              <div className="h-[120px]">
                {mounted && distribution.bugs.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={distribution.bugs} cx="50%" cy="50%" innerRadius={35} outerRadius={50} dataKey="value">
                        {distribution.bugs.map((item) => (
                          <Cell key={item.name} fill={item.name.toLowerCase() === 'critical' ? '#f43f5e' : item.name.toLowerCase() === 'high' ? '#fb7185' : '#f59e0b'} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: 10, borderRadius: 8 }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <div className="h-full flex items-center justify-center text-[10px] text-slate-400 italic">No data</div>}
              </div>
            </div>
          </section>

          {/* TEAM BURNOUT HEATMAP (FULL WIDTH) */}
          <section className="glass-card p-6">
             <div className="flex items-center justify-between mb-8">
               <div>
                 <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Team Workload & Burnout Heatmap</h3>
                 <p className="text-[10px] font-medium text-slate-400 mt-1">Real-time mental load assessment based on task complexity and deadlines.</p>
               </div>
               <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-white/5 px-2.5 py-1 rounded-full border border-slate-100 dark:border-white/10">
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-[8px] font-bold uppercase text-slate-500">Light</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-white/5 px-2.5 py-1 rounded-full border border-slate-100 dark:border-white/10">
                    <div className="h-2 w-2 rounded-full bg-amber-500" />
                    <span className="text-[8px] font-bold uppercase text-slate-500">Heavy</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-white/5 px-2.5 py-1 rounded-full border border-slate-100 dark:border-white/10">
                    <div className="h-2 w-2 rounded-full bg-rose-500" />
                    <span className="text-[8px] font-bold uppercase text-slate-500">Burnout</span>
                  </div>
               </div>
             </div>
             
             <div className="grid gap-x-12 gap-y-8 md:grid-cols-2">
               {burnoutData.length > 0 ? burnoutData.map((user) => (
                 <div key={user.name} className="relative">
                   <div className="flex items-center justify-between mb-2.5">
                     <div className="flex items-center gap-3">
                       <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-xs font-black text-slate-500 border border-slate-200 dark:border-white/10">
                         {user.name.charAt(0)}
                       </div>
                       <div className="flex flex-col">
                         <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{user.name}</span>
                         <span className={cn(
                           "text-[8px] font-black uppercase tracking-tighter",
                           user.level === 'burnout' ? "text-rose-500" :
                           user.level === 'heavy' ? "text-orange-500" :
                           user.level === 'optimal' ? "text-amber-500" : "text-emerald-500"
                         )}>
                           {user.level} risk
                         </span>
                       </div>
                     </div>
                     <div className="flex items-center gap-4 text-[9px] font-bold text-slate-400">
                       <div className="flex flex-col items-end">
                         <span>{user.itemCount} Items</span>
                         <span>{user.projectCount} Projects</span>
                       </div>
                       <div className="h-8 w-px bg-slate-100 dark:bg-white/5" />
                       <span className="text-xl font-black text-slate-900 dark:text-white w-10 text-right">{user.points}</span>
                     </div>
                   </div>
                   <div className="relative h-2 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "absolute left-0 top-0 h-full transition-all duration-1000 ease-out rounded-full",
                          user.level === 'burnout' ? "bg-gradient-to-r from-rose-500 to-red-600 shadow-[0_0_8px_rgba(244,63,94,0.4)]" :
                          user.level === 'heavy' ? "bg-gradient-to-r from-orange-400 to-rose-500" :
                          user.level === 'optimal' ? "bg-gradient-to-r from-amber-400 to-orange-400" :
                          "bg-gradient-to-r from-emerald-400 to-teal-500"
                        )}
                        style={{ width: `${Math.min(100, (user.points / 60) * 100)}%` }}
                      />
                   </div>
                 </div>
               )) : (
                 <div className="col-span-2 py-12 text-center text-xs text-slate-400 italic bg-slate-50/50 dark:bg-white/2 rounded-xl border border-dashed border-slate-200 dark:border-white/5">
                   No team activity data found for current cycle.
                 </div>
               )}
             </div>
          </section>
        </div>

        {/* SIDEBAR AREA */}
        <div className="space-y-6">


          <section className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Live Activity</h3>
              <Clock size={16} className="text-slate-400 animate-pulse" />
            </div>
            <div className="relative space-y-6 before:absolute before:left-[11px] before:top-2 before:h-[calc(100%-16px)] before:w-px before:bg-slate-200 dark:before:bg-white/10">
              {activity.length > 0 ? activity.slice(0, 3).map((log) => (
                <Link 
                  key={log.id} 
                  href={
                    log.entityType === 'Bug' ? '/bugs' : 
                    log.entityType === 'Task' ? '/tasks' : 
                    log.entityType === 'TestPlan' ? '/test-plans' : 
                    log.entityType === 'TestSuite' ? '/test-suites' : 
                    log.entityType === 'MeetingNote' ? '/meeting-notes' : 
                    log.entityType === 'Sprint' ? '/sprints' : '#'
                  }
                  className="relative pl-8 block group hover:bg-slate-50 dark:hover:bg-white/5 p-2 rounded-md -ml-2 transition"
                >
                  <div className="absolute left-0 top-3.5 h-[22px] w-[22px] rounded-md border-2 border-white dark:border-slate-800 bg-slate-50 dark:bg-slate-700 flex items-center justify-center z-10 group-hover:border-blue-500 transition">
                    {log.entityType === 'Bug' ? <Bug size={10} className="text-rose-500" /> : 
                     log.entityType === 'Task' ? <Tag size={10} className="text-blue-500" /> :
                     log.entityType === 'Sprint' ? <Clock size={10} className="text-emerald-500" /> :
                     log.entityType === 'MeetingNote' ? <Note size={10} className="text-amber-500" /> :
                     log.entityType === 'TestPlan' ? <ClipboardText size={10} className="text-indigo-500" /> :
                     log.entityType === 'TestSuite' ? <Table size={10} className="text-sky-500" /> :
                     log.entityType === 'TestCase' ? <Checks size={10} className="text-emerald-600" /> :
                     log.entityType === 'TestSession' ? <PlayCircle size={10} className="text-rose-600" /> :
                     <ShieldCheck size={10} className="text-slate-500" />}
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-800 dark:text-white line-clamp-1 group-hover:text-blue-600 transition">{log.summary}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400">{log.action}</span>
                      <span className="text-[8px] font-medium text-slate-400 opacity-60">•</span>
                      <span className="text-[8px] font-medium text-slate-400">{formatDate(log.createdAt)}</span>
                    </div>
                  </div>
                </Link>
              )) : <p className="text-xs text-slate-400 italic text-center py-4">No recent activity.</p>}
            </div>
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
                className="flex-1 h-12 rounded-md bg-blue-600 text-white font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-500/20"
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
      {/* Resource Detail Modal */}
      {selectedResource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-md bg-white dark:bg-slate-900 p-8 shadow-2xl animate-in zoom-in-95 duration-200 ring-1 ring-slate-200 dark:ring-white/10">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "h-14 w-14 rounded-md flex items-center justify-center text-white shadow-xl",
                  selectedResource.total > 5 ? "bg-rose-500 shadow-rose-500/20" : "bg-blue-600 shadow-blue-600/20"
                )}>
                  <User size={28} weight="bold" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">{selectedResource.name}</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Workload Analysis</p>
                </div>
              </div>
              <button onClick={() => setSelectedResource(null)} className="h-10 w-10 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/5 transition">
                 <ArrowRight size={20} className="rotate-180" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-6 text-center">
              {[
                { label: 'Tasks', count: selectedResource.taskCount, color: 'text-blue-500' },
                { label: 'Bugs', count: selectedResource.bugCount, color: 'text-rose-500' },
                { label: 'Suites', count: selectedResource.suiteCount, color: 'text-amber-500' },
                { label: 'Plans', count: selectedResource.planCount, color: 'text-indigo-500' },
              ].map(stat => (
                <div key={stat.label} className="p-3 rounded-md bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                  <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
                  <p className={cn("text-lg font-black", stat.color)}>{stat.count}</p>
                </div>
              ))}
            </div>

            <div className="mb-6">
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Itemized Responsibilities</p>
               <div className="max-h-[300px] overflow-y-auto pr-1 space-y-2 custom-scrollbar">
                  {loadingDetails ? (
                    <div className="py-12 flex flex-col items-center gap-3">
                       <div className="h-8 w-8 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin" />
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Loading Items...</p>
                    </div>
                  ) : resourceItems.length > 0 ? resourceItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-md bg-slate-50/50 dark:bg-white/2 border border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition">
                       <div className={cn(
                         "h-6 w-12 rounded flex items-center justify-center text-[8px] font-black uppercase tracking-widest text-white shrink-0",
                         item.type === 'Bug' ? "bg-rose-500" : item.type === 'Task' ? "bg-blue-500" : "bg-amber-500"
                       )}>
                         {item.type}
                       </div>
                       <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex-1 line-clamp-1">{item.title}</span>
                       <Badge value={item.priority} className="text-[8px] h-5" />
                    </div>
                  )) : (
                    <p className="text-xs text-slate-400 italic text-center py-8">No active items found.</p>
                  )}
               </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
               <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Capacity Health</span>
                  <span className={cn("text-xs font-black uppercase", selectedResource.total > 5 ? "text-rose-500" : "text-emerald-500")}>
                    {selectedResource.total > 5 ? "Overloaded" : "Healthy Workload"}
                  </span>
               </div>
               <button 
                onClick={() => setSelectedResource(null)}
                className="px-6 h-10 rounded-md bg-slate-900 dark:bg-white text-white dark:text-black font-bold hover:opacity-90 transition text-xs shadow-lg"
              >
                Close Details
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
      className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 text-xs font-bold text-slate-600 dark:text-slate-300 transition-all hover:bg-blue-600 hover:text-white hover:border-blue-600 hover:-translate-y-0.5 shadow-sm"
    >
      <Icon size={16} weight="bold" />
      {label}
    </Link>
  );
}
