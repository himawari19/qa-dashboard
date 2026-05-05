"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, CheckCircle, Eye, EyeSlash, UserPlus } from "@phosphor-icons/react";
import { toast } from "@/components/ui/toast";

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("inviteToken") || "";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const inviteHint = useMemo(() => (inviteToken ? "Invitation detected. Your access will be activated after registration." : "Invite-only access. Use an invitation link to register."), [inviteToken]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          inviteToken: inviteToken || undefined,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Registration failed.");
      if (inviteToken) {
        const acceptRes = await fetch(`/api/invites/${encodeURIComponent(inviteToken)}/accept`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        if (!acceptRes.ok) {
          const acceptData = await acceptRes.json().catch(() => null);
          throw new Error(acceptData?.error || "Invite activation failed.");
        }
      }
      toast("Account created. Please sign in.", "success");
      router.replace("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2 bg-slate-50">
      <div className="hidden lg:flex flex-col justify-center bg-gradient-to-br from-sky-600 via-blue-600 to-indigo-700 p-16 text-white">
        <p className="text-xs font-black uppercase tracking-[0.35em] text-white/70">QA Daily Hub</p>
        <h1 className="mt-6 max-w-lg text-6xl font-black leading-tight">Register with your invite.</h1>
        <p className="mt-6 max-w-xl text-lg leading-8 text-white/85">
          Private workspace access. No public signup. Use the invitation link from your super admin.
        </p>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="mb-6">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Create account</p>
            <h2 className="mt-2 text-3xl font-black text-slate-900">Register your access</h2>
            <p className="mt-2 text-sm text-slate-500">{inviteHint}</p>
          </div>

          <form onSubmit={submit} className="space-y-3">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-sky-500" />
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-sky-500" />
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 pr-12 text-sm outline-none focus:border-sky-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-400 transition hover:text-slate-700"
              >
                {showPassword ? <EyeSlash size={18} weight="bold" /> : <Eye size={18} weight="bold" />}
              </button>
            </div>
            {inviteToken && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                <div className="flex items-center gap-2 font-semibold">
                  <CheckCircle size={16} weight="bold" />
                  Invitation ready
                </div>
              </div>
            )}
            {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
            <button disabled={pending} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-bold text-white disabled:opacity-60">
              <UserPlus size={16} weight="bold" />
              {pending ? "Creating account..." : "Create account"}
              <ArrowRight size={16} weight="bold" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
