import { cn } from "@/lib/utils";

const toneMap = {
  P0: "bg-rose-500 text-white",
  P1: "bg-orange-500 text-white",
  P2: "bg-amber-300 text-amber-950",
  P3: "bg-sky-400 text-sky-950",
  critical: "bg-rose-700 text-white",
  high: "bg-rose-500 text-white",
  medium: "bg-amber-300 text-amber-950",
  low: "bg-emerald-300 text-emerald-950",
  open: "bg-rose-200 text-rose-950",
  in_progress: "bg-sky-300 text-sky-950",
  ready_to_retest: "bg-orange-300 text-orange-950",
  closed: "bg-emerald-300 text-emerald-950",
  rejected: "bg-slate-300 text-slate-900",
  todo: "bg-slate-300 text-slate-900",
  doing: "bg-sky-300 text-sky-950",
  done: "bg-emerald-300 text-emerald-950",
  deferred: "bg-fuchsia-200 text-fuchsia-950",
  draft: "bg-slate-300 text-slate-900",
  active: "bg-emerald-300 text-emerald-950",
  obsolete: "bg-slate-300 text-slate-900",
  Success: "bg-emerald-500 text-white",
  Failed: "bg-rose-500 text-white",
  Pending: "bg-amber-300 text-amber-950",
  "Happy Case": "bg-sky-400 text-sky-950",
  "Unhappy Case": "bg-orange-400 text-white",
  Positive: "bg-sky-500 text-white",
  Negative: "bg-orange-500 text-white",
} as const;

export function Badge({ value }: { value: string }) {
  return (
    <span
      className={cn(
        "inline-flex min-w-[100px] justify-center rounded-full px-4 py-1 text-[10px] font-bold uppercase tracking-widest shadow-sm border border-black/5",
        toneMap[value as keyof typeof toneMap] ?? "bg-slate-200 text-slate-800",
      )}
    >
      {value}
    </span>
  );
}
