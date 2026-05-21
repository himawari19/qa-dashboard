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
  Users,
  ClockCounterClockwise,
  Headset,
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
      { href: "/test-execution", label: "Test Sessions", icon: PlayCircle },
    ],
  },
  {
    title: "Work Tracking",
    items: [
      { href: "/tasks", label: "Tasks", icon: Kanban },
      { href: "/bugs", label: "Bugs", icon: Bug },
      { href: "/sprints", label: "Sprints", icon: Kanban },
      { href: "/work-logs", label: "Work Log", icon: ClockCountdown },
    ],
  },
  {
    title: "Documentation",
    items: [
      { href: "/meeting-notes", label: "Meeting Notes", icon: Note },
      { href: "/activity-log", label: "Activity Log", icon: ClockCounterClockwise },
    ],
  },
  {
    title: "Reports",
    items: [
      { href: "/weekly-report", label: "Report", icon: ChartLineUp },
      { href: "/deployments", label: "Deployment Log", icon: RocketLaunch },
      { href: "/reports/workload", label: "Workload Heatmap", icon: Users },
      { href: "/gantt", label: "Gantt / Timeline", icon: Rows },
    ],
  },
  {
    title: "System Settings",
    items: [
      { href: "/settings", label: "Settings", icon: Gear },
      { href: "/settings/support", label: "Support", icon: Headset },
    ],
  },
];

type TooltipState = { label: string; y: number } | null;
type Notification = { id: string; type: "overdue" | "deadline"; title: string; detail: string; href: string };
type SidebarIcon = React.ComponentType<{ size?: number; weight?: "bold"; className?: string }>;
type SidebarItem = { href: string; label: string; icon: SidebarIcon };
type SidebarGroup = { title: string; items: SidebarItem[] };

const ROLE_MENU: Record<string, string[]> = {
  admin: ["/", "/dashboard", "/test-plans", "/test-suites", "/test-cases", "/test-execution", "/bugs", "/tasks", "/sprints", "/meeting-notes", "/deployments", "/activity-log", "/weekly-report", "/reports/workload", "/gantt", "/settings", "/settings/support", "/work-logs"],
  fullstack: ["/", "/dashboard", "/tasks", "/bugs", "/test-plans", "/test-suites", "/test-cases", "/test-execution", "/sprints", "/meeting-notes", "/deployments", "/activity-log", "/weekly-report", "/reports/workload", "/gantt", "/work-logs"],
  ai: ["/", "/dashboard", "/tasks", "/bugs", "/test-plans", "/test-suites", "/test-cases", "/test-execution", "/sprints", "/meeting-notes", "/deployments", "/activity-log", "/weekly-report", "/reports/workload", "/gantt", "/work-logs"],
  qa: ["/", "/dashboard", "/test-plans", "/test-suites", "/test-cases", "/test-execution", "/bugs", "/sprints", "/meeting-notes", "/deployments", "/activity-log", "/weekly-report", "/reports/workload", "/gantt", "/work-logs"],
  fe: ["/", "/dashboard", "/tasks", "/bugs", "/sprints", "/deployments", "/activity-log", "/weekly-report", "/reports/workload", "/gantt", "/work-logs"],
  be: ["/", "/dashboard", "/tasks", "/bugs", "/sprints", "/deployments", "/activity-log", "/weekly-report", "/reports/workload", "/gantt", "/work-logs"],
  pm: ["/", "/dashboard", "/tasks", "/bugs", "/test-plans", "/sprints", "/meeting-notes", "/deployments", "/activity-log", "/weekly-report", "/reports/workload", "/gantt", "/work-logs"],
};

