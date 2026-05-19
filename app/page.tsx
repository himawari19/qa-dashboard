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
  Lightning,
  Eye,
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
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-4 w-4 animate-square-spin bg-gray-900" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-white text-gray-900 overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-5">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 bg-blue-600 flex items-center justify-center">
              <Checks size={14} weight="bold" className="text-white" />
            </div>
            <span className="text-sm font-bold text-gray-900">QA Daily Hub</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-[12px] font-medium text-gray-600 hover:text-gray-900">
              Sign In
            </Link>
            <Link href="/login" className="bg-blue-600 px-3.5 py-1.5 text-[12px] font-semibold text-white hover:bg-blue-700">
              Start Free →
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header className="pt-12 bg-gray-950 text-white overflow-hidden relative">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0z' fill='none' stroke='white' stroke-width='0.5'/%3E%3C/svg%3E\")" }} />
        <div className="relative mx-auto max-w-6xl px-5 py-16 sm:py-20">
          <div className="max-w-3xl">
            {/* Social proof badge */}
            <div className="mb-5 inline-flex items-center gap-2 border border-white/10 bg-white/5 px-3 py-1.5">
              <div className="flex -space-x-1.5">
                <div className="h-5 w-5 bg-blue-500 border-2 border-gray-950 flex items-center justify-center text-[8px] font-bold text-white">Q</div>
                <div className="h-5 w-5 bg-emerald-500 border-2 border-gray-950 flex items-center justify-center text-[8px] font-bold text-white">A</div>
                <div className="h-5 w-5 bg-violet-500 border-2 border-gray-950 flex items-center justify-center text-[8px] font-bold text-white">D</div>
              </div>
              <span className="text-[11px] font-medium text-gray-300">Trusted by QA teams shipping daily</span>
            </div>

            <h1 className="text-3xl font-bold leading-[1.2] tracking-tight sm:text-4xl lg:text-5xl">
              Stop losing bugs in spreadsheets.
              <span className="block mt-1 text-blue-400">Start shipping with confidence.</span>
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-relaxed text-gray-400">
              QA Daily Hub gives your team one place to plan tests, execute sessions, track every defect, and see quality health in real-time. No more scattered docs.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link href="/login" className="group inline-flex items-center gap-2 bg-blue-600 px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-blue-500 transition-colors">
                Start Using — Free
                <ArrowRight size={14} weight="bold" className="transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link href="#features" className="inline-flex items-center gap-1.5 border border-white/15 px-5 py-2.5 text-[13px] font-medium text-gray-300 hover:bg-white/5 transition-colors">
                <Eye size={14} weight="bold" />
                See Features
              </Link>
            </div>

            {/* Quick value props */}
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] text-gray-500">
              <span className="flex items-center gap-1.5"><Lightning size={12} weight="bold" className="text-amber-400" /> Setup in 2 minutes</span>
              <span className="flex items-center gap-1.5"><ShieldCheck size={12} weight="bold" className="text-emerald-400" /> Role-based access</span>
              <span className="flex items-center gap-1.5"><Users size={12} weight="bold" className="text-blue-400" /> Multi-workspace</span>
              <span className="flex items-center gap-1.5"><TrendUp size={12} weight="bold" className="text-violet-400" /> Real-time metrics</span>
            </div>
          </div>

          {/* Floating preview card */}
          <div className="hidden lg:block absolute right-5 top-16 w-72 border border-white/10 bg-white/5 backdrop-blur-sm p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-3">Live Dashboard Preview</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-gray-400">Open Bugs</span>
                <span className="text-[12px] font-bold text-rose-400">12</span>
              </div>
              <div className="h-1.5 bg-white/10 overflow-hidden"><div className="h-full w-3/4 bg-rose-500" /></div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-gray-400">Test Pass Rate</span>
                <span className="text-[12px] font-bold text-emerald-400">94%</span>
              </div>
              <div className="h-1.5 bg-white/10 overflow-hidden"><div className="h-full w-[94%] bg-emerald-500" /></div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-gray-400">Sprint Progress</span>
                <span className="text-[12px] font-bold text-blue-400">67%</span>
              </div>
              <div className="h-1.5 bg-white/10 overflow-hidden"><div className="h-full w-2/3 bg-blue-500" /></div>
            </div>
            <div className="mt-3 border-t border-white/10 pt-3 flex items-center gap-2">
              <div className="h-2 w-2 bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-gray-500">Updates in real-time</span>
            </div>
          </div>
        </div>
      </header>

      {/* Problem → Solution */}
      <section className="border-b border-gray-100">
        <div className="mx-auto max-w-6xl px-5 py-14">
          <div className="grid lg:grid-cols-2 gap-10 items-start">
            {/* Problem */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-rose-500 mb-2">The Problem</p>
              <h2 className="text-lg font-bold text-gray-900">Sound familiar?</h2>
              <div className="mt-4 space-y-2.5">
                <PainPoint text="Bugs tracked in random spreadsheets nobody updates" />
                <PainPoint text="Test cases scattered across docs, wikis, and chat" />
                <PainPoint text="No visibility into what was tested this sprint" />
                <PainPoint text="Weekly reports take hours to compile manually" />
                <PainPoint text="New team members have no idea where to start" />
              </div>
            </div>
            {/* Solution */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-600 mb-2">The Solution</p>
              <h2 className="text-lg font-bold text-gray-900">One workspace. Full visibility.</h2>
              <div className="mt-4 space-y-2.5">
                <SolvePoint text="Centralized bug tracker with severity, lifecycle, and evidence" />
                <SolvePoint text="Structured test case library linked to plans and suites" />
                <SolvePoint text="Execution sessions with pass/fail tracking per sprint" />
                <SolvePoint text="Auto-generated reports, health scores, and trend charts" />
                <SolvePoint text="Role-based views — everyone sees exactly what they need" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-gray-50 border-b border-gray-100">
        <div className="mx-auto max-w-6xl px-5 py-14">
          <div className="text-center mb-8">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-600 mb-1">Features</p>
            <h2 className="text-xl font-bold text-gray-900">Everything your QA workflow needs</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <FeatureCard icon={<ClipboardText size={18} weight="bold" />} color="text-blue-600" bg="bg-blue-100" title="Test Plans & Suites" desc="Organize scenarios into plans and suites. Link to sprints. Track coverage." />
            <FeatureCard icon={<Checks size={18} weight="bold" />} color="text-emerald-600" bg="bg-emerald-100" title="Test Case Library" desc="Preconditions, steps, expected results. Reusable across suites and plans." />
            <FeatureCard icon={<PlayCircle size={18} weight="bold" />} color="text-amber-600" bg="bg-amber-100" title="Test Execution" desc="Run sessions, record verdicts live. See pass rates per cycle instantly." />
            <FeatureCard icon={<Bug size={18} weight="bold" />} color="text-rose-600" bg="bg-rose-100" title="Bug Tracking" desc="Severity, priority, assignee, evidence. Full lifecycle from open to closed." />
            <FeatureCard icon={<Kanban size={18} weight="bold" />} color="text-violet-600" bg="bg-violet-100" title="Tasks & Sprints" desc="Kanban board, sprint planning, status workflows. Keep dev and QA in sync." />
            <FeatureCard icon={<ChartBar size={18} weight="bold" />} color="text-indigo-600" bg="bg-indigo-100" title="Dashboard & Reports" desc="Quality health score, burndown, heatmaps, weekly digest. All automated." />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-b border-gray-100">
        <div className="mx-auto max-w-6xl px-5 py-14">
          <div className="text-center mb-8">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400 mb-1">How It Works</p>
            <h2 className="text-xl font-bold text-gray-900">From chaos to clarity in 4 steps</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <StepCard num="1" title="Plan" desc="Create sprints, define test plans, assign scope to your team." icon={<CalendarBlank size={16} weight="bold" />} />
            <StepCard num="2" title="Execute" desc="Run test sessions. Record pass, fail, or blocked per case." icon={<PlayCircle size={16} weight="bold" />} />
            <StepCard num="3" title="Track" desc="Log bugs instantly. Assign, prioritize, and monitor resolution." icon={<Bug size={16} weight="bold" />} />
            <StepCard num="4" title="Report" desc="Auto-generated weekly reports. Quality health at a glance." icon={<TrendUp size={16} weight="bold" />} />
          </div>
        </div>
      </section>

      {/* More features row */}
      <section className="border-b border-gray-100 bg-gray-50">
        <div className="mx-auto max-w-6xl px-5 py-10">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <MiniCard icon={<ShieldCheck size={15} weight="bold" />} label="Role-based Access" desc="8 roles: admin, QA, dev, PM, and more. Each sees their scope." />
            <MiniCard icon={<Users size={15} weight="bold" />} label="Team Workspaces" desc="Isolated per company. Invite members, manage permissions." />
            <MiniCard icon={<Timer size={15} weight="bold" />} label="Activity Audit" desc="Every create, edit, delete logged. Full traceability." />
            <MiniCard icon={<Note size={15} weight="bold" />} label="Meeting Notes" desc="Standups, retros, decisions — all in one place." />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gray-950 text-white">
        <div className="mx-auto max-w-6xl px-5 py-14 text-center">
          <h2 className="text-xl font-bold sm:text-2xl">Stop losing bugs. Start shipping quality.</h2>
          <p className="mt-2 text-sm text-gray-400 max-w-md mx-auto">
            Your team deserves better than spreadsheets. Get started in under 2 minutes.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link href="/login" className="group inline-flex items-center gap-2 bg-blue-600 px-6 py-2.5 text-[13px] font-semibold text-white hover:bg-blue-500 transition-colors">
              Get Started Free
              <ArrowRight size={14} weight="bold" className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
          <p className="mt-4 text-[11px] text-gray-500">No credit card required. Workspace ready instantly.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-5">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 bg-blue-600 flex items-center justify-center">
              <Checks size={10} weight="bold" className="text-white" />
            </div>
            <span className="text-[11px] font-semibold text-gray-500">QA Daily Hub</span>
          </div>
          <span className="text-[10px] text-gray-400">© 2026 Akusara Project</span>
        </div>
      </footer>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────

function PainPoint({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 bg-rose-400" />
      <p className="text-[13px] text-gray-600">{text}</p>
    </div>
  );
}

function SolvePoint({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <Checks size={14} weight="bold" className="mt-0.5 shrink-0 text-emerald-500" />
      <p className="text-[13px] text-gray-600">{text}</p>
    </div>
  );
}

function FeatureCard({ icon, color, bg, title, desc }: { icon: React.ReactNode; color: string; bg: string; title: string; desc: string }) {
  return (
    <div className="border border-gray-200 bg-white p-5 hover:border-gray-300 transition-colors group">
      <div className={`mb-3 flex h-9 w-9 items-center justify-center ${bg} ${color}`}>
        {icon}
      </div>
      <h3 className="text-[13px] font-bold text-gray-900">{title}</h3>
      <p className="mt-1.5 text-[12px] text-gray-500 leading-relaxed">{desc}</p>
    </div>
  );
}

function StepCard({ num, title, desc, icon }: { num: string; title: string; desc: string; icon: React.ReactNode }) {
  return (
    <div className="border border-gray-200 bg-white p-5 relative overflow-hidden">
      <span className="absolute top-3 right-4 text-3xl font-bold text-gray-100">{num}</span>
      <div className="relative">
        <div className="mb-3 text-blue-600">{icon}</div>
        <h3 className="text-[13px] font-bold text-gray-900">{title}</h3>
        <p className="mt-1 text-[12px] text-gray-500 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function MiniCard({ icon, label, desc }: { icon: React.ReactNode; label: string; desc: string }) {
  return (
    <div className="border border-gray-200 bg-white p-4 flex items-start gap-3">
      <span className="shrink-0 text-gray-500 mt-0.5">{icon}</span>
      <div>
        <p className="text-[12px] font-bold text-gray-900">{label}</p>
        <p className="mt-0.5 text-[11px] text-gray-500 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
