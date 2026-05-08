"use client";

import { useState, useEffect, useCallback } from"react";
import { PageShell } from"@/components/page-shell";
import { Badge } from"@/components/badge";
import { 
 Users, 
 Briefcase, 
 CheckSquare, 
 Warning, 
 Info,
 TrendUp,
 UserCircle,
 MagnifyingGlass
} from"@phosphor-icons/react";
import { cn } from"@/lib/utils";
import { getRoleLabel } from"@/lib/roles";
import Link from"next/link";
import { CaretRight } from"@phosphor-icons/react";

type WorkloadItem = {
 id: string;
 name: string;
 email: string;
 role: string;
 tasks: number;
 plans: number;
 score: number;
 level:'low' |'medium' |'high' |'critical';
};

export default function WorkloadPage() {
 const [data, setData] = useState<WorkloadItem[]>([]);
 const [efficiency, setEfficiency] = useState(0);
 const [loading, setLoading] = useState(true);
 const [search, setSearch] = useState("");
 type DetailItem = { label: string; sub: string; badge?: string; badge2?: string; href: string };
 const [detail, setDetail] = useState<{ member: WorkloadItem; items: DetailItem[] } | null>(null);
 const [detailLoading, setDetailLoading] = useState(false);

 const closeDetail = useCallback(() => setDetail(null), []);

 const openDetail = async (item: WorkloadItem) => {
 setDetailLoading(true);
 setDetail({ member: item, items: [] });
 const res = await fetch(`/api/dashboard/resource-details?name=${encodeURIComponent(item.name)}`).then(r => r.json()).catch(() => ({}));
 const items: DetailItem[] = [
 ...(res.tasks || []).map((t: any) => ({ label: t.title, sub:"Task", badge: t.status, badge2: t.priority, href:"/tasks" })),
 ...(res.bugs || []).map((b: any) => ({ label: b.title, sub:"Bug", badge: b.status, badge2: b.severity, href:"/bugs" })),
 ...(res.suites || []).map((s: any) => ({ label: s.title, sub:"Test Suite", badge: s.status, href:"/test-suites" })),
 ];
 setDetail({ member: item, items });
 setDetailLoading(false);
 };

 useEffect(() => {
 const handler = (e: KeyboardEvent) => { if (e.key ==="Escape") closeDetail(); };
 document.addEventListener("keydown", handler);
 return () => document.removeEventListener("keydown", handler);
 }, [closeDetail]);

 useEffect(() => {
 fetch("/api/reports/workload")
 .then(r => r.json())
 .then(d => {
 setData(d.workload || []);
 setEfficiency(d.efficiency ?? 0);
 setLoading(false);
 })
 .catch(() => setLoading(false));
 }, []);

 const filtered = data.filter(item => 
 item.name.toLowerCase().includes(search.toLowerCase()) ||
 item.role.toLowerCase().includes(search.toLowerCase())
 );

 const getScoreColor = (level: string) => {
 switch (level) {
 case'critical': return'text-rose-600 bg-rose-50 border-rose-100';
 case'high': return'text-orange-600 bg-orange-50 border-orange-100';
 case'medium': return'text-amber-600 bg-amber-50 border-amber-100';
 default: return'text-sky-600 bg-sky-50 border-sky-100';
 }
 };

 const getIntensity = (score: number) => {
 if (score >= 10) return'opacity-100';
 if (score >= 7) return'opacity-80';
 if (score >= 4) return'opacity-60';
 if (score >= 1) return'opacity-40';
 return'opacity-10';
 };

 return (
 <PageShell
 icon={<TrendUp size={22} weight="bold" />}
 title="Resource Workload"
 description="Visual breakdown of task and plan assignments per team member."
 crumbs={[{ label:"Dashboard", href:"/dashboard" }, { label:"Workload Heatmap" }]}
 actions={
 <div className="relative">
 <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
 <input
 type="text"
 placeholder="Search by name or role..."
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 className="h-10 w-64 rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-xs font-semibold shadow-sm outline-none transition focus:ring-2 focus:ring-blue-500/20"
 />
 </div>
 }
 >
 <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
 {/* Info Cards */}
 <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
 <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
 <div className="flex items-center gap-3">
 <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
 <Users size={20} weight="bold" />
 </div>
 <div>
 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Resources</p>
 <p className="text-2xl font-black text-slate-900">{data.length}</p>
 </div>
 </div>
 </div>
 <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
 <div className="flex items-center gap-3">
 <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
 <Warning size={20} weight="bold" />
 </div>
 <div>
 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Over-Capacity</p>
 <p className="text-2xl font-black text-slate-900">
 {data.filter(i => i.level ==='critical' || i.level ==='high').length}
 </p>
 </div>
 </div>
 </div>
 <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
 <div className="flex items-center gap-3">
 <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
 <TrendUp size={20} weight="bold" />
 </div>
 <div>
 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Team Efficiency</p>
 <p className="text-2xl font-black text-slate-900">{efficiency}%</p>
 </div>
 </div>
 </div>
 </div>

 {/* Heatmap Grid */}
 <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
 <div className="mb-8 flex items-center justify-between">
 <div>
 <h3 className="text-lg font-black text-slate-900">Workload Heatmap</h3>
 <p className="text-sm text-slate-500">Visual breakdown of task and plan assignments per team member.</p>
 </div>
 <div className="flex items-center gap-4 text-[11px] font-black uppercase tracking-widest text-slate-400">
 <div className="flex items-center gap-1.5">
 <div className="h-3 w-3 rounded bg-sky-500 opacity-20" /> Low
 </div>
 <div className="flex items-center gap-1.5">
 <div className="h-3 w-3 rounded bg-sky-500 opacity-60" /> Medium
 </div>
 <div className="flex items-center gap-1.5">
 <div className="h-3 w-3 rounded bg-sky-500 opacity-100" /> High
 </div>
 <div className="flex items-center gap-1.5">
 <div className="h-3 w-3 rounded bg-rose-500" /> Critical
 </div>
 </div>
 </div>

 {loading ? (
 <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
 {[...Array(8)].map((_, i) => (
 <div key={i} className="h-32 animate-pulse rounded-2xl bg-slate-50" />
 ))}
 </div>
 ) : filtered.length === 0 ? (
 <div className="py-20 text-center">
 <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50">
 <Info size={32} className="text-slate-300" />
 </div>
 <p className="text-sm font-bold text-slate-400">No resources found matching your search.</p>
 </div>
 ) : (
 <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
 {filtered.map((item) => (
 <div
 key={item.id}
 onClick={() => openDetail(item)}
 className={cn(
"group relative cursor-pointer overflow-hidden rounded-2xl border p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl",
 item.level ==='critical' 
 ?'border-rose-200 bg-rose-50/30' 
 :'border-slate-100 bg-slate-50/50'
 )}
 >
 {/* Intensity Overlay */}
 <div className={cn(
"absolute inset-0 z-0 transition-opacity",
 item.level ==='critical' ?'bg-rose-500/5' :'bg-blue-500/5',
 getIntensity(item.score)
 )} />

 <div className="relative z-10">
 <div className="mb-4 flex items-center justify-between">
 <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-[11px] font-black text-white">
 {item.name.charAt(0).toUpperCase()}
 </div>
 <Badge value={item.level} />
 </div>

 <h4 className="truncate text-sm font-black text-slate-900">{item.name}</h4>
 <p className="mb-4 truncate text-[11px] font-bold uppercase tracking-widest text-slate-400">{getRoleLabel(item.role)}</p>

 <div className="grid grid-cols-2 gap-2">
 <div className="rounded-xl border border-white/50 bg-white/50 p-2.5">
 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tasks</p>
 <p className="text-sm font-black text-slate-900">{item.tasks}</p>
 </div>
 <div className="rounded-xl border border-white/50 bg-white/50 p-2.5">
 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Plans</p>
 <p className="text-sm font-black text-slate-900">{item.plans}</p>
 </div>
 </div>

 <div className="mt-4 flex items-center justify-between">
 <span className="text-[11px] font-bold text-slate-400">Workload Score</span>
 <span className={cn(
"rounded-full px-2 py-0.5 text-[11px] font-black",
 item.level ==='critical' ?'bg-rose-500 text-white' :'bg-slate-900 text-white'
 )}>
 {item.score}
 </span>
 </div>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>

 {/* Breakdown Table */}
 {!loading && filtered.length > 0 && (
 <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
 <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
 <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">Breakdown Details</h4>
 </div>
 <div className="overflow-x-auto">
 <table className="w-full text-left text-xs">
 <thead>
 <tr className="border-b border-slate-100">
 <th className="px-6 py-4 font-black uppercase tracking-widest text-slate-400">Resource</th>
 <th className="px-6 py-4 font-black uppercase tracking-widest text-slate-400">Role</th>
 <th className="px-6 py-4 font-black uppercase tracking-widest text-slate-400">Active Tasks</th>
 <th className="px-6 py-4 font-black uppercase tracking-widest text-slate-400">Test Plans</th>
 <th className="px-6 py-4 font-black uppercase tracking-widest text-slate-400">Score</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100">
 {filtered.map(item => (
 <tr key={item.id} onClick={() => openDetail(item)} className="cursor-pointer transition-colors hover:bg-slate-50/50">
 <td className="px-6 py-4">
 <div className="flex items-center gap-3">
 <UserCircle size={20} className="text-slate-400" />
 <span className="font-bold text-slate-900">{item.name}</span>
 </div>
 </td>
 <td className="px-6 py-4 font-medium text-slate-600">{getRoleLabel(item.role)}</td>
 <td className="px-6 py-4 font-black text-slate-900">
 <div className="flex items-center gap-2">
 <CheckSquare size={14} className="text-blue-500" />
 {item.tasks}
 </div>
 </td>
 <td className="px-6 py-4 font-black text-slate-900">
 <div className="flex items-center gap-2">
 <Briefcase size={14} className="text-amber-500" />
 {item.plans}
 </div>
 </td>
 <td className="px-6 py-4">
 <span className={cn(
"inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-black border",
 getScoreColor(item.level)
 )}>
 {item.score}
 </span>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 )}
 </div>

 {detail && (
 <div
 className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 backdrop-blur-sm animate-in fade-in duration-200 sm:items-center"
 onMouseDown={(e) => { if (e.target === e.currentTarget) setDetail(null); }}
 >
 <div className="relative flex max-h-[85vh] w-full max-w-xl flex-col rounded-2xl bg-white shadow-2xl animate-in slide-in-from-bottom-4 duration-300 sm:slide-in-from-bottom-0">
 <div className="flex items-center justify-between border-b border-slate-200/60 px-4 py-3">
 <div className="flex items-center gap-3">
 <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-[11px] font-black text-white">
 {detail.member.name.charAt(0).toUpperCase()}
 </div>
 <div>
 <p className="text-[10px] font-black uppercase tracking-widest text-blue-500">Resource Detail</p>
 <h2 className="text-sm font-black text-slate-900">{detail.member.name}</h2>
 <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">{getRoleLabel(detail.member.role)}</p>
 </div>
 </div>
 <button
 onClick={() => setDetail(null)}
 className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
 >
 ×
 </button>
 </div>

 <div className="grid grid-cols-3 gap-3 border-b border-slate-200/60 px-4 py-3">
 <div className="rounded-xl bg-blue-50 px-3 py-2">
 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tasks</p>
 <p className="text-lg font-black text-slate-900">{detail.member.tasks}</p>
 </div>
 <div className="rounded-xl bg-blue-50 px-3 py-2">
 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Plans</p>
 <p className="text-lg font-black text-slate-900">{detail.member.plans}</p>
 </div>
 <div className="rounded-xl bg-blue-50 px-3 py-2">
 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Score</p>
 <p className="text-lg font-black text-slate-900">{detail.member.score}</p>
 </div>
 </div>

 <div className="flex-1 overflow-y-auto px-4 py-3">
 <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Active Items</p>
 {detailLoading ? (
 <div className="space-y-2">
 {[...Array(3)].map((_, i) => (
 <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-50" />
 ))}
 </div>
 ) : detail.items.length === 0 ? (
 <div className="py-10 text-center text-xs text-slate-400">No active items.</div>
 ) : (
 <div className="space-y-2">
 {detail.items.map((item, i) => (
 <Link
 key={i}
 href={item.href}
 prefetch={false}
 onClick={() => setDetail(null)}
 className="group flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition hover:border-blue-200 hover:bg-blue-50/40"
 >
 <div className="min-w-0 flex-1">
 <p className="truncate text-xs font-bold text-slate-800 group-hover:text-blue-700">
 {item.label}
 </p>
 <p className="mt-0.5 text-[11px] font-semibold text-slate-400">{item.sub}</p>
 </div>
 <div className="flex shrink-0 items-center gap-1.5">
 {item.badge && <Badge value={item.badge} />}
 {item.badge2 && <Badge value={item.badge2} />}
 </div>
 <CaretRight size={12} className="shrink-0 text-slate-300 group-hover:text-blue-500" />
 </Link>
 ))}
 </div>
 )}
 </div>

 <div className="flex items-center justify-end border-t border-slate-200/60 px-4 py-3">
 <button
 onClick={() => setDetail(null)}
 className="h-8 rounded-lg bg-rose-600 px-4 text-xs font-bold text-white transition-all duration-300 hover:bg-rose-500 hover:-translate-y-0.5 hover:shadow-md"
 >
 Close
 </button>
 </div>
 </div>
 </div>
 )}
 </PageShell>
 );
}
