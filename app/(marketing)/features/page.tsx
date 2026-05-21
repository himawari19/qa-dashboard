import type { Metadata } from "next";
import Link from "next/link";
import {
  ClipboardText,
  Checks,
  PlayCircle,
  Bug,
  Kanban,
  ChartBar,
  ShieldCheck,
  Users,
  Timer,
  Note,
  ArrowRight,
  Lightning,
  Globe,
  Database,
  Lock,
  FileXls,
  Bell,
  MagnifyingGlass,
  Gear,
  CalendarBlank,
} from "@phosphor-icons/react/dist/ssr";

export const metadata: Metadata = {
  title: "Features — Complete QA Management Platform",
  description:
    "Test plans, test cases, execution sessions, bug tracking, sprint management, dashboards, and automated reports. All in one integrated workspace.",
  alternates: { canonical: "/features" },
};

export default function FeaturesPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gray-950 text-white">
        <div className="mx-auto max-w-6xl px-5 py-24 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-400 mb-3">Platform Features</p>
          <h1 className="text-3xl font-bold sm:text-4xl lg:text-5xl">
            A complete quality management platform
          </h1>
          <p className="mt-5 text-[15px] text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Six integrated modules covering the full QA lifecycle — from test planning through execution, bug tracking, and automated reporting. No plugins, no add-ons, no fragmentation.
          </p>
        </div>
      </section>

      {/* Core Modules - Detailed */}
      <section className="border-b border-gray-100">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <div className="text-center mb-14">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-600 mb-2">Core Modules</p>
            <h2 className="text-2xl font-bold text-gray-900">Six modules. One unified workflow.</h2>
          </div>

          <div className="space-y-16">
            <FeatureRow
              icon={<ClipboardText size={24} weight="bold" />}
              color="text-blue-600" bg="bg-blue-50"
              title="Test Plans & Suites"
              desc="Organize your testing strategy with structured test plans linked to sprints and releases. Group test cases into logical suites, track coverage across features, and ensure nothing falls through the cracks."
              bullets={["Link plans to sprints and releases", "Hierarchical suite organization", "Coverage tracking per feature/module", "Clone plans for regression cycles"]}
            />
            <FeatureRow
              icon={<Checks size={24} weight="bold" />}
              color="text-emerald-600" bg="bg-emerald-50"
              title="Test Case Library"
              desc="Build a reusable library of test cases with structured preconditions, step-by-step instructions, and expected results. Import from Excel, maintain version history, and share across plans."
              bullets={["Preconditions, steps, expected results", "Excel import/export", "Reusable across multiple plans", "Categorize by module and type"]}
              reverse
            />
            <FeatureRow
              icon={<PlayCircle size={24} weight="bold" />}
              color="text-amber-600" bg="bg-amber-50"
              title="Test Execution Sessions"
              desc="Execute test cases in structured sessions. Record pass/fail/blocked verdicts in real-time, attach evidence, and see pass rates update instantly as your team works through the suite."
              bullets={["Real-time pass rate tracking", "Attach screenshots and evidence", "Block tracking with reasons", "Session history and comparison"]}
            />
            <FeatureRow
              icon={<Bug size={24} weight="bold" />}
              color="text-rose-600" bg="bg-rose-50"
              title="Bug Tracking"
              desc="Log bugs with full context — severity, priority, steps to reproduce, expected vs actual results, and evidence. Track the complete lifecycle from discovery through verification and closure."
              bullets={["Severity and priority classification", "Full lifecycle management", "Link bugs to test cases", "Evidence attachments and screenshots"]}
              reverse
            />
            <FeatureRow
              icon={<Kanban size={24} weight="bold" />}
              color="text-violet-600" bg="bg-violet-50"
              title="Tasks & Sprint Management"
              desc="Plan sprints, manage tasks with Kanban boards, and keep development and QA perfectly synchronized. Status workflows ensure everyone knows what's in progress, blocked, or done."
              bullets={["Kanban board view", "Sprint planning and tracking", "Custom status workflows", "Dev and QA task alignment"]}
            />
            <FeatureRow
              icon={<ChartBar size={24} weight="bold" />}
              color="text-indigo-600" bg="bg-indigo-50"
              title="Dashboard & Automated Reports"
              desc="Get instant visibility into quality health with auto-generated dashboards. Quality scores, burndown charts, trend analysis, and weekly digests — all computed automatically from your data."
              bullets={["Quality health score", "Burndown and trend charts", "Automated weekly digest", "Custom date range analysis"]}
              reverse
            />
          </div>
        </div>
      </section>

      {/* Platform Capabilities */}
      <section className="border-b border-gray-100 bg-gray-50">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <div className="text-center mb-12">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-600 mb-2">Platform Capabilities</p>
            <h2 className="text-2xl font-bold text-gray-900">Built-in features that enterprise teams expect</h2>
            <p className="mt-2 text-[13px] text-gray-500 max-w-lg mx-auto">No plugins or third-party integrations required. Everything works out of the box.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MiniFeature icon={<ShieldCheck size={18} weight="bold" />} title="Role-Based Access Control" desc="8 granular roles with scoped permissions. Each team member sees exactly what they need." />
            <MiniFeature icon={<Users size={18} weight="bold" />} title="Multi-Tenant Workspaces" desc="Complete data isolation per company. Invite members, manage permissions centrally." />
            <MiniFeature icon={<Timer size={18} weight="bold" />} title="Full Audit Trail" desc="Every action logged with timestamp, user, and details. Complete traceability for compliance." />
            <MiniFeature icon={<Note size={18} weight="bold" />} title="Meeting Notes" desc="Document standups, retros, and decisions alongside your QA data. Context stays together." />
            <MiniFeature icon={<Lock size={18} weight="bold" />} title="Encrypted Sessions" desc="TLS in transit, encrypted cookies, secure password hashing. Security is not optional." />
            <MiniFeature icon={<Database size={18} weight="bold" />} title="Data Export" desc="Export all your data anytime in standard formats. No vendor lock-in, ever." />
            <MiniFeature icon={<FileXls size={18} weight="bold" />} title="Excel Import/Export" desc="Migrate from spreadsheets seamlessly. Export reports for stakeholders who prefer Excel." />
            <MiniFeature icon={<Bell size={18} weight="bold" />} title="Notifications" desc="Stay informed about assignments, status changes, and team activity without checking manually." />
            <MiniFeature icon={<MagnifyingGlass size={18} weight="bold" />} title="Global Search" desc="Find any test case, bug, or task instantly. Search across all modules from one place." />
            <MiniFeature icon={<Globe size={18} weight="bold" />} title="99.9% Uptime" desc="Enterprise-grade infrastructure with automated backups and monitoring." />
            <MiniFeature icon={<CalendarBlank size={18} weight="bold" />} title="Activity Timeline" desc="See what happened across your workspace. Filter by module, user, or date range." />
            <MiniFeature icon={<Gear size={18} weight="bold" />} title="Customizable Workflows" desc="Configure statuses, priorities, and fields to match your team's existing process." />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gray-950 text-white">
        <div className="mx-auto max-w-6xl px-5 py-20 text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">See it in action</h2>
          <p className="mt-3 text-[14px] text-gray-400 max-w-lg mx-auto">
            Create a free workspace and explore every feature. No credit card, no time limit on the free plan.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/login" className="group inline-flex items-center gap-2 bg-blue-600 px-7 py-3 text-[13px] font-semibold text-white hover:bg-blue-500 transition-all hover:translate-y-[-1px]">
              Start Free — Takes 2 Minutes
              <ArrowRight size={14} weight="bold" className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
            <Link href="/pricing" className="inline-flex items-center gap-1.5 border border-white/15 px-7 py-3 text-[13px] font-medium text-gray-300 hover:bg-white/5 transition-colors">
              View Pricing
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function FeatureRow({ icon, color, bg, title, desc, bullets, reverse }: {
  icon: React.ReactNode; color: string; bg: string; title: string; desc: string; bullets: string[]; reverse?: boolean;
}) {
  return (
    <div className={`grid lg:grid-cols-2 gap-10 items-center ${reverse ? "lg:direction-rtl" : ""}`}>
      <div className={reverse ? "lg:order-2" : ""}>
        <div className={`mb-4 flex h-12 w-12 items-center justify-center ${bg} ${color}`} aria-hidden="true">
          {icon}
        </div>
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        <p className="mt-3 text-[13px] text-gray-600 leading-relaxed">{desc}</p>
        <ul className="mt-4 space-y-2">
          {bullets.map((b) => (
            <li key={b} className="flex items-center gap-2 text-[12px] text-gray-600">
              <Checks size={13} weight="bold" className="shrink-0 text-emerald-500" aria-hidden="true" />
              {b}
            </li>
          ))}
        </ul>
      </div>
      <div className={`border border-gray-200 bg-gray-50 p-8 flex items-center justify-center min-h-[200px] ${reverse ? "lg:order-1" : ""}`}>
        <div className={`${color} opacity-10`} aria-hidden="true">
          <div className="scale-[4]">{icon}</div>
        </div>
      </div>
    </div>
  );
}

function MiniFeature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="border border-gray-200 bg-white p-5 hover:border-gray-300 hover:shadow-sm transition-all">
      <span className="text-blue-600 mb-3 block" aria-hidden="true">{icon}</span>
      <p className="text-[12px] font-bold text-gray-900">{title}</p>
      <p className="mt-1 text-[11px] text-gray-500 leading-relaxed">{desc}</p>
    </div>
  );
}
