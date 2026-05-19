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
  Users,
  ClipboardText,
  Timer,
  TrendUp,
  CalendarBlank,
  Note,
} from "@phosphor-icons/react";

export default function LandingPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

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
    <div className="flex min-h-screen flex-col bg-white font-sans text-slate-900 overflow-x-hidden">
      {/* Navigation - no color change on hover */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-slate-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-slate-900 via-sky-700 to-cyan-400 shadow-sm">
              <ShieldCheck size={14} weight="bold" className="text-white" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-xs font-black tracking-tight text-slate-900">QA Daily Hub</span>
              <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-slate-400">Quality Ops</span>
            </div>
          </div>
          <Link
            href="/login"
            className="inline-flex h-8 items-center rounded-lg bg-blue-600 px-4 text-[11px] font-bold text-white transition-all hover:bg-blue-500"
          >
            Sign In
          </Link>
        </div>
      </nav>

      {/* Hero - compact */}
      <header className="relative pt-14 bg-gradient-to-b from-blue-50/60 to-white">
        <div className="relative mx-auto flex max-w-4xl flex-col items-center px-6 pb-14 pt-16 text-center sm:pt-20 sm:pb-16">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 shadow-sm">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
              Quality Operations Platform
            </span>
          </div>

          <h1 className="max-w-3xl text-3xl font-black leading-[1.15] tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
            Ship with confidence.{" "}
            <span className="bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-500 bg-clip-text text-transparent">
              Track every defect.
            </span>
          </h1>

          <p className="mt-4 max-w-xl text-sm font-medium leading-relaxed text-slate-500">
            The workspace built for QA teams - manage test plans, track bugs, execute sessions,
            and keep your entire quality pipeline visible.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/login"
              className="group inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-600/15 transition-all hover:bg-blue-500 hover:-translate-y-0.5"
            >
              Get Started
              <ArrowRight size={14} weight="bold" className="transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-6 py-2.5 text-sm font-bold text-slate-600 shadow-sm transition-all hover:border-slate-300 hover:shadow-md"
            >
              Sign In to Workspace
            </Link>
          </div>

          {/* Stats row */}
          <div className="mt-12 flex items-center gap-8 sm:gap-10">
            <StatHighlight value="6+" label="Modules" />
            <div className="h-8 w-px bg-slate-200" />
            <StatHighlight value="100%" label="Role-based" />
            <div className="h-8 w-px bg-slate-200" />
            <StatHighlight value="Real-time" label="Dashboard" />
          </div>
        </div>
      </header>

      {/* Features Grid - compact */}
      <section className="bg-gradient-to-b from-slate-50 to-blue-50/20">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <div className="mb-10 text-center">
            <p className="mb-2 text-[11px] font-black uppercase tracking-[0.3em] text-blue-600">
              Core Capabilities
            </p>
            <h2 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
              Everything your QA workflow demands
            </h2>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<ClipboardText size={18} weight="bold" />}
              color="text-blue-600"
              bg="bg-blue-50"
              title="Test Plans & Suites"
              description="Organize scenarios into plans and suites with sprint traceability."
            />
            <FeatureCard
              icon={<Checks size={18} weight="bold" />}
              color="text-emerald-600"
              bg="bg-emerald-50"
              title="Test Case Library"
              description="Structured repository with preconditions, steps, and expected results."
            />
            <FeatureCard
              icon={<PlayCircle size={18} weight="bold" />}
              color="text-amber-600"
              bg="bg-amber-50"
              title="Test Execution"
              description="Run sessions, record verdicts, and track pass rates per cycle."
            />
            <FeatureCard
              icon={<Bug size={18} weight="bold" />}
              color="text-rose-600"
              bg="bg-rose-50"
              title="Bug Tracking"
              description="Log defects with severity, evidence, and full lifecycle tracking."
            />
            <FeatureCard
              icon={<Kanban size={18} weight="bold" />}
              color="text-violet-600"
              bg="bg-violet-50"
              title="Task & Sprint Board"
              description="Kanban views, sprint assignments, and status workflows."
            />
            <FeatureCard
              icon={<ChartBar size={18} weight="bold" />}
              color="text-indigo-600"
              bg="bg-indigo-50"
              title="Dashboard & Reports"
              description="Health scores, weekly reports, heatmaps, and trend analysis."
            />
          </div>
        </div>
      </section>

      {/* Workflow Section - compact */}
      <section className="bg-white">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <div className="mb-10 text-center">
            <p className="mb-2 text-[11px] font-black uppercase tracking-[0.3em] text-emerald-600">
              Built for Teams
            </p>
            <h2 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
              Your daily QA rhythm, simplified
            </h2>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            <WorkflowStep step="01" icon={<CalendarBlank size={16} weight="bold" />} title="Plan" description="Define sprints, create test plans, and assign scope." />
            <WorkflowStep step="02" icon={<PlayCircle size={16} weight="bold" />} title="Execute" description="Run sessions and record pass/fail verdicts." />
            <WorkflowStep step="03" icon={<Bug size={16} weight="bold" />} title="Track" description="Log bugs, assign owners, monitor resolution." />
            <WorkflowStep step="04" icon={<TrendUp size={16} weight="bold" />} title="Report" description="Weekly reports and quality health metrics." />
          </div>
        </div>
      </section>

      {/* Additional Features - compact */}
      <section className="bg-gradient-to-b from-sky-50/30 to-slate-50/50">
        <div className="mx-auto max-w-5xl px-6 py-12">
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            <MiniFeature icon={<ShieldCheck size={16} weight="bold" />} label="Role-based Access" description="Admin, QA, Dev, PM - each sees what they need." />
            <MiniFeature icon={<Users size={16} weight="bold" />} label="Multi-workspace" description="Isolated company workspaces with team separation." />
            <MiniFeature icon={<Timer size={16} weight="bold" />} label="Activity Tracking" description="Full audit trail of every action across modules." />
            <MiniFeature icon={<Note size={16} weight="bold" />} label="Meeting Notes" description="Document standups, retrospectives, and decisions." />
          </div>
        </div>
      </section>

      {/* CTA - compact */}
      <section className="bg-gradient-to-br from-blue-600 to-indigo-700">
        <div className="mx-auto max-w-3xl px-6 py-14 text-center">
          <h2 className="text-xl font-black tracking-tight text-white sm:text-2xl">
            Ready to streamline your QA process?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-xs font-medium leading-relaxed text-blue-100">
            Sign in to your workspace or contact your administrator for access.
          </p>
          <div className="mt-6">
            <Link
              href="/login"
              className="group inline-flex items-center gap-2 rounded-lg bg-white px-6 py-2.5 text-sm font-bold text-blue-700 shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              Sign In
              <ArrowRight size={14} weight="bold" className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer - compact */}
      <footer className="border-t border-slate-100 bg-slate-50 py-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-slate-900 via-sky-700 to-cyan-400">
              <ShieldCheck size={10} weight="bold" className="text-white" />
            </div>
            <span className="text-[11px] font-bold text-slate-400">QA Daily Hub</span>
          </div>
          <p className="text-[11px] font-medium text-slate-400">
            © {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}

