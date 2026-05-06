import { ShieldCheck } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

type BrandMarkProps = {
  className?: string;
  labelClassName?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  showLabel?: boolean;
  compact?: boolean;
};

export function BrandMark({
  className,
  labelClassName,
  titleClassName,
  subtitleClassName,
  showLabel = true,
  compact = false,
}: BrandMarkProps) {
  return (
    <div className={cn("inline-flex items-center gap-3", className)}>
      <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-sky-700 to-cyan-400 shadow-[0_18px_40px_rgba(15,23,42,0.28)] ring-1 ring-white/20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.42),transparent_45%)]" />
        <div className="absolute inset-[7px] rounded-xl border border-white/15" />
        <ShieldCheck size={compact ? 18 : 22} weight="bold" className="relative text-white drop-shadow" />
      </div>

      {showLabel && (
        <div className={cn("flex flex-col leading-none", labelClassName)}>
          <span className={cn("text-sm font-black tracking-tight text-slate-900 dark:text-white", titleClassName)}>QA Daily Hub</span>
          <span className={cn("mt-1 text-[10px] font-bold uppercase tracking-[0.32em] text-slate-500 dark:text-slate-400", subtitleClassName)}>
            Quality Ops
          </span>
        </div>
      )}
    </div>
  );
}
