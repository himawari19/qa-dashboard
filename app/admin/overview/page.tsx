"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Buildings,
  Users,
  Bug,
  Kanban,
  Checks,
  ShieldCheck,
  SignOut,
  CaretDown,
  CaretUp,
  Crown,
  UserCircle,
  Circle,
  Lightning,
  ChartLineUp,
  CurrencyCircleDollar,
  Megaphone,
  ClockCounterClockwise,
  Export,
  Plus,
  Trash,
  Eye,
  EyeSlash,
  Warning,
  Headset,
} from "@phosphor-icons/react";
import { getRoleLabel } from "@/lib/roles";
import { ModernDatePicker } from "@/components/date-picker";
import { ScrollToTop } from "@/components/scroll-to-top";

// ─── Types ───────────────────────────────────────────────────────────────────
type CompanyDetail = {
  id: number; name: string; plan: string; planExpiry: string | null;
  maxUsers: number; status: string; createdAt: string;
  totalUsers: number; totalBugs: number; totalTasks: number;
  totalTestCases: number; totalSprints: number;
  lastActivityAt: string | null; mau: number; health: "green" | "yellow" | "red";
};
type RoleDistribution = { role: string; count: number };
type GrowthData = { month: string; count: number };
type OverviewData = {
  systemTotals: { totalCompanies: number; totalUsers: number; totalBugs: number; totalTasks: number; totalTestCases: number };
  companies: CompanyDetail[]; roleDistribution: RoleDistribution[]; growthData: GrowthData[];
  alerts: { company: string; companyId: number; type: "expired" | "expiring"; daysLeft: number; plan: string }[];
};
type RevenueData = {
  mrr: number; arr: number; churnRevenue: number; conversionRate: number; expiringCount: number;
  revenueByPlan: { plan: string; count: number; pricePerMonth: number; revenue: number }[];
  revenueHistory: { month: string; revenue: number }[];
  planPrices: Record<string, number>;
};
type AuditEntry = { id: number; actor: string; action: string; target: string; detail: string; createdAt: string };
type Announcement = { id: number; title: string; message: string; type: string; targetCompany: string; active: number; createdBy: string; expiresAt: string | null; createdAt: string };

type Tab = "overview" | "revenue" | "announcements" | "tickets" | "audit";

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function AdminOverviewPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [user, setUser] = useState<any>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => {
      if (!d.user) { router.push("/login"); return; }
      setUser(d.user);
    }).catch(() => router.push("/login"));
  }, [router]);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try { await fetch("/api/auth/logout", { method: "POST" }); router.replace("/login"); router.refresh(); }
    catch { setLoggingOut(false); }
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "overview", label: "Overview", icon: <Buildings size={14} weight="bold" /> },
    { key: "revenue", label: "Revenue", icon: <CurrencyCircleDollar size={14} weight="bold" /> },
    { key: "announcements", label: "Announcements", icon: <Megaphone size={14} weight="bold" /> },
    { key: "tickets", label: "Tickets", icon: <Headset size={14} weight="bold" /> },
    { key: "audit", label: "Audit Log", icon: <ClockCounterClockwise size={14} weight="bold" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center bg-blue-600 text-white">
              <ShieldCheck size={18} weight="bold" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-900">Super Admin Panel</h1>
              <p className="text-[10px] text-gray-500">QA Daily Hub — Platform Management</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Export dropdown */}
            <ExportButton />
            {user && <span className="hidden text-xs font-medium text-gray-600 sm:block">{user.name || user.email}</span>}
            <button onClick={handleLogout} disabled={loggingOut}
              className="flex h-8 items-center gap-1.5 border border-gray-200 bg-white px-3 text-xs font-medium text-gray-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600">
              <SignOut size={14} weight="bold" />
              <span className="hidden sm:inline">{loggingOut ? "..." : "Logout"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl gap-0 px-4 sm:px-6 lg:px-8">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-xs font-semibold transition ${
                tab === t.key ? "border-blue-600 text-blue-700" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {tab === "overview" && <OverviewTab />}
        {tab === "revenue" && <RevenueTab />}
        {tab === "announcements" && <AnnouncementsTab />}
        {tab === "tickets" && <TicketsTab />}
        {tab === "audit" && <AuditLogTab />}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white px-4 py-3 text-center">
        <p className="text-[11px] font-medium text-gray-400">© 2026 - Akusara Project</p>
      </footer>

      <ScrollToTop />
    </div>
  );
}

