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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.14),_transparent_30%),linear-gradient(180deg,#f8fafc_0%,#eef6fb_100%)] px-6 py-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-sky-700 shadow-sm">
            <Sparkle size={14} weight="bold" />
            QA Daily Hub
          </div>
          <h1 className="max-w-xl text-5xl font-black tracking-tight text-slate-900">
            Login cepat untuk kerja harian QA.
          </h1>
          <p className="max-w-xl text-base leading-7 text-slate-600">
            Satu akses untuk bug, task, test case, reports, dan tools. Tidak ada hardcode. Semua kredensial dibaca dari env.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
              <Database size={20} className="text-sky-600" />
              <p className="mt-3 text-sm font-bold text-slate-900">SQLite lokal</p>
              <p className="mt-1 text-xs text-slate-500">Pakai saat `DATABASE_URL` kosong.</p>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
              <LockKey size={20} className="text-sky-600" />
              <p className="mt-3 text-sm font-bold text-slate-900">Neon prod</p>
              <p className="mt-1 text-xs text-slate-500">Isi `DATABASE_URL` postgres saat deploy.</p>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
              <ArrowRight size={20} className="text-sky-600" />
              <p className="mt-3 text-sm font-bold text-slate-900">Akses aman</p>
              <p className="mt-1 text-xs text-slate-500">Session cookie signed, bukan hardcode.</p>
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-xl">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-sky-700">Sign In</p>
          <h2 className="mt-2 text-3xl font-black text-slate-900">Access dashboard</h2>
          <form className="mt-8 space-y-4" onSubmit={submit}>
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Username</span>
              <input
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none focus:border-sky-500"
                placeholder="Enter username"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Password</span>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none focus:border-sky-500"
                placeholder="Enter password"
              />
            </label>
            {error ? <p className="text-sm font-semibold text-rose-600">{error}</p> : null}
            <button
              disabled={pending}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-sky-700 px-5 text-sm font-bold text-white transition hover:bg-sky-800 disabled:opacity-50"
            >
              {pending ? "Signing in..." : "Login"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
