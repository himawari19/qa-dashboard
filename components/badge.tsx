import { cn } from "@/lib/utils";

const toneMap = {
  // ── Severity (traffic light scale, clearly distinct) ─────────────────────
  // 🔴 Red → 🟠 Orange → 🟡 Yellow → 🔵 Sky
  critical: "bg-red-600 text-white",
  high:     "bg-orange-500 text-white",
  medium:   "bg-yellow-400 text-slate-800",
  low:      "bg-sky-500 text-white",
  P0:       "bg-red-600 text-white",
  P1:       "bg-orange-500 text-white",
  P2:       "bg-yellow-400 text-slate-800",
  P3:       "bg-sky-500 text-white",
  // ── Bug status ───────────────────────────────────────────────────────────
  // 🔴 open → 🔵 in progress → 🟣 ready to retest → 🟢 closed → ⚫ rejected
  open:            "bg-red-500 text-white",
  in_progress:     "bg-blue-600 text-white",
  ready_to_retest: "bg-violet-600 text-white",
  closed:          "bg-emerald-600 text-white",
  rejected:        "bg-slate-600 text-white",
  // ── Task status ──────────────────────────────────────────────────────────
  // ⚫ todo → 🔵 doing → 🟢 done → ⚫ deferred
  todo:     "bg-slate-400 text-white",
  doing:    "bg-blue-600 text-white",
  done:     "bg-emerald-600 text-white",
  deferred: "bg-slate-500 text-white",
  // ── Plan / Sprint status ─────────────────────────────────────────────────
  draft:     "bg-slate-400 text-white",
  planning:  "bg-indigo-500 text-white",
  active:    "bg-blue-600 text-white",
  completed: "bg-emerald-600 text-white",
  cancelled: "bg-slate-600 text-white",
  obsolete:  "bg-slate-600 text-white",
  // ── Test execution results ───────────────────────────────────────────────
  // 🟢 pass → 🔴 fail → 🟡 blocked → ⚫ pending
  Passed:  "bg-emerald-600 text-white",
  Success: "bg-emerald-600 text-white",
  Failed:  "bg-red-600 text-white",
  Blocked: "bg-yellow-400 text-slate-800",
  Pending: "bg-slate-400 text-white",
  pass:    "bg-emerald-600 text-white",
  fail:    "bg-red-600 text-white",
  blocked: "bg-yellow-400 text-slate-800",
  // ── Deployment status ────────────────────────────────────────────────────
  success:       "bg-emerald-600 text-white",
  failed:        "bg-red-600 text-white",
  rollback:      "bg-rose-700 text-white",
  Rollback:      "bg-rose-700 text-white",
  "In Progress": "bg-amber-500 text-white",
  // ── Deployment environment ───────────────────────────────────────────────
  production:  "bg-red-700 text-white",
  Production:  "bg-red-700 text-white",
  staging:     "bg-violet-600 text-white",
  Staging:     "bg-violet-600 text-white",
  development: "bg-sky-600 text-white",
  Development: "bg-sky-600 text-white",
  uat:         "bg-teal-600 text-white",
  UAT:         "bg-teal-600 text-white",
  // ── Test case type ───────────────────────────────────────────────────────
  "Happy Case":   "bg-teal-500 text-white",
  "Unhappy Case": "bg-rose-700 text-white",
  Positive:       "bg-teal-500 text-white",
  Negative:       "bg-rose-700 text-white",
  // ── Assignee / resource status ───────────────────────────────────────────
  available: "bg-emerald-500 text-white",
  busy:      "bg-orange-500 text-white",
  on_leave:  "bg-slate-400 text-white",
  // ── User roles ───────────────────────────────────────────────────────────
  admin:  "bg-purple-700 text-white",
  user:   "bg-slate-500 text-white",
  "Product Manager":          "bg-indigo-600 text-white",
  "Project Manager":          "bg-indigo-600 text-white",
  "System Analyst":           "bg-cyan-700 text-white",
  "UI/UX Designer":           "bg-pink-600 text-white",
  "Frontend Developer":       "bg-blue-600 text-white",
  "Backend Developer":        "bg-blue-800 text-white",
  "Fullstack Developer":      "bg-blue-700 text-white",
  "Mobile Developer":         "bg-sky-600 text-white",
  "QA Engineer":              "bg-teal-600 text-white",
  "QA Automation Engineer":   "bg-teal-800 text-white",
  "DevOps Engineer":          "bg-slate-700 text-white",
  "Security Engineer":        "bg-red-700 text-white",
  "Database Administrator":   "bg-amber-700 text-white",
  "Software Architect":       "bg-violet-700 text-white",
} as const;

export function Badge({ value, className }: { value: string; className?: string }) {
  const safeValue = String(value || "");
  return (
    <span
      className={cn(
        "inline-flex min-w-[80px] justify-center rounded-md px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest shadow-sm",
        toneMap[safeValue as keyof typeof toneMap] ?? "bg-slate-500 text-white",
        className
      )}
    >
      {safeValue.replace(/_/g, " ")}
    </span>
  );
}
