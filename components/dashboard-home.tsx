"use client";

import React, { useEffect, useRef, useState } from "react";
import { Funnel, X } from "@phosphor-icons/react";
import { Dashboard } from "@/components/dashboard";
import { DashboardSkeleton } from "@/components/skeleton";

type Props = {
  initialData: any | null;
  initialProjects: string[];
};

export function DashboardHome({ initialData, initialProjects }: Props) {
  const [data, setData] = useState<any | null>(initialData);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<string[]>(initialProjects);
  const [selectedProject, setSelectedProject] = useState("");
  const [open, setOpen] = useState(false);
  const hasServerData = useRef(Boolean(initialData));

  // Fetch projects list (lightweight, cached server-side)
  useEffect(() => {
    let active = true;
    fetch("/api/dashboard/projects", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => { if (active) setProjects(j.projects || []); })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  // Fetch dashboard data — skip initial fetch if server already provided it
  useEffect(() => {
    if (!selectedProject && hasServerData.current && data) return;

    let active = true;
    if (!selectedProject) setData(null);
    setError(null);

    const load = async () => {
      try {
        const dataRes = await fetch(
          selectedProject ? `/api/dashboard?project=${encodeURIComponent(selectedProject)}` : "/api/dashboard",
          { cache: "no-store" }
        );
        if (!dataRes.ok) throw new Error(`Failed to load dashboard (${dataRes.status})`);
        const dataJson = await dataRes.json();
        if (!active) return;
        setData(dataJson);
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
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative">
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex h-8 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-sky-400 hover:text-sky-600 dark:border-white/10 dark:bg-slate-800 dark:text-slate-300"
          >
            <Funnel size={13} weight="bold" />
            {selectedProject || "All Projects"}
          </button>
          {open && (
            <div className="absolute left-0 top-full z-50 mt-1 max-h-64 w-56 overflow-y-auto rounded-md border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800">
              <button
                onClick={() => { setSelectedProject(""); setOpen(false); }}
                className="block w-full px-3 py-2 text-left text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/5"
              >
                All Projects
              </button>
              {projects.map((p) => (
                <button
                  key={p}
                  onClick={() => { setSelectedProject(p); setOpen(false); }}
                  className="block w-full truncate px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-sky-50 hover:text-sky-700 dark:text-slate-200 dark:hover:bg-sky-900/20"
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
            className="flex h-8 items-center gap-1.5 rounded-md bg-sky-100 px-2.5 text-xs font-bold text-sky-700 transition hover:bg-sky-200 dark:bg-sky-900/30 dark:text-sky-300"
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
