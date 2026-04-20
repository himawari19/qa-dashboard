"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { GlobalSearch } from "./global-search";
import { cn } from "@/lib/utils";

export function AppWrapper({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const isAuthScreen = pathname === "/login";

  useEffect(() => {
    const saved = window.localStorage.getItem("qa-sidebar-collapsed");
    if (saved !== null) {
      setCollapsed(saved === "1");
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    window.localStorage.setItem("qa-sidebar-collapsed", collapsed ? "1" : "0");
  }, [collapsed, mounted]);

  if (isAuthScreen) {
    return <>{children}</>;
  }

  if (!mounted) {
    return (
      <div className="flex min-h-screen bg-[#f8fafc]">
        <div className="w-[240px] border-r border-slate-300 bg-[#f7fafc]" />
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8 lg:px-12 ml-[240px]">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div className={cn(
        "flex flex-1 flex-col transition-[margin-left] duration-200 ease-in-out",
        collapsed ? "ml-[72px]" : "ml-[240px]"
      )}>
        {/* Global Top Bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-end border-b border-slate-200 bg-white/80 px-6 backdrop-blur-sm">
          <GlobalSearch />
        </header>
        <main className="flex-1 overflow-x-hidden px-4 py-6 md:px-8 md:py-8 lg:px-12">
          {children}
        </main>
      </div>
    </div>
  );
}
