"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, CircleNotch, Copy, SignIn, UserPlus } from "@phosphor-icons/react";

type Invite = {
  token: string;
  company: string;
  role: string;
  status: string;
  expiresAt: string;
};

type CurrentUser = {
  email?: string;
  company?: string;
  role?: string;
} | null;

export function InviteView({ invite, currentUser, token }: { invite: Invite; currentUser: CurrentUser; token: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState(currentUser?.email || "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);

  const joinLink = typeof window === "undefined" ? "" : window.location.href;

  const copyLink = async () => {
    await navigator.clipboard.writeText(joinLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const handleJoin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      let res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name || email,
            email,
            password,
            company: invite.company,
            role: invite.role,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.error || "Join failed");
        }
        const loginRes = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        });
        if (!loginRes.ok) {
          throw new Error("Login failed after registration");
        }
      }

      const acceptRes = await fetch(`/api/invites/${encodeURIComponent(token)}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!acceptRes.ok) {
        const data = await acceptRes.json().catch(() => null);
        throw new Error(data?.error || "Invite accept failed");
      }

      router.replace("/");
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Join failed");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
  if (!currentUser?.email) return;
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`/api/invites/${encodeURIComponent(token)}/accept`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Invite accept failed");
      }
      router.replace("/");
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Join failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center px-4 py-10">
      <div className="w-full rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-950">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{invite.company}</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Role: <span className="font-bold">{invite.role}</span></p>
            <p className="mt-2 text-xs font-black uppercase tracking-[0.3em] text-slate-400">Company Invite</p>
          </div>
          <button onClick={copyLink} className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5">
            {copied ? <CheckCircle size={14} weight="bold" /> : <Copy size={14} weight="bold" />}
            {copied ? "Copied" : "Copy link"}
          </button>
        </div>

        <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 dark:bg-white/5 dark:text-slate-300">
          <p>Status: <span className="font-bold">{invite.status}</span></p>
          <p>Expires: <span className="font-bold">{new Date(invite.expiresAt).toLocaleString()}</span></p>
        </div>

        {currentUser?.email ? (
          <div className="mt-6">
            <p className="mb-3 text-sm text-slate-600 dark:text-slate-300">
              Signed in as <span className="font-bold">{currentUser.email}</span>. Click join to move this account into the company.
            </p>
            <button
              onClick={handleAccept}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white disabled:opacity-60 dark:bg-white dark:text-slate-900"
            >
              {loading ? <CircleNotch size={16} className="animate-spin" weight="bold" /> : <SignIn size={16} weight="bold" />}
              Join company
            </button>
          </div>
        ) : (
          <form onSubmit={handleJoin} className="mt-6 grid gap-3">
            <div className="grid gap-3 md:grid-cols-2">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none dark:border-white/10 dark:bg-slate-900 dark:text-white" />
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email Address" className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none dark:border-white/10 dark:bg-slate-900 dark:text-white" />
            </div>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none dark:border-white/10 dark:bg-slate-900 dark:text-white" />
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white disabled:opacity-60 dark:bg-white dark:text-slate-900"
            >
              {loading ? <CircleNotch size={16} className="animate-spin" weight="bold" /> : <UserPlus size={16} weight="bold" />}
              Create account + join
            </button>
          </form>
        )}

        {message && <p className="mt-4 text-sm font-medium text-rose-600">{message}</p>}
      </div>
    </div>
  );
}
