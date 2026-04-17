"use client";

import React from "react";
import { Dashboard } from "@/components/dashboard";
import { DashboardSkeleton } from "@/components/skeleton";

export default function Home() {
  const [data, setData] = React.useState<any | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const res = await fetch("/api/dashboard", { cache: "no-store" });
        if (!res.ok) throw new Error(`Failed to load dashboard (${res.status})`);
        const json = await res.json();
        if (active) setData(json);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Failed to load dashboard");
      }
    };

    load();

    return () => {
      active = false;
    };
  }, []);

  if (error) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50 px-6 py-5 text-sm text-rose-700">
        {error}
      </div>
    );
  }

  if (!data) return <DashboardSkeleton />;

  return <Dashboard {...data} />;
}
