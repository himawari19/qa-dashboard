import Image from "next/image";
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
      <Image
        src="/logo.svg"
        alt="QA Daily Hub"
        width={compact ? 32 : 40}
        height={compact ? 32 : 40}
        className="shrink-0"
        priority
      />

      {showLabel && (
        <div className={cn("flex flex-col leading-none", labelClassName)}>
          <span className={cn("text-sm font-bold tracking-tight text-gray-900", titleClassName)}>QA Daily Hub</span>
          <span className={cn("mt-1 text-[11px] font-bold uppercase tracking-[0.32em] text-gray-500", subtitleClassName)}>
            Quality Ops
          </span>
        </div>
      )}
    </div>
  );
}