function canSeeHref(role: string, href: string) {
  if (role === "superadmin") return true;
  const allowed = ROLE_MENU[role] || ROLE_MENU.qa;
  if (allowed.includes(href)) return true;
  if (href === "/settings") return role === "admin";
  if (href === "/settings/support") return role === "admin";
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
      <div className="bg-gray-900 px-2 py-1 text-[11px] font-medium text-white shadow-md whitespace-nowrap">
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
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
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

  const visibleNotifs = notifs.filter((n) => !dismissed.has(n.id));
  const overdueNotifs = visibleNotifs.filter((n) => n.type === "overdue");
  const deadlineNotifs = visibleNotifs.filter((n) => n.type === "deadline");

  const handleDismiss = (id: string) => {
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const handleDismissAll = () => {
    setDismissed(new Set(notifs.map((n) => n.id)));
  };

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full z-[var(--z-notification)] mt-1 w-80 overflow-hidden border border-gray-200 bg-white shadow-lg animate-in fade-in duration-100"
    >
      <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-700">Notifications</p>
        <div className="flex items-center gap-2">
          {visibleNotifs.length > 0 && (
            <button onClick={handleDismissAll} className="text-[11px] font-medium text-blue-600 hover:text-blue-800 transition">
              Dismiss all
            </button>
          )}
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition"><X size={14} weight="bold" /></button>
        </div>
      </div>
      {loading && <div className="px-4 py-6 text-xs text-gray-400 text-center">Loading…</div>}
      {!loading && visibleNotifs.length === 0 && (
        <div className="px-4 py-6 text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center bg-emerald-50 text-emerald-500">
            <Checks size={18} weight="bold" />
          </div>
          <p className="text-xs font-medium text-gray-600">All clear!</p>
          <p className="mt-0.5 text-[11px] text-gray-400">No pending alerts right now.</p>
        </div>
      )}
      {!loading && visibleNotifs.length > 0 && (
        <div className="max-h-72 overflow-y-auto">
          {overdueNotifs.length > 0 && (
            <div>
              <div className="sticky top-0 bg-white px-4 py-1.5 border-b border-gray-100">
                <span className="text-[10px] font-bold uppercase tracking-widest text-red-500">Overdue ({overdueNotifs.length})</span>
              </div>
              {overdueNotifs.map(n => (
                <div key={n.id} className="flex items-start gap-2.5 px-4 py-2.5 hover:bg-gray-50 transition group">
                  <Link href={n.href} prefetch={false} onClick={onClose} className="flex items-start gap-2.5 flex-1 min-w-0">
                    <div className="mt-0.5 shrink-0 h-5 w-5 flex items-center justify-center bg-red-100 text-red-600">
                      <WarningCircle size={12} weight="bold" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 leading-snug truncate">{n.title}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5 truncate">{n.detail}</p>
                    </div>
                  </Link>
                  <button onClick={() => handleDismiss(n.id)} className="shrink-0 opacity-0 group-hover:opacity-100 text-gray-300 hover:text-gray-500 transition p-0.5" title="Dismiss">
                    <X size={11} weight="bold" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {deadlineNotifs.length > 0 && (
            <div>
              <div className="sticky top-0 bg-white px-4 py-1.5 border-b border-gray-100">
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500">Upcoming ({deadlineNotifs.length})</span>
              </div>
              {deadlineNotifs.map(n => (
                <div key={n.id} className="flex items-start gap-2.5 px-4 py-2.5 hover:bg-gray-50 transition group">
                  <Link href={n.href} prefetch={false} onClick={onClose} className="flex items-start gap-2.5 flex-1 min-w-0">
                    <div className="mt-0.5 shrink-0 h-5 w-5 flex items-center justify-center bg-amber-100 text-amber-600">
                      <ClockCountdown size={12} weight="bold" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 leading-snug truncate">{n.title}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5 truncate">{n.detail}</p>
                    </div>
                  </Link>
                  <button onClick={() => handleDismiss(n.id)} className="shrink-0 opacity-0 group-hover:opacity-100 text-gray-300 hover:text-gray-500 transition p-0.5" title="Dismiss">
                    <X size={11} weight="bold" />
                  </button>
                </div>
              ))}
            </div>
          )}
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
        "group relative flex h-9 items-center text-[13px] font-medium transition-colors duration-100 outline-none",
        collapsed ? "justify-center px-0" : "gap-2.5 px-3",
        active
          ? "bg-blue-50 text-blue-700 font-semibold"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
      )}
    >
      {active && <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-blue-600" />}
      <Icon
        size={16}
        weight="bold"
        className={cn(
          "shrink-0 transition-colors",
          active ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600",
          collapsed ? "mx-auto" : "",
        )}
      />
      <span className={cn("overflow-hidden whitespace-nowrap transition-all duration-150", collapsed ? "opacity-0 w-0" : "opacity-100 w-auto")}>
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
            "px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400 transition-all duration-150 whitespace-nowrap overflow-hidden",
            collapsed ? "opacity-0 h-0" : "opacity-100 h-auto mt-4",
          )}
        >
          {group.title}
        </div>
      )}
      <div className="space-y-px">
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
        "flex h-9 w-full items-center text-[13px] font-medium transition-colors duration-100",
        tone,
        collapsed ? "justify-center px-0" : "gap-2.5 px-3",
      )}
    >
      {icon}
      <span className={cn("overflow-hidden whitespace-nowrap transition-all duration-150", collapsed ? "opacity-0 w-0" : "opacity-100 w-auto")}>
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
    setTooltip({ label, y: rect.top + rect.height / 2 - 12 });
  }
  function hideTooltip() { setTooltip(null); }

  return (
    <>
      <SidebarTooltip tooltip={tooltip} />

      <aside
        suppressHydrationWarning
        className={cn(
          "fixed inset-y-0 left-0 top-0 z-[var(--z-sidebar)] flex h-full border-r border-[var(--border-color)] bg-white transition-all duration-150 ease-in-out",
          collapsed ? "w-[64px]" : "w-[240px]",
        )}
      >
        <div className="flex w-full flex-col">
          {/* Logo */}
          <div className={cn("border-b border-gray-100 px-4 py-3 flex items-center gap-2.5", collapsed ? "justify-center" : "")}>
            <BrandMark
              compact
              showLabel={!collapsed}
              labelClassName={cn(
                "transition-all duration-150 origin-left",
                collapsed ? "opacity-0 scale-0 w-0 overflow-hidden" : "opacity-100 scale-100 w-auto"
              )}
            />
          </div>

          {/* Nav */}
          <div className={cn("flex-1 overflow-y-auto py-2", collapsed ? "px-1" : "px-0")}>
            <nav className="space-y-1">
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
          <div className={cn("mt-auto border-t border-gray-100 py-2", collapsed ? "px-1" : "px-0")}>
            <SidebarActionButton
              collapsed={collapsed}
              onClick={onToggle}
              onMouseEnter={(e) => showTooltip(e, collapsed ? "Expand" : "")}
              onMouseLeave={hideTooltip}
              tone="text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              icon={collapsed ? <CaretRight size={16} weight="bold" /> : <CaretLeft size={16} weight="bold" />}
              label="Collapse"
            />
          </div>
        </div>
      </aside>
    </>
  );
}
