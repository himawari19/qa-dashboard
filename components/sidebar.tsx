"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bug,
  CaretLeft,
  CaretRight,
  Checks,
  Kanban,
  ChartLineUp,
  Note,
  File,
  SquaresFour,
  Table,
  GlobeSimple,
  Users,
  Speedometer,
  ShieldCheck,
  Lock,
  ClipboardText,
  PlayCircle,
  ListChecks,
  Wrench
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const groups = [
  {
    title: "Dashboard",
    items: [
      { href: "/", label: "Main Dashboard", icon: SquaresFour },
      { href: "/reports/executive", label: "Executive Summary", icon: ShieldCheck },
      { href: "/reports", label: "Visual Reports", icon: ChartLineUp },
    ],
  },
  {
    title: "Team & Ops",
    items: [
      { href: "/workload", label: "Workload", icon: Users },
      { href: "/tasks", label: "QA Tasks", icon: Kanban },
      { href: "/daily-logs", label: "Daily Logs", icon: File },
      { href: "/meeting-notes", label: "Meeting Notes", icon: Note },
    ],
  },
  {
    title: "Testing",
    items: [
      { href: "/test-plans", label: "Test Plans", icon: ClipboardText },
      { href: "/test-suites", label: "Test Suites", icon: Table },
      { href: "/test-sessions", label: "Exec Sessions", icon: PlayCircle },
      { href: "/test-case-management", label: "Test Cases", icon: Checks },
      { href: "/checklists", label: "Checklists", icon: ListChecks },
    ],
  },
  {
    title: "QA Assets",
    items: [
      { href: "/bugs", label: "Bug Register", icon: Bug },
      { href: "/api-inventory", label: "API Inventory", icon: GlobeSimple },
      { href: "/env-config", label: "Env Config", icon: Lock },
    ],
  },
  {
    title: "Analysis",
    items: [
      { href: "/reports/rtm", label: "RTM Matrix", icon: Table },
      { href: "/performance", label: "Performance", icon: Speedometer },
      { href: "/tools", label: "QA Toolbox", icon: Wrench },
    ],
  },
];

export function Sidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 top-0 z-40 flex border-r border-slate-300 bg-[#f7fafc] transition-all duration-200",
        collapsed ? "w-[72px]" : "w-[240px]",
      )}
    >
      <div className="flex w-full flex-col">
        <div className="flex h-12 items-center border-b border-slate-300 px-4">
          <div
            className={cn(
              "overflow-hidden transition-all duration-200",
              collapsed ? "w-0 opacity-0" : "w-auto opacity-100",
            )}
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.34em] text-sky-700">QA DAILY</p>
            <p className="text-sm font-bold text-slate-900">QA Hub</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-3">
          <nav className="space-y-4">
            {groups.map((group) => (
              <div key={group.title}>
                <div
                  className={cn(
                    "px-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500",
                    collapsed && "opacity-0",
                  )}
                >
                  {collapsed ? "" : group.title}
                </div>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = pathname === item.href;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        title={item.label}
                        aria-label={item.label}
                        className={cn(
                          "flex h-11 items-center rounded-2xl text-sm font-semibold transition-all duration-200",
                          collapsed ? "justify-center px-0" : "gap-3 px-3",
                          active
                            ? "bg-sky-700 text-white shadow-sm"
                            : "text-slate-700 hover:bg-slate-200 hover:text-slate-900",
                        )}
                      >
                        <Icon className="h-[18px] w-[18px] shrink-0" />
                        <span
                          className={cn(
                            "overflow-hidden whitespace-nowrap transition-all duration-200",
                            collapsed ? "w-0 opacity-0" : "w-auto opacity-100",
                          )}
                        >
                          {item.label}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        <div className="border-t border-slate-300 p-2">
          <button
            type="button"
            onClick={onToggle}
            className={cn(
              "flex h-9 w-full items-center rounded text-sm font-semibold text-[#304b63] transition hover:bg-[#e6eef5] hover:text-slate-900",
              collapsed ? "justify-center px-0" : "gap-3 px-3",
            )}
          >
            {collapsed ? (
              <CaretRight size={18} weight="bold" className="shrink-0" />
            ) : (
              <CaretLeft size={18} weight="bold" className="shrink-0" />
            )}
            <span
              className={cn(
                "overflow-hidden whitespace-nowrap transition-all duration-200",
                collapsed ? "w-0 opacity-0" : "w-auto opacity-100",
              )}
            >
              {collapsed ? "" : "Hide Menu"}
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
}
