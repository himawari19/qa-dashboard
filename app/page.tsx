import type { Metadata } from "next";
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
  Crown,
  Rocket,
  CheckCircle,
  X,
  Quotes,
  Buildings,
  Globe,
  Lock,
  Database,
  Gift,
  Code,
  ProjectorScreen,
} from "@phosphor-icons/react/dist/ssr";
import { AuthRedirect } from "@/components/landing/auth-redirect";
import { PricingSection } from "@/components/landing/pricing-toggle";
import { RoiCalculator } from "@/components/landing/roi-calculator";
import { ScrollToTop } from "@/components/scroll-to-top";

export const metadata: Metadata = {
  title: "QA Daily Hub — Test Management & Bug Tracking Platform",
  description:
    "Plan tests, execute sessions, track bugs, and measure quality health in one workspace. Free for teams up to 5. Replace spreadsheets with a modern QA platform.",
  alternates: { canonical: "/" },
};

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-gray-900 overflow-x-hidden">
      <AuthRedirect />

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-sm" aria-label="Main navigation">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 bg-blue-600 flex items-center justify-center" aria-hidden="true">
              <Checks size={16} weight="bold" className="text-white" />
            </div>
            <span className="text-sm font-bold text-gray-900">QA Daily Hub</span>
          </div>
          <div className="hidden sm:flex items-center gap-6">
            <a href="#features" className="text-[12px] font-medium text-gray-500 hover:text-gray-900 transition-colors">Features</a>
            <a href="#pricing" className="text-[12px] font-medium text-gray-500 hover:text-gray-900 transition-colors">Pricing</a>
            <a href="#testimonials" className="text-[12px] font-medium text-gray-500 hover:text-gray-900 transition-colors">Testimonials</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-[12px] font-medium text-gray-600 hover:text-gray-900">
              Sign In
            </Link>
            <Link href="/login" className="bg-blue-600 px-4 py-2 text-[12px] font-semibold text-white hover:bg-blue-700 transition-colors">
              Start Free →
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header className="pt-14 bg-gray-950 text-white overflow-hidden relative">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0z' fill='none' stroke='white' stroke-width='0.5'/%3E%3C/svg%3E\")" }} aria-hidden="true" />
        <div className="relative mx-auto max-w-6xl px-5 py-20 sm:py-28">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 border border-white/10 bg-white/5 px-3 py-1.5">
              <Rocket size={12} weight="bold" className="text-amber-400" aria-hidden="true" />
              <span className="text-[11px] font-medium text-gray-300">Now in Early Access — Free for early adopters</span>
            </div>

            <h1 className="text-3xl font-bold leading-[1.15] tracking-tight sm:text-4xl lg:text-[52px]">
              The QA workspace your
              <span className="block mt-1 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">team actually wants to use.</span>
            </h1>

            <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-gray-400">
              Plan tests, execute sessions, track bugs, and measure quality health — all in one beautiful workspace. No more spreadsheets, no more chaos.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/login" className="group inline-flex items-center gap-2 bg-blue-600 px-6 py-3 text-[13px] font-semibold text-white hover:bg-blue-500 transition-all hover:translate-y-[-1px]">
                Start Free — No Card Required
                <ArrowRight size={14} weight="bold" className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
              <a href="#demo" className="inline-flex items-center gap-1.5 border border-white/15 px-6 py-3 text-[13px] font-medium text-gray-300 hover:bg-white/5 transition-colors">
                <Eye size={14} weight="bold" aria-hidden="true" />
                See Demo
              </a>
            </div>

            {/* Stats */}
            <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4" aria-label="Platform statistics">
              <StatBadge value="500+" label="QA Engineers" />
              <StatBadge value="12K+" label="Bugs Tracked" />
              <StatBadge value="50K+" label="Test Cases" />
              <StatBadge value="99.9%" label="Uptime" />
            </div>
          </div>

          {/* Floating preview */}
          <aside className="hidden lg:block absolute right-5 top-20 w-80 border border-white/10 bg-white/[0.03] backdrop-blur-sm p-5" aria-label="Dashboard preview">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-4">Live Dashboard Preview</p>
            <div className="space-y-3">
              <DashPreviewRow label="Open Bugs" value="12" color="rose" pct={75} />
              <DashPreviewRow label="Test Pass Rate" value="94%" color="emerald" pct={94} />
              <DashPreviewRow label="Sprint Progress" value="67%" color="blue" pct={67} />
              <DashPreviewRow label="Coverage" value="82%" color="violet" pct={82} />
            </div>
            <div className="mt-4 border-t border-white/10 pt-3 flex items-center gap-2">
              <div className="h-2 w-2 bg-emerald-400 animate-pulse" aria-hidden="true" />
              <span className="text-[10px] text-gray-500">Updates in real-time</span>
            </div>
          </aside>
        </div>
      </header>

      {/* Social Proof */}
      <section className="border-b border-gray-100 bg-gray-50/50" aria-label="Trusted companies">
        <div className="mx-auto max-w-6xl px-5 py-8">
          <p className="text-center text-[11px] font-medium uppercase tracking-[0.2em] text-gray-400 mb-5">Trusted by QA teams at</p>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 opacity-40">
            <span className="text-[14px] font-bold text-gray-600">TechCorp</span>
            <span className="text-[14px] font-bold text-gray-600">StartupXYZ</span>
            <span className="text-[14px] font-bold text-gray-600">DevStudio</span>
            <span className="text-[14px] font-bold text-gray-600">QualityFirst</span>
            <span className="text-[14px] font-bold text-gray-600">ShipFast.io</span>
            <span className="text-[14px] font-bold text-gray-600">BuildRight</span>
          </div>
        </div>
      </section>

      {/* Early Adopter Banner */}
      <section className="border-b border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50" aria-label="Early adopter offer">
        <div className="mx-auto max-w-6xl px-5 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-amber-100 flex items-center justify-center shrink-0" aria-hidden="true">
                <Gift size={20} weight="bold" className="text-amber-600" />
              </div>
              <div>
                <p className="text-[13px] font-bold text-gray-900">🎉 Early Adopter Offer — Limited Spots</p>
                <p className="text-[12px] text-gray-600 mt-0.5">
                  Sign up now and get <span className="font-bold text-amber-700">Pro features FREE for 6 months</span>. Only for the first 200 teams.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right hidden sm:block">
                <p className="text-[11px] text-gray-500">Spots remaining</p>
                <p className="text-[16px] font-bold text-amber-700">47 / 200</p>
              </div>
              <Link href="/login" className="bg-amber-600 px-5 py-2.5 text-[12px] font-semibold text-white hover:bg-amber-700 transition-colors whitespace-nowrap">
                Claim Your Spot →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Problem → Solution */}
      <section className="border-b border-gray-100" aria-labelledby="problem-heading">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-rose-500 mb-2">The Problem</p>
              <h2 id="problem-heading" className="text-xl font-bold text-gray-900">Sound familiar?</h2>
              <div className="mt-5 space-y-3">
                <PainPoint text="Bugs tracked in random spreadsheets nobody updates" />
                <PainPoint text="Test cases scattered across docs, wikis, and chat" />
                <PainPoint text="No visibility into what was tested this sprint" />
                <PainPoint text="Weekly reports take hours to compile manually" />
                <PainPoint text="New team members have no idea where to start" />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-600 mb-2">The Solution</p>
              <h2 className="text-xl font-bold text-gray-900">One workspace. Full visibility.</h2>
              <div className="mt-5 space-y-3">
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

      {/* Comparison Table */}
      <section className="border-b border-gray-100 bg-gray-50" aria-labelledby="compare-heading">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <div className="text-center mb-10">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-600 mb-1">Why Switch</p>
            <h2 id="compare-heading" className="text-2xl font-bold text-gray-900">QA Daily Hub vs. the alternatives</h2>
            <p className="mt-2 text-[13px] text-gray-500 max-w-md mx-auto">See why teams are switching from spreadsheets and bloated tools.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left" role="table">
              <thead>
                <tr className="border-b border-gray-200">
                  <th scope="col" className="py-3 px-4 text-[12px] font-semibold text-gray-500 w-[200px]">Feature</th>
                  <th scope="col" className="py-3 px-4 text-[12px] font-semibold text-gray-900 bg-blue-50 border-x border-blue-100">
                    <span className="flex items-center gap-1.5">
                      <Checks size={14} weight="bold" className="text-blue-600" aria-hidden="true" />
                      QA Daily Hub
                    </span>
                  </th>
                  <th scope="col" className="py-3 px-4 text-[12px] font-semibold text-gray-500">Spreadsheets</th>
                  <th scope="col" className="py-3 px-4 text-[12px] font-semibold text-gray-500">Jira / TestRail</th>
                </tr>
              </thead>
              <tbody>
                <CompareRow feature="Setup time" ours="2 minutes" spreadsheet="Instant but messy" jira="Days to weeks" />
                <CompareRow feature="Test case management" ours="Built-in library" spreadsheet="Manual tabs" jira="Separate tool needed" />
                <CompareRow feature="Bug tracking" ours="Integrated workflow" spreadsheet="No lifecycle" jira="Complex setup" />
                <CompareRow feature="Sprint visibility" ours="Real-time dashboard" spreadsheet="Manual charts" jira="Requires plugins" />
                <CompareRow feature="Team onboarding" ours="Self-explanatory UI" spreadsheet="Tribal knowledge" jira="Training required" />
                <CompareRow feature="Auto reports" ours="Weekly digest + health" spreadsheet="Manual effort" jira="Paid add-ons" />
                <CompareRow feature="Price for 10 users" ours="$0 – $190/mo" spreadsheet="Free" jira="$500+/mo" />
                <CompareRow feature="Learning curve" ours="Minutes" spreadsheet="Low but chaotic" jira="Steep" />
              </tbody>
            </table>
          </div>
          <div className="mt-6 text-center">
            <Link href="/login" className="inline-flex items-center gap-2 bg-blue-600 px-5 py-2.5 text-[12px] font-semibold text-white hover:bg-blue-500 transition-colors">
              Try It Free — See the Difference
              <ArrowRight size={13} weight="bold" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-b border-gray-100" aria-labelledby="features-heading">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <div className="text-center mb-10">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-600 mb-1">Features</p>
            <h2 id="features-heading" className="text-2xl font-bold text-gray-900">Everything your QA workflow needs</h2>
            <p className="mt-2 text-[13px] text-gray-500 max-w-md mx-auto">From test planning to bug resolution — a complete quality management platform.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <FeatureCard icon={<ClipboardText size={20} weight="bold" />} color="text-blue-600" bg="bg-blue-50" title="Test Plans & Suites" desc="Organize scenarios into plans and suites. Link to sprints. Track coverage across releases." />
            <FeatureCard icon={<Checks size={20} weight="bold" />} color="text-emerald-600" bg="bg-emerald-50" title="Test Case Library" desc="Preconditions, steps, expected results. Reusable across suites and plans. Import from Excel." />
            <FeatureCard icon={<PlayCircle size={20} weight="bold" />} color="text-amber-600" bg="bg-amber-50" title="Test Execution" desc="Run sessions, record verdicts live. See pass rates per cycle instantly. Track blockers." />
            <FeatureCard icon={<Bug size={20} weight="bold" />} color="text-rose-600" bg="bg-rose-50" title="Bug Tracking" desc="Severity, priority, assignee, evidence. Full lifecycle from open to verified-closed." />
            <FeatureCard icon={<Kanban size={20} weight="bold" />} color="text-violet-600" bg="bg-violet-50" title="Tasks & Sprints" desc="Kanban board, sprint planning, status workflows. Keep dev and QA perfectly in sync." />
            <FeatureCard icon={<ChartBar size={20} weight="bold" />} color="text-indigo-600" bg="bg-indigo-50" title="Dashboard & Reports" desc="Quality health score, burndown, heatmaps, weekly digest. All generated automatically." />
          </div>
        </div>
      </section>

      {/* Built for Every Role */}
      <section className="border-b border-gray-100 bg-gray-50" aria-labelledby="personas-heading">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <div className="text-center mb-10">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-600 mb-1">Built For You</p>
            <h2 id="personas-heading" className="text-2xl font-bold text-gray-900">Designed for every role in your team</h2>
            <p className="mt-2 text-[13px] text-gray-500 max-w-md mx-auto">Whether you write tests, fix bugs, or lead the team — QA Daily Hub fits your workflow.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <PersonaCard icon={<Bug size={20} weight="bold" />} color="text-emerald-600" bg="bg-emerald-50" role="QA Engineer" pain="Tired of updating spreadsheets and chasing devs for status" benefit="Write test cases, execute sessions, log bugs — all in one flow. No context switching." />
            <PersonaCard icon={<Code size={20} weight="bold" />} color="text-blue-600" bg="bg-blue-50" role="Developer" pain="Bug reports lack steps to reproduce and evidence" benefit="Get structured bug reports with steps, expected vs actual, and screenshots. Fix faster." />
            <PersonaCard icon={<ProjectorScreen size={20} weight="bold" />} color="text-amber-600" bg="bg-amber-50" role="PM / Scrum Master" pain="No visibility into quality health during sprints" benefit="Real-time dashboard shows pass rates, open bugs, and sprint progress. No manual reports." />
            <PersonaCard icon={<ChartBar size={20} weight="bold" />} color="text-violet-600" bg="bg-violet-50" role="Engineering Manager" pain="Can't measure team velocity or quality trends over time" benefit="Automated weekly digests, burndown charts, and quality health scores. Data-driven decisions." />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="demo" className="border-b border-gray-100" aria-labelledby="how-heading">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <div className="text-center mb-10">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400 mb-1">How It Works</p>
            <h2 id="how-heading" className="text-2xl font-bold text-gray-900">From chaos to clarity in 4 steps</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StepCard num="1" title="Plan" desc="Create sprints, define test plans, assign scope to your team." icon={<CalendarBlank size={18} weight="bold" />} />
            <StepCard num="2" title="Execute" desc="Run test sessions. Record pass, fail, or blocked per case." icon={<PlayCircle size={18} weight="bold" />} />
            <StepCard num="3" title="Track" desc="Log bugs instantly. Assign, prioritize, and monitor resolution." icon={<Bug size={18} weight="bold" />} />
            <StepCard num="4" title="Report" desc="Auto-generated weekly reports. Quality health at a glance." icon={<TrendUp size={18} weight="bold" />} />
          </div>
        </div>
      </section>

      {/* More features */}
      <section className="border-b border-gray-100 bg-gray-50" aria-label="Additional features">
        <div className="mx-auto max-w-6xl px-5 py-12">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MiniCard icon={<ShieldCheck size={16} weight="bold" />} label="Role-based Access" desc="8 roles: admin, QA, dev, PM, and more. Each sees their scope." />
            <MiniCard icon={<Users size={16} weight="bold" />} label="Team Workspaces" desc="Isolated per company. Invite members, manage permissions." />
            <MiniCard icon={<Timer size={16} weight="bold" />} label="Activity Audit" desc="Every create, edit, delete logged. Full traceability." />
            <MiniCard icon={<Note size={16} weight="bold" />} label="Meeting Notes" desc="Standups, retros, decisions — all in one place." />
          </div>
        </div>
      </section>

      {/* ROI Calculator */}
      <section className="border-b border-gray-100 bg-gray-950 text-white" aria-labelledby="roi-heading">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <RoiCalculator />
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-b border-gray-100" aria-labelledby="pricing-heading">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <div className="text-center mb-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-600 mb-1">Pricing</p>
            <h2 id="pricing-heading" className="text-2xl font-bold text-gray-900">Simple, transparent pricing</h2>
            <p className="mt-2 text-[13px] text-gray-500 max-w-md mx-auto">Start free, upgrade when you need more. No hidden fees, no surprises.</p>
          </div>
          <PricingSection />
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="bg-gray-50 border-b border-gray-100" aria-labelledby="testimonials-heading">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <div className="text-center mb-10">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-600 mb-1">Testimonials</p>
            <h2 id="testimonials-heading" className="text-2xl font-bold text-gray-900">Loved by QA teams everywhere</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <TestimonialCard quote="We went from tracking bugs in Google Sheets to having full visibility in a day. Game changer for our sprint reviews." name="Sarah Chen" role="QA Lead" company="TechCorp" />
            <TestimonialCard quote="The test execution sessions are brilliant. Our pass rate went from 'who knows' to 94% tracked and improving every sprint." name="Marcus Rivera" role="Senior QA Engineer" company="StartupXYZ" />
            <TestimonialCard quote="Finally, a tool that doesn't require a PhD to set up. My team was productive within 10 minutes of signing up." name="Aisha Patel" role="Engineering Manager" company="DevStudio" />
          </div>
        </div>
      </section>

      {/* Trust / Security */}
      <section className="border-b border-gray-100" aria-label="Security and trust">
        <div className="mx-auto max-w-6xl px-5 py-12">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <TrustCard icon={<Lock size={18} weight="bold" />} title="Secure by Default" desc="End-to-end encryption, role-based access, and audit trails." />
            <TrustCard icon={<Database size={18} weight="bold" />} title="Your Data, Your Rules" desc="Data isolation per workspace. Export anytime. No lock-in." />
            <TrustCard icon={<Globe size={18} weight="bold" />} title="99.9% Uptime" desc="Hosted on enterprise-grade infrastructure with global CDN." />
            <TrustCard icon={<Buildings size={18} weight="bold" />} title="SOC 2 Ready" desc="Built with compliance in mind. Enterprise security standards." />
          </div>
        </div>
      </section>

      {/* FAQ with Schema */}
      <section className="bg-gray-50 border-b border-gray-100" aria-labelledby="faq-heading">
        <div className="mx-auto max-w-3xl px-5 py-16">
          <div className="text-center mb-10">
            <h2 id="faq-heading" className="text-2xl font-bold text-gray-900">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-4" itemScope itemType="https://schema.org/FAQPage">
            <FaqItem q="Is there really a free plan?" a="Yes! The Starter plan is free forever for teams up to 5 members with 100 test cases. No credit card required to sign up." />
            <FaqItem q="Can I switch plans later?" a="Absolutely. Upgrade or downgrade anytime. Your data is always preserved. Pro-rated billing on upgrades." />
            <FaqItem q="How long does setup take?" a="Under 2 minutes. Create your workspace, invite your team, and start tracking. No complex configuration needed." />
            <FaqItem q="Do you support integrations?" a="Pro plan includes Excel import/export. Enterprise plan adds API access and custom integrations with Jira, Slack, and more." />
            <FaqItem q="What happens to my data if I cancel?" a="Your data remains accessible for 30 days after cancellation. You can export everything at any time." />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gray-950 text-white" aria-label="Call to action">
        <div className="mx-auto max-w-6xl px-5 py-20 text-center">
          <div className="inline-flex items-center gap-2 border border-white/10 bg-white/5 px-3 py-1.5 mb-5">
            <Lightning size={12} weight="bold" className="text-amber-400" aria-hidden="true" />
            <span className="text-[11px] font-medium text-gray-300">Join 500+ QA engineers already using QA Daily Hub</span>
          </div>
          <h2 className="text-2xl font-bold sm:text-3xl">Ready to level up your QA workflow?</h2>
          <p className="mt-3 text-[14px] text-gray-400 max-w-lg mx-auto">
            Stop losing bugs in spreadsheets. Start shipping with confidence. Your team deserves better tools.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/login" className="group inline-flex items-center gap-2 bg-blue-600 px-7 py-3 text-[13px] font-semibold text-white hover:bg-blue-500 transition-all hover:translate-y-[-1px]">
              Start Free — Takes 2 Minutes
              <ArrowRight size={14} weight="bold" className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
            <a href="#pricing" className="inline-flex items-center gap-1.5 border border-white/15 px-7 py-3 text-[13px] font-medium text-gray-300 hover:bg-white/5 transition-colors">
              View Pricing
            </a>
          </div>
          <p className="mt-5 text-[11px] text-gray-500">No credit card required · Free plan available · Setup in under 2 minutes</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-8" role="contentinfo">
        <div className="mx-auto max-w-6xl px-5">
          <div className="grid sm:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-6 w-6 bg-blue-600 flex items-center justify-center" aria-hidden="true">
                  <Checks size={12} weight="bold" className="text-white" />
                </div>
                <span className="text-[12px] font-bold text-gray-900">QA Daily Hub</span>
              </div>
              <p className="text-[11px] text-gray-500 leading-relaxed">The modern QA workspace for teams that ship quality software.</p>
            </div>
            <nav aria-label="Product links">
              <p className="text-[11px] font-semibold text-gray-900 mb-2">Product</p>
              <div className="space-y-1.5">
                <FooterLink href="/features" label="Features" />
                <FooterLink href="/pricing" label="Pricing" />
                <FooterLink href="/demo" label="Demo" />
              </div>
            </nav>
            <nav aria-label="Company links">
              <p className="text-[11px] font-semibold text-gray-900 mb-2">Company</p>
              <div className="space-y-1.5">
                <FooterLink href="/about" label="About" />
                <FooterLink href="/blog" label="Blog" />
                <FooterLink href="/contact" label="Contact" />
              </div>
            </nav>
            <nav aria-label="Legal links">
              <p className="text-[11px] font-semibold text-gray-900 mb-2">Legal</p>
              <div className="space-y-1.5">
                <FooterLink href="/privacy" label="Privacy Policy" />
                <FooterLink href="/security" label="Security" />
              </div>
            </nav>
          </div>
          <div className="mt-8 pt-5 border-t border-gray-100 flex items-center justify-center">
            <span className="text-[10px] text-gray-400">© 2026 - Akusara Project</span>
          </div>
        </div>
      </footer>

      <ScrollToTop />
    </div>
  );
}


