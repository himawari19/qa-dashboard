import { cn } from "@/lib/utils";

const toneMap = {
  P0: "bg-rose-600 text-white",
  P1: "bg-blue-700 text-white",
  P2: "bg-blue-500 text-white",
  P3: "bg-sky-400 text-white",
  critical: "bg-rose-700 text-white",
  high: "bg-rose-600 text-white",
  medium: "bg-blue-500 text-white",
  low: "bg-sky-400 text-white",
  open: "bg-blue-600 text-white",
  in_progress: "bg-blue-500 text-white",
  ready_to_retest: "bg-amber-500 text-white",
  closed: "bg-emerald-600 text-white",
  rejected: "bg-slate-500 text-white",
  todo: "bg-slate-400 text-white",
  doing: "bg-blue-500 text-white",
  done: "bg-blue-600 text-white",
  deferred: "bg-slate-500 text-white",
  draft: "bg-slate-400 text-white",
  active: "bg-blue-600 text-white",
  obsolete: "bg-slate-500 text-white",
  Passed: "bg-emerald-600 text-white",
  Success: "bg-emerald-600 text-white",
  Failed: "bg-rose-600 text-white",
  Blocked: "bg-amber-600 text-white",
  Pending: "bg-slate-400 text-white",
  "Happy Case": "bg-blue-500 text-white",
  "Unhappy Case": "bg-blue-800 text-white",
  Positive: "bg-blue-500 text-white",
  Negative: "bg-blue-800 text-white",
  pass: "bg-emerald-600 text-white",
  fail: "bg-rose-600 text-white",
  blocked: "bg-slate-600 text-white",
  available: "bg-emerald-500 text-white",
  busy: "bg-slate-600 text-white",
  on_leave: "bg-slate-400 text-white",
  completed: "bg-emerald-600 text-white",
  cancelled: "bg-slate-500 text-white",
  admin: "bg-blue-700 text-white",
  user: "bg-blue-600 text-white",
  "Product Manager": "bg-indigo-600 text-white",
  "Project Manager": "bg-indigo-600 text-white",
  "System Analyst": "bg-indigo-600 text-white",
  "UI/UX Designer": "bg-indigo-600 text-white",
  "Frontend Developer": "bg-blue-600 text-white",
  "Backend Developer": "bg-blue-600 text-white",
  "Fullstack Developer": "bg-blue-600 text-white",
  "Mobile Developer": "bg-blue-600 text-white",
  "QA Engineer": "bg-sky-600 text-white",
  "QA Automation Engineer": "bg-sky-600 text-white",
  "DevOps Engineer": "bg-slate-600 text-white",
  "Security Engineer": "bg-slate-600 text-white",
  "Database Administrator": "bg-slate-600 text-white",
  "Software Architect": "bg-indigo-700 text-white",
} as const;

export function Badge({ value, className }: { value: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex min-w-[80px] justify-center rounded-md px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest shadow-sm",
        toneMap[value as keyof typeof toneMap] ?? "bg-slate-500 text-white",
        className
      )}
    >
      {value.replace(/_/g, " ")}
    </span>
  );
}
