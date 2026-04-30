"use client";

import React, { useState, useEffect } from "react";
import { Dashboard } from "@/components/dashboard";
import { DashboardSkeleton } from "@/components/skeleton";
import { Funnel, X } from "@phosphor-icons/react";

export default function Home() {
  const [data, setData] = React.useState<any | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [projects, setProjects] = useState<string[]>([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/api/dashboard/projects")
      .then(r => r.json())
      .then(d => setProjects(d.projects || []))
      .catch(() => {});
  }, []);

  React.useEffect(() => {
    let active = true;
    setData(null);
    setError(null);

    const load = async () => {
      try {
        const url = selectedProject
          ? `/api/dashboard?project=${encodeURIComponent(selectedProject)}`
          : "/api/dashboard";
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error(`Failed to load dashboard (${res.status})`);
        const json = await res.json();
        if (active) setData(json);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Failed to load dashboard");
      }
    };

    load();
    return () => { active = false; };
  }, [selectedProject]);

  if (error) {
    return (
      <div className="rounded-md border border-rose-200 bg-rose-50 px-6 py-5 text-sm text-rose-700">
        {error}
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Project filter bar */}
      <div className="mb-4 flex items-center gap-2 flex-wrap">
        <div className="relative">
          <button
            onClick={() => setOpen(v => !v)}
            className="flex h-8 items-center gap-2 rounded-md border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 px-3 text-xs font-semibold text-slate-600 dark:text-slate-300 shadow-sm transition hover:border-sky-400 hover:text-sky-600"
          >
            <Funnel size={13} weight="bold" />
            {selectedProject || "All Projects"}
          </button>
          {open && (
            <div className="absolute left-0 top-full z-50 mt-1 w-56 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl overflow-y-auto max-h-64">
              <button
                onClick={() => { setSelectedProject(""); setOpen(false); }}
                className="block w-full px-3 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"
              >
                All Projects
              </button>
              {projects.map(p => (
                <button
                  key={p}
                  onClick={() => { setSelectedProject(p); setOpen(false); }}
                  className="block w-full px-3 py-2 text-left text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-sky-900/20 hover:text-sky-700 truncate"
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
        {selectedProject && (
          <button
            onClick={() => setSelectedProject("")}
            className="flex h-8 items-center gap-1.5 rounded-md bg-sky-100 dark:bg-sky-900/30 px-2.5 text-xs font-bold text-sky-700 dark:text-sky-300 hover:bg-sky-200 transition"
          >
            <X size={11} weight="bold" />
            Clear filter
          </button>
        )}
      </div>

      {!data ? <DashboardSkeleton /> : <Dashboard {...data} />}
    </div>
  );
}
