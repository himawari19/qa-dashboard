"use client";

import React from "react";
import { TerminalWindow, Play, Table, WarningCircle } from "@phosphor-icons/react";

export default function SqlPlayground() {
  const [query, setQuery] = React.useState('SELECT * FROM "Task" LIMIT 10;');
  const [result, setResult] = React.useState<any[]>([]);
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const runQuery = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/tools/sql-run", {
        method: "POST",
        body: JSON.stringify({ query }),
      });
      const json = await res.json();
      if (json.error) setError(json.error);
      else setResult(json.data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const columns = result.length > 0 ? Object.keys(result[0]) : [];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">SQL Playground</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">Execute direct database queries for data verification.</p>
      </header>

      <div className="rounded-3xl border border-slate-200 bg-slate-900 overflow-hidden shadow-xl">
        <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-2 text-white/50">
            <TerminalWindow size={20} weight="fill" />
            <span className="text-xs font-bold uppercase tracking-widest text-white/40">Query Editor</span>
          </div>
          <button 
            onClick={runQuery}
            disabled={loading}
            className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-tighter transition disabled:opacity-50"
          >
            <Play size={16} weight="fill" />
            {loading ? "Running..." : "Run Query"}
          </button>
        </div>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full h-48 bg-transparent p-6 text-sky-400 font-mono text-sm focus:outline-none resize-none"
          spellCheck={false}
        />
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 text-sm font-bold animate-in fade-in slide-in-from-top-4">
          <WarningCircle size={20} weight="fill" />
          {error}
        </div>
      )}

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-400">
            <Table size={18} weight="bold" />
            <span className="text-xs font-bold uppercase tracking-widest">Query Results ({result.length})</span>
          </div>
        </div>
        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-white z-10 border-b border-slate-200">
              <tr>
                {columns.map(col => (
                  <th key={col} className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {result.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  {columns.map(col => (
                    <td key={col} className="px-6 py-4 text-xs font-medium text-slate-600 whitespace-nowrap">
                      {row[col] === null ? <span className="text-slate-300 italic">null</span> : String(row[col])}
                    </td>
                  ))}
                </tr>
              ))}
              {result.length === 0 && !loading && (
                <tr>
                  <td colSpan={100} className="px-6 py-12 text-center text-slate-400 text-sm italic">Execute a query to see results here.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
