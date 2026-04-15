"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Funnel, X } from "@phosphor-icons/react";

export function RTMFilter({ 
  requirements,
  projects 
}: { 
  requirements: { id: string, title: string }[],
  projects: string[]
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentReq = searchParams.get("req") || "";
  const currentProject = searchParams.get("project") || "";

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/reports/rtm?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push("/reports/rtm");
  };

  const hasFilters = currentReq || currentProject;

  return (
    <div className="flex flex-wrap items-center gap-4 py-2">
      <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 shadow-sm focus-within:border-sky-500 transition-all">
        <Funnel size={16} className="text-slate-400" />
        <select 
          value={currentReq} 
          onChange={(e) => updateFilter("req", e.target.value)}
          className="bg-transparent text-sm font-semibold text-slate-700 outline-none min-w-[180px]"
        >
          <option value="">All Requirements</option>
          {requirements.map(r => (
            <option key={r.id} value={r.id}>{r.id} - {r.title}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 shadow-sm focus-within:border-sky-500 transition-all">
        <select 
          value={currentProject} 
          onChange={(e) => updateFilter("project", e.target.value)}
          className="bg-transparent text-sm font-semibold text-slate-700 outline-none min-w-[150px]"
        >
          <option value="">All Projects</option>
          {projects.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      {hasFilters && (
        <button 
          onClick={clearFilters}
          className="flex items-center gap-2 rounded-2xl bg-rose-50 px-4 py-2 text-sm font-bold text-rose-600 transition hover:bg-rose-100"
        >
          <X size={14} weight="bold" />
          Reset
        </button>
      )}
    </div>
  );
}
