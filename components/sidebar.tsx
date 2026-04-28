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
  Speedometer,
  ShieldCheck,
  Lock,
  ClipboardText,
  PlayCircle,
  SignOut,
  Wrench,
  Calendar,
  Gear,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const groups = [
  {
    title: "",
    items: [
      { href: "/", label: "Dashboard", icon: SquaresFour },
    ],
  },
  {
    title: "Test Management",
    items: [
      { href: "/test-plans", label: "Test Plans", icon: ClipboardText },
      { href: "/test-suites", label: "Test Suites", icon: Table },
      { href: "/test-execution", label: "Test Execution", icon: PlayCircle },
      { href: "/calendar", label: "Shared Calendar", icon: Calendar },
    ],
  },
  {
    title: "Defects & Tasks",
    items: [
      { href: "/bugs", label: "Bugs", icon: Bug },
      { href: "/tasks", label: "Tasks", icon: Kanban },
    ],
  },
  {
    title: "Documentation",
    items: [
      { href: "/sprints", label: "Sprints", icon: Kanban },
      { href: "/meeting-notes", label: "Meeting Notes", icon: Note },
    ],
  },
  {
    title: "System Settings",
    items: [
      { href: "/settings", label: "Settings", icon: Gear },
    ],
  },
];

export function Sidebar({
  collapsed,
  onToggle,
  onLogout,
}: {
  collapsed: boolean;
  onToggle: () => void;
  onLogout?: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 top-0 z-40 flex h-full border-r border-slate-200/50 dark:border-white/5 bg-white/70 dark:bg-black/40 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] backdrop-blur-xl",
        collapsed ? "w-[72px]" : "w-[240px]",
      )}
    >
      <div className="flex w-full flex-col">
        <div className="border-b border-slate-100/50 dark:border-white/5 p-4 flex items-center gap-3">
            <div className="h-8 w-8 rounded-md bg-gradient-to-br from-blue-600 to-sky-500 flex items-center justify-center shadow-lg shadow-blue-500/30 shrink-0">
               <ShieldCheck size={20} weight="bold" className="text-white" />
            </div>
            <span className={cn(
              "font-bold text-lg tracking-tight text-slate-800 dark:text-white transition-all duration-300 origin-left",
              collapsed ? "opacity-0 scale-0 w-0 overflow-hidden" : "opacity-100 scale-100 w-auto"
            )}>
              QA Daily
            </span>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin">
          <nav className="space-y-6">
            {groups.map((group, idx) => (
              <div key={idx}>
                {group.title && (
                  <div className={cn(
                    "px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600 transition-all duration-300 whitespace-nowrap overflow-hidden",
                    collapsed ? "opacity-0 h-0" : "opacity-100 h-auto mt-2"
                  )}>
                    {group.title}
                  </div>
                )}
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = pathname === item.href || 
                                   pathname.startsWith(`${item.href}/`) ||
                                   (item.href === "/test-plans" && pathname.startsWith("/test-cases"));

                    return (
                      <div key={item.href} className="relative group/tooltip">
                        <Link
                          href={item.href}
                          className={cn(
                            "group relative flex h-11 items-center rounded-md text-sm font-semibold transition-all duration-300",
                            collapsed ? "justify-center px-0" : "gap-0 px-3",
                            active
                              ? "bg-sky-500/10 text-sky-600 dark:text-sky-400 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]"
                              : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white",
                          )}
                        >
                          {active && !collapsed && <div className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-sky-600 shadow-[0_0_8px_rgba(14,165,233,0.6)]" />}
                          <Icon 
                            size={20} 
                            weight="bold" 
                            className={cn(
                              "transition-transform duration-200 group-hover:scale-110", 
                              active ? "text-sky-600 dark:text-sky-400" : "text-slate-400 dark:text-slate-500",
                              collapsed ? "mx-auto" : "shrink-0"
                            )} 
                          />
                          <span className={cn(
                            "ml-3 overflow-hidden whitespace-nowrap transition-all duration-300",
                            collapsed ? "opacity-0 w-0 ml-0" : "opacity-100 w-auto"
                          )}>
                            {item.label}
                          </span>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        <div className="p-3 mt-auto space-y-1">
          <button
            type="button"
            onClick={onToggle}
            className={cn(
              "flex h-11 w-full items-center rounded-md text-sm font-semibold text-slate-500 dark:text-slate-400 transition hover:bg-slate-50 dark:hover:bg-white/5",
              collapsed ? "justify-center px-0" : "gap-3 px-3",
            )}
          >
            {collapsed ? (
              <CaretRight size={20} weight="bold" />
            ) : (
              <CaretLeft size={20} weight="bold" />
            )}
            <span className={cn(
              "ml-3 overflow-hidden whitespace-nowrap transition-all duration-300",
              collapsed ? "opacity-0 w-0 ml-0" : "opacity-100 w-auto"
            )}>
              Collapse Menu
            </span>
          </button>
          
          <button
            type="button"
            onClick={onLogout}
            className={cn(
              "flex h-11 w-full items-center rounded-md text-sm font-semibold transition-all duration-200",
              "text-rose-500 dark:text-rose-400 hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-300",
              collapsed ? "justify-center px-0" : "gap-3 px-3",
            )}
          >
            <SignOut size={20} weight="bold" className="shrink-0" />
            <span className={cn(
              "ml-3 overflow-hidden whitespace-nowrap transition-all duration-300",
              collapsed ? "opacity-0 w-0 ml-0" : "opacity-100 w-auto"
            )}>
              Logout
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
}
