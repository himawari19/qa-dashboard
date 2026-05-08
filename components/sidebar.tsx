"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import {
  Bug,
  CaretLeft,
  CaretRight,
  Checks,
  Kanban,
  Note,
  SquaresFour,
  Table,
  ClipboardText,
  PlayCircle,
  Gear,
  Rows,
  X,
  WarningCircle,
  ClockCountdown,
  ChartLineUp,
  RocketLaunch,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { createPortal } from "react-dom";
import { normalizeRole } from "@/lib/roles";
import { BrandMark } from "@/components/brand-mark";

const groups: SidebarGroup[] = [
  {
    title: "",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: SquaresFour },
    ],
  },
  {
    title: "Test Management",
    items: [
      { href: "/test-plans", label: "Test Plans", icon: ClipboardText },
      { href: "/test-suites", label: "Test Suites", icon: Table },
      { href: "/test-cases", label: "Test Cases", icon: Checks },
      { href: "/test-execution", label: "Test Execution", icon: PlayCircle },
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
      { href: "/deployments", label: "Deployment Log", icon: RocketLaunch },
    ],
  },
  {
    title: "Reports",
    items: [
      { href: "/weekly-report", label: "Weekly Report", icon: ChartLineUp },
      { href: "/gantt", label: "Gantt / Timeline", icon: Rows },
    ],
  },
  {
    title: "System Settings",
    items: [
      { href: "/settings", label: "Settings", icon: Gear },
    ],
  },
];

type TooltipState = { label: string; y: number } | null;
type Notification = { id: string; type: "overdue" | "deadline"; title: string; detail: string; href: string };
type SidebarIcon = React.ComponentType<{ size?: number; weight?: "bold"; className?: string }>;
type SidebarItem = { href: string; label: string; icon: SidebarIcon };
type SidebarGroup = { title: string; items: SidebarItem[] };

const ROLE_MENU: Record<string, string[]> = {
  admin: ["/", "/dashboard", "/test-plans", "/test-suites", "/test-cases", "/test-execution", "/bugs", "/tasks", "/sprints", "/meeting-notes", "/deployments", "/weekly-report", "/gantt", "/settings"],
  fullstack: ["/", "/dashboard", "/tasks", "/bugs", "/test-plans", "/test-suites", "/test-cases", "/test-execution", "/sprints", "/meeting-notes", "/deployments", "/weekly-report", "/gantt"],
  ai: ["/", "/dashboard", "/tasks", "/bugs", "/test-plans", "/test-suites", "/test-cases", "/test-execution", "/sprints", "/meeting-notes", "/deployments", "/weekly-report", "/gantt"],
  qa: ["/", "/dashboard", "/test-plans", "/test-suites", "/test-cases", "/test-execution", "/bugs", "/sprints", "/meeting-notes", "/weekly-report", "/gantt"],
  fe: ["/", "/dashboard", "/tasks", "/bugs", "/sprints", "/deployments", "/weekly-report", "/gantt"],
  be: ["/", "/dashboard", "/tasks", "/bugs", "/sprints", "/deployments", "/weekly-report", "/gantt"],
  pm: ["/", "/dashboard", "/tasks", "/bugs", "/test-plans", "/sprints", "/meeting-notes", "/deployments", "/weekly-report", "/gantt"],
};

function canSeeHref(role: string, href: string) {
  const allowed = ROLE_MENU[role] || ROLE_MENU.qa;
  if (allowed.includes(href)) return true;
  if (href === "/settings") return role === "admin";
  return false;
}

function filterGroups(role: string) {
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => canSeeHref(role, item.href)),
    }))
    .filter((group) => group.items.length > 0);
}

function SidebarTooltip({ tooltip }: { tooltip: TooltipState }) {
  if (!tooltip) return null;
  return createPortal(
    <div
      className="pointer-events-none fixed z-[var(--z-tooltip)] flex items-center"
      style={{ top: tooltip.y, left: "calc(var(--sidebar-collapsed) + 4px)" }}
    >
      <div className="rounded-md bg-slate-900 dark:bg-slate-700 px-2.5 py-1.5 text-xs font-semibold text-white shadow-xl whitespace-nowrap">
        <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900 dark:border-r-slate-700" />
        {tooltip.label}
      </div>
    </div>,
    document.body
  );
}