// ─── Export Button ───────────────────────────────────────────────────────────
function ExportButton() {
  const [open, setOpen] = useState(false);
  const download = (type: string) => {
    window.open(`/api/admin/export?type=${type}`, "_blank");
    setOpen(false);
  };
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}
        className="flex h-8 items-center gap-1.5 border border-gray-200 bg-white px-3 text-xs font-medium text-gray-600 transition hover:border-blue-200 hover:text-blue-600">
        <Export size={14} weight="bold" /> <span className="hidden sm:inline">Export</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-48 border border-gray-200 bg-white shadow-lg">
          {[
            { type: "summary", label: "Platform Summary" },
            { type: "companies", label: "Companies List" },
            { type: "revenue", label: "Revenue Report" },
            { type: "usage", label: "Usage Metrics" },
          ].map((item) => (
            <button key={item.type} onClick={() => download(item.type)}
              className="block w-full px-3 py-2 text-left text-xs font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700">
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Overview Tab ────────────────────────────────────────────────────────────
function OverviewTab() {
  const router = useRouter();
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedCompany, setExpandedCompany] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadData = useCallback(() => {
    fetch("/api/admin/overview")
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((j) => { if (j?.data) setData(j.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAction = async (action: string, companyId: number, value?: string | number) => {
    setActionLoading(`${action}-${companyId}`);
    try { const r = await fetch("/api/admin/overview", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, companyId, value }) }); if (r.ok) loadData(); }
    catch {} setActionLoading(null);
  };

  if (loading) return <LoadingSkeleton />;
  if (!data) return <p className="text-sm text-gray-500">Failed to load data.</p>;

  return (
    <div className="space-y-6">
      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <MetricCard icon={<Buildings size={18} weight="bold" />} label="Companies" value={data.systemTotals.totalCompanies} color="blue" />
        <MetricCard icon={<Users size={18} weight="bold" />} label="Users" value={data.systemTotals.totalUsers} color="emerald" />
        <MetricCard icon={<Bug size={18} weight="bold" />} label="Bugs" value={data.systemTotals.totalBugs} color="rose" />
        <MetricCard icon={<Kanban size={18} weight="bold" />} label="Tasks" value={data.systemTotals.totalTasks} color="amber" />
        <MetricCard icon={<Checks size={18} weight="bold" />} label="Test Cases" value={data.systemTotals.totalTestCases} color="violet" />
      </div>

      {/* Alerts: Expiring/Expired Plans */}
      {data.alerts && data.alerts.length > 0 && (
        <section className="border border-amber-200 bg-amber-50 p-4">
          <div className="mb-2 flex items-center gap-2">
            <Warning size={16} weight="bold" className="text-amber-600" />
            <h2 className="text-sm font-bold text-amber-800">Plan Alerts</h2>
          </div>
          <div className="space-y-1.5">
            {data.alerts.map((a, i) => (
              <div key={i} className="flex items-center justify-between bg-white border border-amber-100 px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${a.type === "expired" ? "bg-rose-500" : "bg-amber-400"}`} />
                  <span className="text-xs font-semibold text-gray-800">{a.company}</span>
                  <span className="text-[10px] text-gray-500 capitalize">({a.plan})</span>
                </div>
                <span className={`text-[11px] font-bold ${a.type === "expired" ? "text-rose-600" : "text-amber-600"}`}>
                  {a.type === "expired" ? "Expired" : `${a.daysLeft}d left`}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Growth + Roles */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="border border-gray-200 bg-white p-5">
          <div className="mb-3 flex items-center gap-2">
            <ChartLineUp size={16} weight="bold" className="text-blue-600" />
            <h2 className="text-sm font-bold text-gray-800">Company Growth (6 Months)</h2>
          </div>
          {data.growthData.length > 0 ? (
            <div className="flex items-end gap-2 h-32">
              {data.growthData.map((g) => {
                const max = Math.max(...data.growthData.map((d) => d.count), 1);
                const h = Math.max((g.count / max) * 100, 8);
                return (<div key={g.month} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-[10px] font-bold text-gray-700">{g.count}</span>
                  <div className="w-full bg-blue-500 rounded-t" style={{ height: `${h}%` }} />
                  <span className="text-[9px] text-gray-500">{g.month.slice(5)}</span>
                </div>);
              })}
            </div>
          ) : <p className="py-8 text-center text-xs text-gray-400">No data yet</p>}
        </section>
        <section className="border border-gray-200 bg-white p-5">
          <div className="mb-3 flex items-center gap-2">
            <Crown size={16} weight="bold" className="text-violet-600" />
            <h2 className="text-sm font-bold text-gray-800">Role Distribution</h2>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {data.roleDistribution.map((r) => (
              <div key={r.role} className="flex items-center gap-2 bg-gray-50 px-3 py-2">
                <UserCircle size={14} weight="bold" className="shrink-0 text-gray-400" />
                <span className="flex-1 truncate text-xs text-gray-700">{getRoleLabel(r.role)}</span>
                <span className="text-xs font-bold text-gray-900">{r.count}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Company Cards */}
      <section>
        <h2 className="mb-3 text-sm font-bold text-gray-800">Companies</h2>
        <div className="space-y-3">
          {data.companies.map((c) => (
            <CompanyCard key={c.id} company={c} expanded={expandedCompany === c.name}
              onToggle={() => setExpandedCompany(expandedCompany === c.name ? null : c.name)}
              onAction={handleAction} actionLoading={actionLoading} />
          ))}
          {data.companies.length === 0 && <p className="py-8 text-center text-sm text-gray-400">No companies yet.</p>}
        </div>
      </section>
    </div>
  );
}

// ─── Revenue Tab ─────────────────────────────────────────────────────────────
function RevenueTab() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/revenue").then((r) => r.json()).then((j) => { if (j?.data) setData(j.data); })
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSkeleton />;
  if (!data) return <p className="text-sm text-gray-500">Failed to load revenue data.</p>;

  const formatCurrency = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

  return (
    <div className="space-y-6">
      {/* MRR / ARR Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="border border-emerald-100 bg-emerald-50 px-4 py-4 text-emerald-700">
          <p className="text-[10px] font-semibold uppercase opacity-70">MRR</p>
          <p className="text-xl font-bold">{formatCurrency(data.mrr)}</p>
        </div>
        <div className="border border-blue-100 bg-blue-50 px-4 py-4 text-blue-700">
          <p className="text-[10px] font-semibold uppercase opacity-70">ARR</p>
          <p className="text-xl font-bold">{formatCurrency(data.arr)}</p>
        </div>
        <div className="border border-rose-100 bg-rose-50 px-4 py-4 text-rose-700">
          <p className="text-[10px] font-semibold uppercase opacity-70">Churn Loss</p>
          <p className="text-xl font-bold">{formatCurrency(data.churnRevenue)}</p>
        </div>
        <div className="border border-violet-100 bg-violet-50 px-4 py-4 text-violet-700">
          <p className="text-[10px] font-semibold uppercase opacity-70">Conversion</p>
          <p className="text-xl font-bold">{data.conversionRate}%</p>
          <p className="text-[10px] opacity-60">{data.expiringCount} expiring soon</p>
        </div>
      </div>

      {/* Revenue by Plan */}
      <section className="border border-gray-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-bold text-gray-800">Revenue by Plan</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                <th className="pb-2 pr-4">Plan</th>
                <th className="pb-2 pr-4">Companies</th>
                <th className="pb-2 pr-4">Price/Month</th>
                <th className="pb-2">Revenue/Month</th>
              </tr>
            </thead>
            <tbody>
              {data.revenueByPlan.map((p) => (
                <tr key={p.plan} className="border-b border-gray-50">
                  <td className="py-2 pr-4 font-bold text-gray-800 capitalize">{p.plan}</td>
                  <td className="py-2 pr-4 text-gray-600">{p.count}</td>
                  <td className="py-2 pr-4 text-gray-600">{formatCurrency(p.pricePerMonth)}</td>
                  <td className="py-2 font-bold text-gray-800">{formatCurrency(p.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Revenue Trend */}
      <section className="border border-gray-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-bold text-gray-800">Revenue Trend (6 Months)</h2>
        {data.revenueHistory.length > 0 ? (
          <div className="flex items-end gap-2 h-36">
            {data.revenueHistory.map((h) => {
              const max = Math.max(...data.revenueHistory.map((d) => d.revenue), 1);
              const height = Math.max((h.revenue / max) * 100, 4);
              return (<div key={h.month} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-[9px] font-bold text-gray-600">{(h.revenue / 1000000).toFixed(1)}M</span>
                <div className="w-full bg-emerald-500 rounded-t" style={{ height: `${height}%` }} />
                <span className="text-[9px] text-gray-500">{h.month.slice(5)}</span>
              </div>);
            })}
          </div>
        ) : <p className="py-8 text-center text-xs text-gray-400">No data</p>}
      </section>
    </div>
  );
}

// ─── Announcements Tab ───────────────────────────────────────────────────────
function AnnouncementsTab() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", message: "", type: "info", targetCompany: "", expiresAt: "" });
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    fetch("/api/admin/announcements").then((r) => r.json()).then((j) => setAnnouncements(j.data || []))
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!form.title.trim() || !form.message.trim()) return;
    setSubmitting(true);
    try {
      await fetch("/api/admin/announcements", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setForm({ title: "", message: "", type: "info", targetCompany: "", expiresAt: "" });
      setShowForm(false);
      load();
    } catch {} setSubmitting(false);
  };

  const handleAction = async (id: number, action: "activate" | "deactivate" | "delete") => {
    await fetch("/api/admin/announcements", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    load();
  };

  if (loading) return <LoadingSkeleton />;

  const typeColors: Record<string, string> = {
    info: "bg-blue-50 text-blue-700", warning: "bg-amber-50 text-amber-700",
    maintenance: "bg-rose-50 text-rose-700", update: "bg-emerald-50 text-emerald-700",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-800">Announcements</h2>
        <button onClick={() => setShowForm(!showForm)}
          className="flex h-8 items-center gap-1.5 border border-blue-200 bg-blue-50 px-3 text-xs font-semibold text-blue-700 transition hover:bg-blue-100">
          <Plus size={12} weight="bold" /> New
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="border border-blue-200 bg-blue-50/50 p-4 space-y-3">
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Title" className="w-full border border-gray-200 bg-white px-3 py-2 text-xs outline-none focus:border-blue-400" />
          <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
            placeholder="Message..." rows={3} className="w-full border border-gray-200 bg-white px-3 py-2 text-xs outline-none focus:border-blue-400 resize-none" />
          <div className="flex flex-wrap gap-2">
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="border border-gray-200 bg-white px-2 py-1.5 text-xs outline-none">
              <option value="info">Info</option><option value="warning">Warning</option>
              <option value="maintenance">Maintenance</option><option value="update">Update</option>
            </select>
            <input value={form.targetCompany} onChange={(e) => setForm({ ...form, targetCompany: e.target.value })}
              placeholder="Target company (empty = all)" className="flex-1 border border-gray-200 bg-white px-2 py-1.5 text-xs outline-none" />
            <div className="w-52">
              <ModernDatePicker name="expiresAt" value={form.expiresAt} onChange={(val) => setForm({ ...form, expiresAt: val })} />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} disabled={submitting}
              className="h-7 border border-blue-600 bg-blue-600 px-3 text-[11px] font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50">
              {submitting ? "Sending..." : "Publish"}
            </button>
            <button onClick={() => setShowForm(false)} className="h-7 border border-gray-200 px-3 text-[11px] font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="space-y-2">
        {announcements.map((a) => (
          <div key={a.id} className={`border bg-white px-4 py-3 ${a.active ? "border-gray-200" : "border-gray-100 opacity-60"}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-1.5 py-0.5 text-[10px] font-bold uppercase ${typeColors[a.type] || typeColors.info}`}>{a.type}</span>
                  {!a.active && <span className="text-[10px] text-gray-400">Inactive</span>}
                  {a.targetCompany && <span className="text-[10px] text-gray-500">→ {a.targetCompany}</span>}
                </div>
                <p className="text-xs font-bold text-gray-800">{a.title}</p>
                <p className="text-[11px] text-gray-600 mt-0.5 line-clamp-2">{a.message}</p>
                <p className="text-[10px] text-gray-400 mt-1">By {a.createdBy} · {formatDate(a.createdAt)}{a.expiresAt ? ` · Expires ${a.expiresAt}` : ""}</p>
              </div>
              <div className="flex shrink-0 gap-1">
                <button onClick={() => handleAction(a.id, a.active ? "deactivate" : "activate")} title={a.active ? "Deactivate" : "Activate"}
                  className="flex h-7 w-7 items-center justify-center border border-gray-200 text-gray-500 hover:bg-gray-50">
                  {a.active ? <EyeSlash size={12} weight="bold" /> : <Eye size={12} weight="bold" />}
                </button>
                <button onClick={() => handleAction(a.id, "delete")} title="Delete"
                  className="flex h-7 w-7 items-center justify-center border border-gray-200 text-rose-500 hover:bg-rose-50">
                  <Trash size={12} weight="bold" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {announcements.length === 0 && <p className="py-8 text-center text-sm text-gray-400">No announcements yet.</p>}
      </div>
    </div>
  );
}

// ─── Tickets Tab ─────────────────────────────────────────────────────────────
function TicketsTab() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyId, setReplyId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch("/api/admin/tickets").then((r) => r.json()).then((d) => setTickets(d.data || []))
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAction = async (id: number, action: "reply" | "close" | "in-progress", reply?: string) => {
    setActionLoading(`${action}-${id}`);
    try {
      await fetch("/api/admin/tickets", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action, reply }),
      });
      setReplyId(null);
      setReplyText("");
      load();
    } catch {} setActionLoading(null);
  };

  if (loading) return <LoadingSkeleton />;

  const statusColors: Record<string, string> = { open: "bg-blue-50 text-blue-700", "in-progress": "bg-amber-50 text-amber-700", replied: "bg-emerald-50 text-emerald-700", closed: "bg-gray-100 text-gray-500" };
  const priorityColors: Record<string, string> = { low: "text-gray-500", normal: "text-blue-600", high: "text-amber-600", urgent: "text-rose-600" };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-800">Support Tickets</h2>
        <span className="text-[11px] text-gray-500">{tickets.filter((t) => t.status === "open").length} open</span>
      </div>

      {tickets.length === 0 ? (
        <div className="border border-gray-200 bg-white px-6 py-10 text-center">
          <Headset size={32} weight="bold" className="mx-auto mb-3 text-gray-300" />
          <p className="text-sm font-semibold text-gray-600">No tickets</p>
          <p className="mt-1 text-xs text-gray-400">Company admins can submit support tickets from their settings.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tickets.map((t) => (
            <div key={t.id} className="border border-gray-200 bg-white px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`px-1.5 py-0.5 text-[10px] font-bold ${statusColors[t.status] || statusColors.open}`}>{t.status}</span>
                    <span className="text-xs font-bold text-gray-800">{t.subject}</span>
                    <span className={`text-[10px] font-bold ${priorityColors[t.priority] || priorityColors.normal}`}>{t.priority}</span>
                    <span className="text-[10px] text-gray-400 capitalize">{t.category}</span>
                  </div>
                  <p className="text-[11px] text-gray-600">{t.message}</p>
                  <p className="text-[10px] text-gray-400 mt-1">
                    From <span className="font-semibold">{t.company}</span> · {t.createdBy} · {formatDateTime(t.createdAt)}
                  </p>
                </div>
              </div>

              {/* Admin Reply (if exists) */}
              {t.adminReply && (
                <div className="mt-2 border-t border-gray-100 pt-2 bg-emerald-50/50 -mx-4 px-4 py-2">
                  <p className="text-[10px] font-semibold text-emerald-700">Your reply:</p>
                  <p className="text-[11px] text-gray-700">{t.adminReply}</p>
                </div>
              )}

              {/* Reply form */}
              {replyId === t.id && (
                <div className="mt-2 border-t border-gray-100 pt-2 space-y-2">
                  <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply..." rows={2}
                    className="w-full border border-gray-200 bg-white px-3 py-2 text-xs outline-none resize-none focus:border-blue-400" />
                  <div className="flex gap-2">
                    <button onClick={() => handleAction(t.id, "reply", replyText)} disabled={!replyText.trim() || actionLoading === `reply-${t.id}`}
                      className="h-7 bg-blue-600 px-3 text-[11px] font-bold text-white disabled:opacity-50">
                      {actionLoading === `reply-${t.id}` ? "..." : "Send Reply"}
                    </button>
                    <button onClick={() => { setReplyId(null); setReplyText(""); }}
                      className="h-7 border border-gray-200 px-3 text-[11px] text-gray-600">Cancel</button>
                  </div>
                </div>
              )}

              {/* Actions */}
              {t.status !== "closed" && replyId !== t.id && (
                <div className="mt-2 flex gap-2 border-t border-gray-100 pt-2">
                  <button onClick={() => { setReplyId(t.id); setReplyText(""); }}
                    className="h-6 border border-gray-200 px-2 text-[10px] font-medium text-gray-600 hover:bg-gray-50">Reply</button>
                  {t.status === "open" && (
                    <button onClick={() => handleAction(t.id, "in-progress")}
                      className="h-6 border border-amber-200 px-2 text-[10px] font-medium text-amber-700 hover:bg-amber-50">
                      {actionLoading === `in-progress-${t.id}` ? "..." : "In Progress"}
                    </button>
                  )}
                  <button onClick={() => handleAction(t.id, "close")}
                    className="h-6 border border-gray-200 px-2 text-[10px] font-medium text-gray-500 hover:bg-gray-50">
                    {actionLoading === `close-${t.id}` ? "..." : "Close"}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Audit Log Tab ───────────────────────────────────────────────────────────
function AuditLogTab() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/audit-log").then((r) => r.json()).then((j) => setLogs(j.data || []))
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSkeleton />;

  const actionLabels: Record<string, string> = {
    suspend_company: "Suspended company",
    activate_company: "Activated company",
    extend_trial: "Extended trial",
    update_quota: "Updated user quota",
    update_plan: "Changed plan",
    create_announcement: "Created announcement",
    deactivate_announcement: "Deactivated announcement",
    activate_announcement: "Activated announcement",
    delete_announcement: "Deleted announcement",
    export_report: "Exported report",
  };

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-bold text-gray-800">Admin Audit Log</h2>
      {logs.length === 0 ? (
        <div className="border border-gray-200 bg-white px-6 py-10 text-center">
          <ClockCounterClockwise size={32} weight="bold" className="mx-auto mb-3 text-gray-300" />
          <p className="text-sm font-semibold text-gray-600">No actions recorded yet</p>
          <p className="mt-1 text-xs text-gray-400 max-w-sm mx-auto">
            All your admin actions will be logged here automatically — suspend/activate company, change plans, extend trials, publish announcements, export reports.
          </p>
        </div>
      ) : (
        <div className="border border-gray-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                  <th className="px-4 py-2">Time</th>
                  <th className="px-4 py-2">Actor</th>
                  <th className="px-4 py-2">Action</th>
                  <th className="px-4 py-2">Target</th>
                  <th className="px-4 py-2">Detail</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">{formatDateTime(log.createdAt)}</td>
                    <td className="px-4 py-2.5 font-medium text-gray-800">{log.actor}</td>
                    <td className="px-4 py-2.5 text-gray-700">{actionLabels[log.action] || log.action}</td>
                    <td className="px-4 py-2.5 text-gray-600">{log.target}</td>
                    <td className="px-4 py-2.5 text-gray-500 max-w-48 truncate">{log.detail || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Company Card ────────────────────────────────────────────────────────────
function CompanyCard({ company, expanded, onToggle, onAction, actionLoading }: {
  company: CompanyDetail; expanded: boolean; onToggle: () => void;
  onAction: (action: string, companyId: number, value?: string | number) => void; actionLoading: string | null;
}) {
  const healthColors = { green: "bg-emerald-500", yellow: "bg-amber-400", red: "bg-rose-500" };
  const planColors: Record<string, string> = { free: "bg-gray-100 text-gray-700", pro: "bg-blue-100 text-blue-700", enterprise: "bg-violet-100 text-violet-700" };
  const statusColors: Record<string, string> = { active: "bg-emerald-50 text-emerald-700", suspended: "bg-rose-50 text-rose-700" };

  return (
    <div className="border border-gray-200 bg-white transition hover:border-blue-200">
      <button onClick={onToggle} className="flex w-full items-center justify-between px-4 py-3.5 text-left">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center bg-blue-50 text-blue-600"><Buildings size={20} weight="bold" /></div>
            <span className={`absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white ${healthColors[company.health]}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-gray-800">{company.name}</p>
              <span className={`px-1.5 py-0.5 text-[10px] font-bold uppercase ${planColors[company.plan] || planColors.free}`}>{company.plan}</span>
              <span className={`px-1.5 py-0.5 text-[10px] font-bold ${statusColors[company.status] || statusColors.active}`}>{company.status}</span>
            </div>
            <p className="text-[11px] text-gray-500">{company.totalUsers}/{company.maxUsers} users · MAU: {company.mau} · Last active: {company.lastActivityAt ? timeAgo(company.lastActivityAt) : "Never"}</p>
          </div>
        </div>
        {expanded ? <CaretUp size={14} weight="bold" className="text-gray-400" /> : <CaretDown size={14} weight="bold" className="text-gray-400" />}
      </button>

      {expanded && (
        <div className="border-t border-gray-100 px-4 py-4 space-y-4">
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Usage</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <UsagePill icon={<Bug size={12} weight="bold" />} label="Bugs" value={company.totalBugs} />
              <UsagePill icon={<Kanban size={12} weight="bold" />} label="Tasks" value={company.totalTasks} />
              <UsagePill icon={<Checks size={12} weight="bold" />} label="Test Cases" value={company.totalTestCases} />
              <UsagePill icon={<Lightning size={12} weight="bold" />} label="Sprints" value={company.totalSprints} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
            <div><p className="text-[10px] text-gray-500">Plan Expiry</p><p className="font-semibold text-gray-800">{company.planExpiry || "No expiry"}</p></div>
            <div><p className="text-[10px] text-gray-500">Max Users</p><p className="font-semibold text-gray-800">{company.maxUsers}</p></div>
            <div><p className="text-[10px] text-gray-500">Joined</p><p className="font-semibold text-gray-800">{formatDate(company.createdAt)}</p></div>
            <div><p className="text-[10px] text-gray-500">Health</p><p className="flex items-center gap-1 font-semibold"><Circle size={8} weight="fill" className={company.health === "green" ? "text-emerald-500" : company.health === "yellow" ? "text-amber-400" : "text-rose-500"} /><span className="text-gray-800 capitalize">{company.health}</span></p></div>
          </div>
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Actions</p>
            <div className="flex flex-wrap gap-2">
              {company.status === "active"
                ? <ActionBtn label="Suspend" loading={actionLoading === `suspend-${company.id}`} onClick={() => onAction("suspend", company.id)} variant="danger" />
                : <ActionBtn label="Activate" loading={actionLoading === `activate-${company.id}`} onClick={() => onAction("activate", company.id)} variant="success" />}
              <ActionBtn label="Extend +30d" loading={actionLoading === `extend_trial-${company.id}`} onClick={() => onAction("extend_trial", company.id)} variant="default" />
              <ActionBtn label="→ Pro" loading={actionLoading === `update_plan-${company.id}`} onClick={() => onAction("update_plan", company.id, "pro")} variant="default" disabled={company.plan === "pro"} />
              <ActionBtn label="→ Enterprise" loading={actionLoading === `update_plan-${company.id}`} onClick={() => onAction("update_plan", company.id, "enterprise")} variant="default" disabled={company.plan === "enterprise"} />
              <ActionBtn label="+5 Users" loading={actionLoading === `update_quota-${company.id}`} onClick={() => onAction("update_quota", company.id, company.maxUsers + 5)} variant="default" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Shared Components ───────────────────────────────────────────────────────
function ActionBtn({ label, loading, onClick, variant = "default", disabled = false }: {
  label: string; loading: boolean; onClick: () => void; variant?: "default" | "danger" | "success"; disabled?: boolean;
}) {
  const v = { default: "border-gray-200 text-gray-700 hover:bg-gray-50", danger: "border-rose-200 text-rose-700 hover:bg-rose-50", success: "border-emerald-200 text-emerald-700 hover:bg-emerald-50" };
  return (<button onClick={onClick} disabled={loading || disabled} className={`inline-flex h-7 items-center border px-2.5 text-[11px] font-medium transition disabled:opacity-50 ${v[variant]}`}>{loading ? "..." : label}</button>);
}

function UsagePill({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (<div className="flex items-center gap-2 bg-gray-50 px-2.5 py-1.5"><span className="text-gray-400">{icon}</span><span className="text-[11px] text-gray-600">{label}</span><span className="ml-auto text-xs font-bold text-gray-900">{value}</span></div>);
}

function MetricCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: "blue" | "emerald" | "rose" | "amber" | "violet" }) {
  const c = { blue: "border-blue-100 bg-blue-50 text-blue-600", emerald: "border-emerald-100 bg-emerald-50 text-emerald-600", rose: "border-rose-100 bg-rose-50 text-rose-600", amber: "border-amber-100 bg-amber-50 text-amber-600", violet: "border-violet-100 bg-violet-50 text-violet-600" };
  return (<div className={`flex items-center gap-3 border px-4 py-3.5 ${c[color]}`}><div className="flex h-9 w-9 items-center justify-center rounded bg-white/70">{icon}</div><div><p className="text-2xl font-bold">{value}</p><p className="text-[10px] font-semibold opacity-80">{label}</p></div></div>);
}

function LoadingSkeleton() {
  return (<div className="animate-pulse space-y-4"><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{[1,2,3,4].map((i) => <div key={i} className="h-20 rounded bg-gray-200" />)}</div><div className="h-48 rounded bg-gray-200" /><div className="h-32 rounded bg-gray-200" /></div>);
}

function timeAgo(d: string) { const ms = Date.now() - new Date(d).getTime(); const m = Math.floor(ms/60000); if (m < 60) return `${m}m ago`; const h = Math.floor(m/60); if (h < 24) return `${h}h ago`; const days = Math.floor(h/24); if (days < 30) return `${days}d ago`; return `${Math.floor(days/30)}mo ago`; }
function formatDate(d: string) { try { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); } catch { return d; } }
function formatDateTime(d: string) { try { return new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }); } catch { return d; } }
