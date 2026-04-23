"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Bug,
  CaretLeft,
  CaretRight,
  CaretDown,
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
  FileText,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

type Scenario = { id: string; title: string; testPlanId: string };

const groups = [
  {
    title: "Quick Access",
    items: [
      { href: "/", label: "Dashboard", icon: SquaresFour },
      { href: "/test-plans", label: "Test Plans", icon: ClipboardText },
      { href: "/test-suites", label: "Test Suites", icon: Table },
      { href: "/test-case-management", label: "Test Cases", icon: Checks, hasSubmenu: true },
      { href: "/test-sessions", label: "Exec Sessions", icon: PlayCircle },
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
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [submenuOpen, setSubmenuOpen] = useState(
    pathname.startsWith("/test-case-management")
  );

  useEffect(() => {
    fetch("/api/test-cases/scenarios")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setScenarios(data as Scenario[]);
        }
      })
      .catch(() => {});
  }, [pathname]);

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
                    const hasSubmenu = (item as any).hasSubmenu;
                    const active = pathname === item.href || (hasSubmenu && pathname.startsWith(item.href));

                    return (
                      <div key={item.href}>
                        {hasSubmenu && !collapsed ? (
                          <button
                            type="button"
                            onClick={() => setSubmenuOpen((v) => !v)}
                            className={cn(
                              "relative flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-all duration-150",
                              active
                                ? "bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-400"
                                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100",
                            )}
                          >
                            {active && <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-sky-600 dark:bg-sky-400" />}
                            <Icon className={cn("h-[17px] w-[17px] shrink-0", active ? "text-sky-600 dark:text-sky-400" : "text-slate-400 dark:text-slate-500")} />
                            <span className="flex-1 text-left overflow-hidden whitespace-nowrap">{item.label}</span>
                            <CaretDown
                              size={12}
                              weight="bold"
                              className={cn("shrink-0 transition-transform duration-200 text-slate-400", submenuOpen && "rotate-180")}
                            />
                          </button>
                        ) : (
                          <div className="relative group/tooltip">
                            <Link
                              href={item.href}
                              title={item.label}
                              aria-label={item.label}
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
                        )}

                        {/* Test Cases submenu */}
                        {hasSubmenu && !collapsed && submenuOpen && (
                          <div className="ml-4 mt-1 max-h-[160px] overflow-y-auto space-y-0.5 pr-1">
                            <Link
                              href="/test-case-management"
                              className={cn(
                                "flex h-8 items-center gap-2 rounded-lg px-3 text-xs font-semibold transition",
                                pathname === "/test-case-management"
                                  ? "bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-400"
                                  : "text-slate-500 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200",
                              )}
                            >
                              <FileText size={13} className="shrink-0" />
                              All Scenarios
                            </Link>
                            {scenarios.map((s) => (
                              <Link
                                key={s.id}
                                href={`/test-case-management/${s.id}`}
                                title={s.title}
                                className={cn(
                                  "flex h-8 items-center gap-2 rounded-lg px-3 text-xs font-semibold transition",
                                  pathname === `/test-case-management/${s.id}`
                                    ? "bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-400"
                                    : "text-slate-500 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200",
                                )}
                              >
                                <FileText size={13} className="shrink-0 opacity-60" />
                                <span className="truncate">{s.title}</span>
                              </Link>
                            ))}
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
