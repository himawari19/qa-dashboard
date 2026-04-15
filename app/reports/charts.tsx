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

const COLORS = ["#0284c7", "#16a34a", "#eab308", "#dc2626", "#9333ea", "#f97316"];

import { useEffect, useState } from "react";

type ChartDataProps = {
  bugSeverityData: { name: string; value: number }[];
  bugStatusData: { name: string; value: number }[];
  testCaseStatusData: { name: string; value: number }[];
  bugTrendData: { date: string; count: number }[];
};

export function ReportsCharts({
  bugSeverityData,
  bugStatusData,
  testCaseStatusData,
  bugTrendData,
}: ChartDataProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return <div className="h-96 w-full animate-pulse bg-slate-50 rounded-3xl" />;
  return (
    <div>
      <div className="flex flex-col gap-3 print:hidden sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Quality Visualization</h2>
          <p className="text-sm leading-6 text-slate-600">Performance metrics for bug tracking and test case execution.</p>
        </div>
        <button
          onClick={() => window.print()}
          className="inline-flex h-10 items-center rounded-full bg-sky-700 px-5 text-sm font-semibold text-white transition hover:bg-sky-800"
        >
          Download PDF Report
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-700">
            Bug Distribution by Severity
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              <PieChart>
                <Pie
                  data={bugSeverityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) =>
                    `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                >
                  {bugSeverityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-700">
            Bug Distribution by Status
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              <BarChart data={bugStatusData} margin={{ top: 20, right: 24, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#475569" }} />
                <YAxis allowDecimals={false} tick={{ fill: "#475569" }} />
                <Tooltip cursor={{ fill: "#f8fafc" }} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {bugStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-700">
            Test Case Execution Status
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              <PieChart>
                <Pie
                  data={testCaseStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) =>
                    `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                >
                  {testCaseStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[(index + 1) % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-700">
            Bug Trend (Reported per Day)
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              <LineChart data={bugTrendData} margin={{ top: 20, right: 24, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: "#475569" }} />
                <YAxis allowDecimals={false} tick={{ fill: "#475569" }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#db2777"
                  strokeWidth={3}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
