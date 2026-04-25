"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "./sidebar";
import { GlobalSearch } from "./global-search";
import { List, Sun, Moon } from "@phosphor-icons/react";
import { ConfirmModal } from "./ui/confirm-modal";
import { cn } from "@/lib/utils";

export function AppWrapper({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  
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
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div className={cn(
      "flex min-h-screen bg-slate-50 dark:bg-[#020617] mesh-gradient overflow-x-hidden",
      !mounted && "opacity-0" // Hide briefly during hydration to prevent flash
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
                    className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 shadow-sm transition-all hover:scale-105 active:scale-95"
                  >
                    {dark ? <Sun size={18} weight="bold" /> : <Moon size={18} weight="bold" />}
                  </button>
                  <div className="h-6 w-px bg-slate-200 dark:bg-white/10 mx-1" />
                  <GlobalSearch />
                </div>
              </header>
              <main className="flex-1 min-w-0 p-4 md:p-8 lg:p-10">
                <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-700">
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
