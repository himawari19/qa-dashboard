"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Sidebar } from "./sidebar";
import { GlobalSearch } from "./global-search";
import { NotificationPanel } from "./sidebar";
import { Bell, CaretDown, Gear, List, Moon, SignOut, Sun, UserCircle } from "@phosphor-icons/react";
import { ConfirmModal } from "./ui/confirm-modal";
import { cn } from "@/lib/utils";

export function AppWrapper({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const [user, setUser] = useState<any | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement | null>(null);
  const accountRef = useRef<HTMLDivElement | null>(null);
  
  const pathname = usePathname();
  const router = useRouter();
  const isAuthScreen = pathname === "/login";

  useEffect(() => {
    const saved = window.localStorage.getItem("qa-sidebar-collapsed");
    if (saved !== null) setCollapsed(saved === "1");
    const theme = window.localStorage.getItem("qa-theme");
    const prefersDark = theme === "dark" || (!theme && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setDark(prefersDark);
    document.documentElement.classList.toggle("dark", prefersDark);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    window.localStorage.setItem("qa-sidebar-collapsed", collapsed ? "1" : "0");
  }, [collapsed, mounted]);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.classList.toggle("dark", dark);
    window.localStorage.setItem("qa-theme", dark ? "dark" : "light");
  }, [dark, mounted]);

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((d) => setNotifCount((d.notifications || []).length))
      .catch(() => {});
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUser(d.user || null))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      const target = event.target as Node;
      if (accountRef.current && !accountRef.current.contains(target)) {
        setAccountOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      if (e.key === "k") return;
      if (e.key === "n") { e.preventDefault(); window.dispatchEvent(new Event("qa:open-form")); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/login");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setLoggingOut(false);
      setShowLogoutConfirm(false);
    }
  };

  const sidebarWidth = !mounted ? "240px" : (collapsed ? "72px" : "240px");

  return (
    <div className={cn(
      "flex min-h-screen bg-slate-50 dark:bg-[#020617] mesh-gradient overflow-x-hidden"
    )}>
      {isAuthScreen ? (
        children
      ) : (
        <>
          {mobileOpen && (
            <div className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm md:hidden" onClick={() => setMobileOpen(false)} />
          )}
          <div className={cn(
            "fixed inset-y-0 left-0 z-40 transition-transform duration-200 ease-in-out md:translate-x-0",
            mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          )}>
            <Sidebar 
              collapsed={collapsed} 
              onToggle={() => setCollapsed(!collapsed)} 
              onLogout={() => setShowLogoutConfirm(true)}
            />
          </div>
          <div className="flex flex-1 flex-col min-w-0">
            <div
              className="flex flex-1 flex-col transition-[margin-left] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] md:ml-[var(--sidebar-w)]"
              style={{ "--sidebar-w": sidebarWidth } as React.CSSProperties}
            >
              <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/50 dark:border-white/5 bg-white/60 dark:bg-black/20 px-4 md:px-6 backdrop-blur-xl">
                <button
                  type="button"
                  onClick={() => setMobileOpen((v) => !v)}
                  className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 md:hidden"
                  aria-label="Open menu"
                >
                  <List size={20} weight="bold" />
                </button>
                <div className="ml-auto flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setDark((v) => !v)}
                    title={dark ? "Switch to light mode" : "Switch to dark mode"}
                    aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
                    className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 shadow-sm transition-all hover:scale-105 active:scale-95"
                  >
                    {dark ? <Sun size={18} weight="bold" /> : <Moon size={18} weight="bold" />}
                  </button>
                  <div ref={notifRef} className="relative">
                    {notifOpen && <NotificationPanel anchorRef={notifRef} onClose={() => setNotifOpen(false)} />}
                    <button
                      type="button"
                      onClick={() => setNotifOpen((v) => !v)}
                      title="Notifications"
                      aria-label="Notifications"
                      className="relative flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 shadow-sm transition-all hover:scale-105 active:scale-95"
                    >
                      <Bell size={18} weight="bold" />
                      {notifCount > 0 && (
                        <span className="absolute -left-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-xs font-black text-white shadow-sm">
                          {notifCount > 9 ? "9+" : notifCount}
                        </span>
                      )}
                    </button>
                  </div>
                  <GlobalSearch />
                  <div ref={accountRef} className="relative">
                    <button
                      type="button"
                      onClick={() => setAccountOpen((v) => !v)}
                      className="flex h-10 items-center gap-2 rounded-md border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-2.5 text-left shadow-sm transition hover:scale-[1.02]"
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-[11px] font-black text-white dark:bg-white dark:text-slate-900">
                        {String(user?.name || user?.username || "U").slice(0, 1).toUpperCase()}
                      </span>
                      <span className="hidden max-w-28 flex-col leading-tight md:flex">
                        <span className="truncate text-xs font-bold text-slate-800 dark:text-slate-100">
                          {user?.name || user?.username || "Account"}
                        </span>
                        <span className="truncate text-xs text-slate-500 dark:text-slate-400">
                          {user?.role || "viewer"}{user?.company ? ` · ${user.company}` : ""}
                        </span>
                      </span>
                      <CaretDown size={12} weight="bold" className="text-slate-400" />
                    </button>

                    {accountOpen && (
                      <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl dark:border-white/10 dark:bg-slate-950">
                        <div className="flex items-start gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-sm font-black text-white dark:bg-white dark:text-slate-900">
                            {String(user?.name || user?.username || "U").slice(0, 1).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-black text-slate-900 dark:text-white">{user?.name || user?.username || "Account"}</p>
                            <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user?.email || user?.username || "-"}</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold uppercase tracking-widest text-slate-600 dark:bg-white/5 dark:text-slate-300">
                                {user?.role || "viewer"}
                              </span>
                              <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-bold uppercase tracking-widest text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">
                                {user?.company || "No company"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 grid gap-2 rounded-2xl bg-slate-50 p-3 text-xs dark:bg-white/5">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 dark:text-slate-400">Username</span>
                            <span className="font-bold text-slate-800 dark:text-slate-100">{user?.username || "-"}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 dark:text-slate-400">Role</span>
                            <span className="font-bold text-slate-800 dark:text-slate-100">{user?.role || "-"}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 dark:text-slate-400">Company</span>
                            <span className="max-w-40 truncate font-bold text-slate-800 dark:text-slate-100">{user?.company || "-"}</span>
                          </div>
                        </div>

                        <div className="mt-4 space-y-1">
                          <Link href="/settings/profile" onClick={() => setAccountOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/5">
                            <UserCircle size={16} weight="bold" />
                            Profile
                          </Link>
                          <Link href="/settings/users" onClick={() => setAccountOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/5">
                            <Gear size={16} weight="bold" />
                            Account settings
                          </Link>
                          <button
                            type="button"
                            onClick={() => { setAccountOpen(false); setShowLogoutConfirm(true); }}
                            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold text-rose-600 transition hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-950/30"
                          >
                            <SignOut size={16} weight="bold" />
                            Logout
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </header>
              <main className="flex-1 min-w-0 p-4 md:p-8 lg:p-10">
                <div key={pathname} className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {children}
                </div>
              </main>
            </div>
          </div>
        </>
      )}

      <ConfirmModal
        isOpen={showLogoutConfirm}
        title="Confirm Logout"
        message="Are you sure you want to log out from your session? All unsaved work might be lost."
        confirmText={loggingOut ? "Logging out..." : "Yes, Log Out"}
        cancelText="Cancel"
        type="danger"
        onConfirm={handleLogout}
        onCancel={() => !loggingOut && setShowLogoutConfirm(false)}
      />
    </div>
  );
}