export function NotificationPanel({
  onClose,
  anchorRef,
}: {
  onClose: () => void;
  anchorRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/notifications")
      .then(r => r.json())
      .then(d => { setNotifs(d.notifications || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (ref.current?.contains(target)) return;
      if (anchorRef?.current?.contains(target)) return;
      onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [anchorRef, onClose]);

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full z-[var(--z-notification)] mt-2 w-80 overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-slate-200 animate-in fade-in slide-in-from-top-2 duration-150 dark:bg-slate-900 dark:ring-white/10"
    >
      <div className="px-4 py-3 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
        <p className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-white">Notifications</p>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition"><X size={13} weight="bold" /></button>
      </div>
      {loading && <div className="px-4 py-6 text-xs text-slate-400 text-center animate-pulse">Loading…</div>}
      {!loading && notifs.length === 0 && (
        <div className="px-4 py-6 text-xs text-slate-400 text-center">No alerts — everything looks good!</div>
      )}
      {!loading && notifs.length > 0 && (
        <div className="divide-y divide-slate-100 dark:divide-white/5 max-h-80 overflow-y-auto">
          {notifs.map(n => (
            <Link
              key={n.id}
              href={n.href}
              prefetch={false}
              onClick={onClose}
              className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/5 transition group"
            >
              <div className={cn("mt-0.5 shrink-0 h-6 w-6 rounded-md flex items-center justify-center",
                n.type === "overdue" ? "bg-red-100 dark:bg-red-900/30 text-red-600" : "bg-amber-100 dark:bg-amber-900/30 text-amber-600"
              )}>
                {n.type === "overdue" ? <WarningCircle size={13} weight="bold" /> : <ClockCountdown size={13} weight="bold" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-800 dark:text-white leading-snug truncate">{n.title}</p>
                <p className="text-xs text-slate-400 mt-0.5 truncate">{n.detail}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function SidebarNavItem({
  item,
  pathname,
  collapsed,
  showTooltip,
  hideTooltip,
}: {
  item: SidebarItem;
  pathname: string;
  collapsed: boolean;
  showTooltip: (e: React.MouseEvent<HTMLElement>, label: string) => void;
  hideTooltip: () => void;
}) {
  const Icon = item.icon;
  const linkRef = useRef<HTMLAnchorElement | null>(null);
  const isSuiteExecutionRoute = pathname.startsWith("/test-execution");
  const active =
    pathname === item.href ||
    (item.href !== "/test-suites" && pathname.startsWith(`${item.href}/`)) ||
    (item.href === "/test-cases" && pathname.startsWith("/test-cases/")) ||
    (item.href === "/test-plans" && pathname.startsWith("/test-plans/projects/")) ||
    (item.href === "/test-suites" && pathname.startsWith("/test-suites/") && !isSuiteExecutionRoute) ||
    (item.href === "/test-execution" && isSuiteExecutionRoute);

  useEffect(() => {
    if (!active) return;
    const node = linkRef.current;
    if (!node) return;
    const timer = window.setTimeout(() => {
      node.scrollIntoView({ block: "center", behavior: "smooth" });
    }, 50);
    return () => window.clearTimeout(timer);
  }, [active, pathname]);

  return (
    <Link
      ref={linkRef}
      href={item.href}
      prefetch={false}
      onMouseEnter={(e) => showTooltip(e, item.label)}
      onMouseLeave={hideTooltip}
      className={cn(
        "group relative flex h-10 items-center rounded-md text-sm font-semibold transition-all duration-200",
        collapsed ? "justify-center px-0" : "gap-3 px-3",
        active
          ? "bg-sky-500/15 text-sky-700 ring-1 ring-sky-300/40 dark:bg-sky-400/10 dark:text-sky-300 dark:ring-sky-500/30"
          : "text-slate-600 dark:text-slate-400 hover:bg-sky-100 hover:text-sky-800 dark:hover:bg-white/10 dark:hover:text-white",
      )}
    >
      {active && !collapsed && <div className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-sky-600 shadow-[0_0_10px_rgba(14,165,233,0.7)]" />}
      <Icon
        size={18}
        weight="bold"
        className={cn(
          "transition-transform duration-200 group-hover:scale-110",
          active ? "text-sky-600 dark:text-sky-400" : "text-slate-400 dark:text-slate-500",
          collapsed ? "mx-auto" : "shrink-0",
        )}
      />
      <span className={cn("overflow-hidden whitespace-nowrap transition-all duration-300", collapsed ? "opacity-0 w-0" : "opacity-100 w-auto")}>
        {item.label}
      </span>
    </Link>
  );
}

function SidebarSection({
  group,
  pathname,
  collapsed,
  showTooltip,
  hideTooltip,
}: {
  group: SidebarGroup;
  pathname: string;
  collapsed: boolean;
  showTooltip: (e: React.MouseEvent<HTMLElement>, label: string) => void;
  hideTooltip: () => void;
}) {
  return (
    <div>
      {group.title && (
        <div
          className={cn(
            "px-3 pb-1.5 text-xs font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600 transition-all duration-300 whitespace-nowrap overflow-hidden",
            collapsed ? "opacity-0 h-0" : "opacity-100 h-auto mt-2",
          )}
        >
          {group.title}
        </div>
      )}
      <div className="space-y-0.5">
        {group.items.map((item) => (
          <SidebarNavItem
            key={item.href}
            item={item}
            pathname={pathname}
            collapsed={collapsed}
            showTooltip={showTooltip}
            hideTooltip={hideTooltip}
          />
        ))}
      </div>
    </div>
  );
}

function SidebarActionButton({
  collapsed,
  onClick,
  onMouseEnter,
  onMouseLeave,
  tone,
  icon,
  label,
}: {
  collapsed: boolean;
  onClick: () => void;
  onMouseEnter: (e: React.MouseEvent<HTMLElement>) => void;
  onMouseLeave: () => void;
  tone: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={cn(
        "flex h-10 w-full items-center rounded-md text-sm font-semibold transition-all duration-200",
        tone,
        collapsed ? "justify-center px-0" : "gap-3 px-3",
      )}
    >
      {icon}
      <span className={cn("overflow-hidden whitespace-nowrap transition-all duration-300", collapsed ? "opacity-0 w-0" : "opacity-100 w-auto")}>
        {label}
      </span>
    </button>
  );
}

export function Sidebar({
  collapsed,
  onToggle,
  onLogout,
  userRole = "",
}: {
  collapsed: boolean;
  onToggle: () => void;
  onLogout?: () => void;
  userRole?: string;
}) {
  const pathname = usePathname();
  const [tooltip, setTooltip] = useState<TooltipState>(null);
  const role = normalizeRole(userRole);
  const visibleGroups = filterGroups(role);

  function showTooltip(e: React.MouseEvent<HTMLElement>, label: string) {
    if (!collapsed) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setTooltip({ label, y: rect.top + rect.height / 2 - 14 });
  }
  function hideTooltip() { setTooltip(null); }

  return (
    <>
      <SidebarTooltip tooltip={tooltip} />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 top-0 z-[var(--z-sidebar)] flex h-full border-r border-slate-200/50 dark:border-white/5 bg-white/70 dark:bg-black/40 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] backdrop-blur-xl",
          collapsed ? "w-[72px]" : "w-[240px]",
        )}
      >
        <div className="flex w-full flex-col">
          {/* Logo */}
          <div className={cn("border-b border-slate-100/50 dark:border-white/5 p-4 flex items-center gap-3", collapsed ? "justify-center" : "")}>
            <BrandMark
              compact
              showLabel={!collapsed}
              labelClassName={cn(
                "transition-all duration-300 origin-left",
                collapsed ? "opacity-0 scale-0 w-0 overflow-hidden" : "opacity-100 scale-100 w-auto"
              )}
            />
          </div>

          {/* Nav */}
          <div className={cn("flex-1 overflow-y-auto py-2 space-y-4 scrollbar-thin", collapsed ? "px-2" : "px-3")}>
            <nav className="space-y-4">
              {visibleGroups.map((group) => (
                <SidebarSection
                  key={group.title || "dashboard"}
                  group={group}
                  pathname={pathname}
                  collapsed={collapsed}
                  showTooltip={showTooltip}
                  hideTooltip={hideTooltip}
                />
              ))}
            </nav>
          </div>

          {/* Bottom actions */}
          <div className={cn("mt-auto space-y-0.5 border-t border-slate-100 dark:border-white/5 pt-2", collapsed ? "p-2" : "p-3")}>
            <SidebarActionButton
              collapsed={collapsed}
              onClick={onToggle}
              onMouseEnter={(e) => showTooltip(e, collapsed ? "Expand Menu" : "")}
              onMouseLeave={hideTooltip}
              tone="text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5"
              icon={collapsed ? <CaretRight size={18} weight="bold" /> : <CaretLeft size={18} weight="bold" />}
              label="Collapse Menu"
            />

          </div>
        </div>
      </aside>
    </>
  );
}
