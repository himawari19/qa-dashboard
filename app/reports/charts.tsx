"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useEffect, useState } from "react";
import { ChartPieSlice, ChartBar as ChartBarIcon, ChartLine, FilePdf } from "@phosphor-icons/react";
import { PrintButton } from "@/components/print-button";

const COLORS = ["#0f172a", "#334155", "#475569", "#64748b", "#94a3b8", "#cbd5e1"];

type ChartDataProps = {
  bugSeverityData?: { name: string; value: number }[];
  bugStatusData?: { name: string; value: number }[];
  testCaseStatusData?: { name: string; value: number }[];
  bugTrendData?: { date: string; count: number }[];
};

export function ReportsCharts({
  bugSeverityData = [],
  bugStatusData = [],
  testCaseStatusData = [],
  bugTrendData = [],
}: ChartDataProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return <div className="h-96 w-full animate-pulse bg-slate-50 dark:bg-slate-900 rounded-md" />;

  const today = new Date().toLocaleDateString('en-GB', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });

  return (
    <div className="space-y-10 pb-20 print:p-0">
      
      {/* PRINT HEADER */}
      <div className="hidden print:flex items-center justify-between border-b-2 border-slate-900 pb-8 mb-12">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-slate-900 text-white shadow-lg">
             <ChartPieSlice size={32} weight="bold" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter text-slate-900 uppercase">QA Metrics Center</h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Detailed Visual Analysis Report</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black uppercase text-slate-400">Generated On</p>
          <p className="text-md font-bold text-slate-900">{today}</p>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between no-print">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Quality Analytics</h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Distribution and trends across the quality cycle.</p>
        </div>
        <PrintButton />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Severity Distribution */}
        <div className="group rounded-md border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-xl dark:border-slate-800 dark:bg-slate-900 print:shadow-none">
          <div className="flex items-center gap-3 mb-8">
            <ChartPieSlice size={24} weight="bold" className="text-slate-900 dark:text-slate-100" />
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">Bug Severity Distribution</h3>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={bugSeverityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={8}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {bugSeverityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '0px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    backgroundColor: '#0f172a',
                    color: '#fff'
                  }} 
                />
                <Legend iconType="square" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="group rounded-md border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-xl dark:border-slate-800 dark:bg-slate-900 print:shadow-none">
          <div className="flex items-center gap-3 mb-8">
            <ChartBarIcon size={24} weight="bold" className="text-slate-900 dark:text-slate-100" />
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">Bug Workflow Status</h3>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bugStatusData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: "#f8fafc" }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                  {bugStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Test Case Status */}
        <div className="group rounded-md border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-xl dark:border-slate-800 dark:bg-slate-900 print:shadow-none">
          <div className="flex items-center gap-3 mb-8">
            <FilePdf size={24} weight="bold" className="text-slate-900 dark:text-slate-100" />
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">Test Case Pass Rate</h3>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={testCaseStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={8}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {testCaseStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="square" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Discovery Trend */}
        <div className="group rounded-md border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-xl dark:border-slate-800 dark:bg-slate-900 print:shadow-none">
          <div className="flex items-center gap-3 mb-8">
            <ChartLine size={24} weight="bold" className="text-slate-900 dark:text-slate-100" />
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">Defect Discovery Trend</h3>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={bugTrendData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#0f172a"
                  strokeWidth={4}
                  dot={{ r: 4, fill: '#0f172a', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 8, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="hidden print:block pt-12 border-t border-slate-100 text-center">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          QA Daily Hub Analytics Engine • Confidential Performance Data
        </p>
      </div>
    </div>
  );
}
