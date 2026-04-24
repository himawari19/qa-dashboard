"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
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
  SignOut,
  Wrench,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const groups = [
  {
    title: "Quick Access",
    items: [
      { href: "/", label: "Dashboard", icon: SquaresFour },
      { href: "/test-plans", label: "Test Plans", icon: ClipboardText },
      { href: "/test-suites", label: "Test Suites", icon: Table },
      { href: "/test-sessions", label: "Test Execution", icon: PlayCircle },
    ],
  },
  {
    title: "Work",
    items: [
      { href: "/bugs", label: "Bugs", icon: Bug },
      { href: "/tasks", label: "Tasks", icon: Kanban },
      { href: "/daily-logs", label: "Daily Logs", icon: File },
      { href: "/meeting-notes", label: "Meeting Notes", icon: Note },
      { href: "/activity-log", label: "Activity Log", icon: ClipboardText },
      { href: "/workload", label: "Workload", icon: Users },
    ],
  },
  {
    title: "Testing",
    items: [
      { href: "/reports/executive", label: "Executive Summary", icon: ShieldCheck },
      { href: "/reports", label: "Visual Reports", icon: ChartLineUp },
      { href: "/reports/rtm", label: "RTM Matrix", icon: Table },
      { href: "/api-testing", label: "API Testing", icon: GlobeSimple },
      { href: "/env-config", label: "Env Config", icon: Lock },
    ],
  },
  {
    title: "Assets",
    items: [
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
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/login");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 top-0 z-40 flex border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-200",
        collapsed ? "w-[72px]" : "w-[240px]",
      )}
    >
      <div className="flex w-full flex-col">
        <div className="border-b border-slate-100 dark:border-slate-800 p-2">
          <button
            type="button"
            onClick={onToggle}
            className={cn(
              "flex h-9 w-full items-center rounded-xl text-sm font-semibold text-slate-500 dark:text-slate-400 transition hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100",
              collapsed ? "justify-center px-0" : "gap-3 px-3",
            )}
          >
            {collapsed ? (
              <CaretRight size={18} weight="bold" className="shrink-0" />
            ) : (
              <CaretLeft size={18} weight="bold" className="shrink-0" />
            )}
            <span className={cn("overflow-hidden whitespace-nowrap transition-all duration-200", collapsed ? "w-0 opacity-0" : "w-auto opacity-100")}>
              Hide Menu
            </span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-3">
          <nav className="space-y-3">
            {groups.map((group) => (
              <div key={group.title}>
                <div className={cn("px-3 pb-1 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-600", collapsed && "opacity-0")}>
                  {collapsed ? "" : group.title}
                </div>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

                    return (
                      <div key={item.href} className="relative group/tooltip">
                        <Link
                          href={item.href}
                          className={cn(
                            "relative flex h-10 items-center rounded-xl text-sm font-semibold transition-all duration-150",
                            collapsed ? "justify-center px-0" : "gap-3 px-3",
                            active
                              ? "bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-400"
                              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100",
                          )}
                        >
                          {active && !collapsed && <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-sky-600 dark:bg-sky-400" />}
                          <Icon className={cn("h-[17px] w-[17px] shrink-0", active ? "text-sky-600 dark:text-sky-400" : "text-slate-400 dark:text-slate-500")} />
                          <span className={cn("overflow-hidden whitespace-nowrap transition-all duration-200", collapsed ? "w-0 opacity-0" : "w-auto opacity-100")}>
                            {item.label}
                          </span>
                        </Link>
                        {collapsed && (
                          <div className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover/tooltip:opacity-100">
                            {item.label}
                            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        <div className="border-t border-slate-100 dark:border-slate-800 p-2">
          <div className="relative group/tooltip">
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className={cn(
                "flex h-9 w-full items-center rounded-xl text-sm font-semibold transition",
                "text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 dark:hover:text-rose-300",
                "disabled:cursor-not-allowed disabled:opacity-60",
                collapsed ? "justify-center px-0" : "gap-3 px-3",
              )}
            >
              <SignOut size={18} weight="bold" className="shrink-0" />
              <span className={cn("overflow-hidden whitespace-nowrap transition-all duration-200", collapsed ? "w-0 opacity-0" : "w-auto opacity-100")}>
                {loggingOut ? "Logging out..." : "Logout"}
              </span>
            </button>
            {collapsed && (
              <div className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover/tooltip:opacity-100">
                Logout
                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
