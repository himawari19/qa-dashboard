"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { GlobalSearch } from "./global-search";
import { List, Sun, Moon } from "@phosphor-icons/react";

export function AppWrapper({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const pathname = usePathname();
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

  if (isAuthScreen) return <>{children}</>;

  if (!mounted) {
    return (
      <div className="flex min-h-screen bg-[#f8fafc]">
        <div className="fixed inset-y-0 left-0 z-40 w-[240px] border-r border-slate-300 bg-[#f7fafc]" />
        <div className="flex flex-1 flex-col" style={{ marginLeft: "240px" }}>
          <header className="sticky top-0 z-30 flex h-14 items-center justify-end border-b border-slate-200 bg-white/80 px-4 md:px-6 backdrop-blur-sm">
            <GlobalSearch />
          </header>
          <main className="flex-1 min-w-0 px-4 py-6 md:px-8 md:py-8 lg:px-12">{children}</main>
        </div>
      </div>
    );
  }

  const sidebarWidth = collapsed ? "72px" : "240px";

  return (
    <div className="flex min-h-screen bg-[#f8fafc] dark:bg-slate-950">
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setMobileOpen(false)} />
      )}
      <div className={["fixed inset-y-0 left-0 z-40 transition-transform duration-200 ease-in-out", "md:translate-x-0", mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"].join(" ")}>
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      </div>
      <div className="flex flex-1 flex-col min-w-0">
        <div
          className="flex flex-1 flex-col transition-[margin-left] duration-200 ease-in-out md:ml-[var(--sidebar-w)]"
          style={{ "--sidebar-w": sidebarWidth } as React.CSSProperties}
        >
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 px-4 md:px-6 backdrop-blur-sm">
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 md:hidden"
              aria-label="Open menu"
            >
              <List size={18} weight="bold" />
            </button>
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDark((v) => !v)}
                title={dark ? "Switch to light mode" : "Switch to dark mode"}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-sm transition hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                {dark ? <Sun size={16} weight="bold" /> : <Moon size={16} weight="bold" />}
              </button>
              <GlobalSearch />
            </div>
          </header>
          <main className="flex-1 min-w-0 px-4 py-6 md:px-8 md:py-8 lg:px-12">{children}</main>
        </div>
      </div>
    </div>
  );
}
