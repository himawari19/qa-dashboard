"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LockKey, ArrowRight, Database, Sparkle } from "@phosphor-icons/react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next") || "/";
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed.");
        return;
      }
      router.replace(nextUrl);
      router.refresh();
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0f9ff] via-white to-[#e0f2fe] flex items-center justify-center p-6">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-16 items-center">
        {/* Left Side: Info */}
        <section className="space-y-6">
          <h1 className="text-xl lg:text-5xl font-black tracking-tight text-slate-900 leading-[1.1]">
            Quick access for <br /> daily QA workflow.
          </h1>
          <p className="text-lg text-slate-500 max-w-lg leading-relaxed">
            All-in-one hub for bugs, tasks, test cases, and reports. Zero hardcoding, fully environment-driven.
          </p>
        </section>

        {/* Right Side: Login Form */}
        <section className="bg-white rounded-2xl border border-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.06)] p-10 lg:p-14">
          <div className="mb-10">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 mb-2">Sign In</p>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">Access dashboard</h2>
          </div>

          <form onSubmit={submit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block ml-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full h-14 px-4 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block ml-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full h-14 px-4 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all"
                required
              />
            </div>

            {error && (
              <p className="text-xs font-bold text-rose-500 bg-rose-50 p-3 rounded-md border border-rose-100">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full h-14 bg-[#006ca3] hover:bg-[#005a89] active:scale-[0.98] text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-900/10 flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {pending ? "Authenticating..." : "Login"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