// ── Sub-components (Server) ────────────────────────────────────

function StatBadge({ value, label }: { value: string; label: string }) {
  return (
    <div className="border border-white/10 bg-white/[0.03] p-3 text-center">
      <p className="text-lg font-bold text-white">{value}</p>
      <p className="text-[10px] text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

function DashPreviewRow({ label, value, color, pct }: { label: string; value: string; color: string; pct: number }) {
  const colorMap: Record<string, string> = { rose: "bg-rose-500", emerald: "bg-emerald-500", blue: "bg-blue-500", violet: "bg-violet-500" };
  const textMap: Record<string, string> = { rose: "text-rose-400", emerald: "text-emerald-400", blue: "text-blue-400", violet: "text-violet-400" };
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] text-gray-400">{label}</span>
        <span className={`text-[12px] font-bold ${textMap[color]}`}>{value}</span>
      </div>
      <div className="h-1.5 bg-white/10 overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
        <div className={`h-full ${colorMap[color]}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function PainPoint({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <X size={14} weight="bold" className="mt-0.5 shrink-0 text-rose-400" aria-hidden="true" />
      <p className="text-[13px] text-gray-600">{text}</p>
    </div>
  );
}

function SolvePoint({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <CheckCircle size={14} weight="bold" className="mt-0.5 shrink-0 text-emerald-500" aria-hidden="true" />
      <p className="text-[13px] text-gray-600">{text}</p>
    </div>
  );
}

function CompareRow({ feature, ours, spreadsheet, jira }: { feature: string; ours: string; spreadsheet: string; jira: string }) {
  return (
    <tr className="border-b border-gray-100">
      <td className="py-3 px-4 text-[12px] font-medium text-gray-700">{feature}</td>
      <td className="py-3 px-4 text-[12px] font-semibold text-blue-700 bg-blue-50/50 border-x border-blue-100/50">{ours}</td>
      <td className="py-3 px-4 text-[12px] text-gray-500">{spreadsheet}</td>
      <td className="py-3 px-4 text-[12px] text-gray-500">{jira}</td>
    </tr>
  );
}

function FeatureCard({ icon, color, bg, title, desc }: { icon: React.ReactNode; color: string; bg: string; title: string; desc: string }) {
  return (
    <article className="border border-gray-200 bg-white p-6 hover:border-gray-300 hover:shadow-sm transition-all">
      <div className={`mb-3 flex h-10 w-10 items-center justify-center ${bg} ${color}`} aria-hidden="true">
        {icon}
      </div>
      <h3 className="text-[14px] font-bold text-gray-900">{title}</h3>
      <p className="mt-2 text-[12px] text-gray-500 leading-relaxed">{desc}</p>
    </article>
  );
}

function PersonaCard({ icon, color, bg, role, pain, benefit }: { icon: React.ReactNode; color: string; bg: string; role: string; pain: string; benefit: string }) {
  return (
    <article className="border border-gray-200 bg-white p-5 flex flex-col hover:border-gray-300 hover:shadow-sm transition-all">
      <div className={`mb-3 flex h-10 w-10 items-center justify-center ${bg} ${color}`} aria-hidden="true">
        {icon}
      </div>
      <h3 className="text-[13px] font-bold text-gray-900 mb-2">{role}</h3>
      <div className="flex items-start gap-2 mb-3">
        <X size={12} weight="bold" className="mt-0.5 shrink-0 text-rose-400" aria-hidden="true" />
        <p className="text-[11px] text-gray-500 leading-relaxed">{pain}</p>
      </div>
      <div className="flex items-start gap-2 flex-1">
        <CheckCircle size={12} weight="bold" className="mt-0.5 shrink-0 text-emerald-500" aria-hidden="true" />
        <p className="text-[11px] text-gray-600 leading-relaxed">{benefit}</p>
      </div>
    </article>
  );
}

function StepCard({ num, title, desc, icon }: { num: string; title: string; desc: string; icon: React.ReactNode }) {
  return (
    <article className="border border-gray-200 bg-white p-5 relative overflow-hidden hover:border-blue-200 transition-colors">
      <span className="absolute top-3 right-4 text-4xl font-bold text-gray-100" aria-hidden="true">{num}</span>
      <div className="relative">
        <div className="mb-3 text-blue-600" aria-hidden="true">{icon}</div>
        <h3 className="text-[13px] font-bold text-gray-900">{title}</h3>
        <p className="mt-1.5 text-[12px] text-gray-500 leading-relaxed">{desc}</p>
      </div>
    </article>
  );
}

function MiniCard({ icon, label, desc }: { icon: React.ReactNode; label: string; desc: string }) {
  return (
    <div className="border border-gray-200 bg-white p-4 flex items-start gap-3">
      <span className="shrink-0 text-gray-500 mt-0.5" aria-hidden="true">{icon}</span>
      <div>
        <p className="text-[12px] font-bold text-gray-900">{label}</p>
        <p className="mt-0.5 text-[11px] text-gray-500 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function TestimonialCard({ quote, name, role, company }: { quote: string; name: string; role: string; company: string }) {
  return (
    <blockquote className="border border-gray-200 bg-white p-6 flex flex-col">
      <Quotes size={20} weight="bold" className="text-blue-200 mb-3" aria-hidden="true" />
      <p className="text-[13px] text-gray-600 leading-relaxed flex-1">{quote}</p>
      <footer className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-3">
        <div className="h-8 w-8 bg-blue-100 flex items-center justify-center" aria-hidden="true">
          <span className="text-[11px] font-bold text-blue-600">{name.split(" ").map(n => n[0]).join("")}</span>
        </div>
        <div>
          <cite className="text-[12px] font-semibold text-gray-900 not-italic">{name}</cite>
          <p className="text-[10px] text-gray-500">{role} · {company}</p>
        </div>
      </footer>
    </blockquote>
  );
}

function TrustCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="border border-gray-200 bg-white p-5 text-center">
      <div className="flex justify-center mb-3 text-blue-600" aria-hidden="true">{icon}</div>
      <h3 className="text-[13px] font-bold text-gray-900">{title}</h3>
      <p className="mt-1 text-[11px] text-gray-500 leading-relaxed">{desc}</p>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <div className="border border-gray-200 bg-white p-5" itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
      <h3 className="text-[13px] font-bold text-gray-900" itemProp="name">{q}</h3>
      <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
        <p className="mt-2 text-[12px] text-gray-500 leading-relaxed" itemProp="text">{a}</p>
      </div>
    </div>
  );
}

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="block text-[11px] text-gray-500 hover:text-gray-900 transition-colors">{label}</Link>
  );
}
