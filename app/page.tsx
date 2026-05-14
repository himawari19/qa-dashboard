"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bug,
  Checks,
  ChartBar,
  Kanban,
  PlayCircle,
  ArrowRight,
  ShieldCheck,
  Lightning,
  Users,
} from "@phosphor-icons/react";

export default function LandingPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  // If user is already logged in, redirect to dashboard
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) {
          router.replace("/dashboard");
        } else {
          setChecking(false);
        }
      })
      .catch(() => setChecking(false));
  }, [router]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans text-slate-900">
      {/* Hero */}
      <header className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.15),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(37,99,235,0.12),transparent_40%),linear-gradient(135deg,#020617_0%,#0f172a_55%,#111827_100%)]">
        <div className="mx-auto flex max-w-5xl flex-col items-center px-6 py-24 text-center sm:py-32">
          <p className="mb-4 text-[11px] font-black uppercase tracking-[0.32em] text-sky-300">
            QA Daily Hub
          </p>
          <h1 className="text-4xl font-black leading-tight tracking-tight text-white sm:text-6xl">
            Quality Assurance,{" "}
            <span className="bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-transparent">
              streamlined.
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg font-medium leading-relaxed text-slate-300">
            A focused workspace for QA teams to manage test plans, track bugs,
            execute test sessions, and keep daily quality operations sharp and
            visible.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3.5 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-500 hover:-translate-y-0.5"
            >
              Sign In <ArrowRight size={16} weight="bold" />
            </Link>
          </div>
        </div>
      </header>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="mb-12 text-center">
          <h2 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            Everything your QA team needs
          </h2>
          <p className="mt-3 text-sm font-medium text-slate-500">
            From test planning to bug tracking — one workspace, zero friction.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={<Kanban size={22} weight="bold" className="text-blue-600" />}
            title="Task Management"
            description="Track daily QA tasks with priorities, assignees, and sprint integration."
          />
          <FeatureCard
            icon={<Bug size={22} weight="bold" className="text-rose-500" />}
            title="Bug Tracking"
            description="Log defects with severity, evidence, and module classification."
          />
          <FeatureCard
            icon={<Checks size={22} weight="bold" className="text-emerald-600" />}
            title="Test Cases"
            description="Maintain positive and negative scenarios ready for execution."
          />
          <FeatureCard
            icon={<PlayCircle size={22} weight="bold" className="text-amber-500" />}
            title="Test Execution"
            description="Run test sessions, record pass/fail results, and track coverage."
          />
          <FeatureCard
            icon={<ChartBar size={22} weight="bold" className="text-indigo-500" />}
            title="Dashboard & Insights"
            description="See what matters — open issues, team workload, and weekly pulse at a glance."
          />
          <FeatureCard
            icon={<Users size={22} weight="bold" className="text-violet-500" />}
            title="Team Collaboration"
            description="Role-based access, workspace isolation, and activity tracking."
          />
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-t border-slate-200 bg-white py-12">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-8 px-6 text-center">
          <TrustItem icon={<ShieldCheck size={20} weight="bold" />} label="Role-based Access" />
          <TrustItem icon={<Lightning size={20} weight="bold" />} label="Fast & Lightweight" />
          <TrustItem icon={<Users size={20} weight="bold" />} label="Multi-workspace" />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-slate-50 py-8 text-center">
        <p className="text-xs font-semibold text-slate-400">
          QA Daily Hub — Quality Ops Workspace
        </p>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-slate-300 hover:shadow-md">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50">
        {icon}
      </div>
      <h3 className="text-sm font-black text-slate-900">{title}</h3>
      <p className="mt-2 text-xs font-medium leading-relaxed text-slate-500">
        {description}
      </p>
    </div>
  );
}

function TrustItem({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 text-slate-600">
      {icon}
      <span className="text-xs font-bold">{label}</span>
    </div>
  );
}
