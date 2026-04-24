import { cn } from "@/lib/utils";

const toneMap = {
  P0: "bg-rose-500 text-white",
  P1: "bg-orange-500 text-white",
  P2: "bg-amber-400 text-amber-950",
  P3: "bg-sky-400 text-sky-950",
  critical: "bg-rose-700 text-white",
  high: "bg-rose-500 text-white",
  medium: "bg-amber-400 text-amber-950",
  low: "bg-emerald-400 text-emerald-950",
  open: "bg-rose-400 text-white",
  in_progress: "bg-sky-500 text-white",
  ready_to_retest: "bg-orange-400 text-white",
  closed: "bg-emerald-500 text-white",
  rejected: "bg-slate-500 text-white",
  todo: "bg-slate-500 text-white",
  doing: "bg-sky-500 text-white",
  done: "bg-emerald-500 text-white",
  deferred: "bg-fuchsia-500 text-white",
  draft: "bg-slate-500 text-white",
  active: "bg-emerald-500 text-white",
  obsolete: "bg-slate-500 text-white",
  Success: "bg-emerald-500 text-white",
  Failed: "bg-rose-500 text-white",
  Pending: "bg-amber-400 text-amber-950",
  "Happy Case": "bg-sky-500 text-white",
  "Unhappy Case": "bg-orange-500 text-white",
  Positive: "bg-sky-500 text-white",
  Negative: "bg-orange-500 text-white",
  pass: "bg-emerald-500 text-white",
  fail: "bg-rose-500 text-white",
  blocked: "bg-amber-500 text-white",
  available: "bg-emerald-500 text-white",
  busy: "bg-orange-500 text-white",
  on_leave: "bg-slate-500 text-white",
  completed: "bg-emerald-500 text-white",
  cancelled: "bg-rose-500 text-white",
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
