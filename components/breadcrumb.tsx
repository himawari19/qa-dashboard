import Link from "next/link";
import { cn } from "@/lib/utils";

type Crumb = { label: string; href?: string };

export function Breadcrumb({ crumbs, className }: { crumbs: Crumb[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={cn("mb-4 flex items-center gap-1.5 text-xs font-semibold text-slate-500", className)}>
      {crumbs.map((crumb, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-slate-300" aria-hidden>›</span>}
          {crumb.href ? (
            <Link href={crumb.href} className="transition hover:text-sky-700">
              {crumb.label}
            </Link>
          ) : (
            <span className="text-slate-800">{crumb.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