// ── Components ─────────────────────────────────────────────────────────────

function StatHighlight({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <p className="text-lg font-black text-slate-900 sm:text-xl">{value}</p>
      <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{label}</p>
    </div>
  );
}

function FeatureCard({
  icon,
  color,
  bg,
  title,
  description,
}: {
  icon: React.ReactNode;
  color: string;
  bg: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200/70 bg-white p-4 transition-all hover:border-slate-300 hover:shadow-sm">
      <div className={`mb-2.5 flex h-9 w-9 items-center justify-center rounded-lg ${bg} ${color}`}>
        {icon}
      </div>
      <h3 className="text-xs font-bold text-slate-900">{title}</h3>
      <p className="mt-1 text-[11px] font-medium leading-relaxed text-slate-500">
        {description}
      </p>
    </div>
  );
}

function WorkflowStep({
  step,
  icon,
  title,
  description,
}: {
  step: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200/70 bg-gradient-to-b from-white to-slate-50/80 p-4 transition hover:border-slate-300 hover:shadow-sm">
      <div className="mb-2.5 flex items-center gap-2.5">
        <span className="text-[10px] font-black text-slate-300">{step}</span>
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-50 text-blue-600">
          {icon}
        </div>
      </div>
      <h3 className="text-xs font-bold text-slate-900">{title}</h3>
      <p className="mt-1 text-[11px] font-medium leading-relaxed text-slate-500">
        {description}
      </p>
    </div>
  );
}

function MiniFeature({
  icon,
  label,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-slate-200/60 bg-white p-3.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-bold text-slate-900">{label}</p>
        <p className="mt-0.5 text-[10px] font-medium leading-relaxed text-slate-500">{description}</p>
      </div>
    </div>
  );
}
