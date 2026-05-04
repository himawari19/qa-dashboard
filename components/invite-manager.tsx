"use client";

import { useEffect, useState } from "react";
import { Copy, LinkSimple, Plus, Trash } from "@phosphor-icons/react";
import { toast } from "@/components/ui/toast";

type Invite = {
  token: string;
  company: string;
  role: string;
  status: string;
  expiresAt: string;
  createdAt: string;
};

export function InviteManager({ embedded = false }: { embedded?: boolean } = {}) {
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [expiresInDays, setExpiresInDays] = useState("");
  const [link, setLink] = useState("");
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(false);

  const loadInvites = async (targetCompany = company) => {
    if (!targetCompany.trim()) {
      setInvites([]);
      return;
    }
    const res = await fetch(`/api/invites?company=${encodeURIComponent(targetCompany.trim())}`);
    const data = await res.json().catch(() => null);
    setInvites(Array.isArray(data?.invites) ? data.invites : []);
  };

  useEffect(() => {
    void loadInvites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createInvite = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company,
          role,
          expiresInDays: Number(expiresInDays) || 7,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Failed to create invite");
      setLink(data.link || "");
      toast("Invite link generated", "success");
      await loadInvites(company);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to create invite", "error");
    } finally {
      setLoading(false);
    }
  };

  const revoke = async (token: string) => {
    const res = await fetch(`/api/invites/${encodeURIComponent(token)}`, { method: "DELETE" });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      toast(data?.error || "Failed to revoke invite", "error");
      return;
    }
    toast("Invite revoked", "success");
    await loadInvites(company);
  };

  const copy = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    toast("Link copied", "success");
  };

  const body = (
    <>
      <div className={embedded ? "flex items-center justify-between gap-3" : "flex items-center justify-between gap-3"}>
        <div>
          <h2 className={embedded ? "text-lg font-black text-slate-900 dark:text-white" : "mt-1 text-lg font-black text-slate-900 dark:text-white"}>
            Invite user by link
          </h2>
        </div>
        <LinkSimple size={18} weight="bold" className="text-slate-400" />
      </div>

      <div className={embedded ? "mt-3 grid gap-2 md:grid-cols-[1.25fr_1fr_0.75fr]" : "mt-4 grid gap-3 md:grid-cols-3"}>
        <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company name" className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none dark:border-white/10 dark:bg-slate-900 dark:text-white" />
        <select value={role} onChange={(e) => setRole(e.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none dark:border-white/10 dark:bg-slate-900 dark:text-white">
          <option value="" disabled>
            Select role
          </option>
          <option value="viewer">Viewer access</option>
          <option value="editor">Editor</option>
          <option value="lead">Lead</option>
        </select>
        <input value={expiresInDays} onChange={(e) => setExpiresInDays(e.target.value)} type="number" min="1" max="30" placeholder="Expires (days)" className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none dark:border-white/10 dark:bg-slate-900 dark:text-white" />
      </div>

      <div className={embedded ? "mt-2 flex flex-wrap gap-2" : "mt-3 flex flex-wrap gap-2"}>
        <button onClick={createInvite} disabled={loading || !company.trim() || !role} className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-bold text-white disabled:opacity-60 dark:bg-white dark:text-slate-900">
          <Plus size={16} weight="bold" />
          {loading ? "Creating..." : "Generate link"}
        </button>
        <button onClick={() => loadInvites()} className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-600 dark:border-white/10 dark:text-slate-300">Refresh</button>
      </div>

      {link && (
        <div className={embedded ? "mt-3 flex items-center justify-between gap-2 rounded-2xl bg-slate-50 px-3 py-2 text-sm dark:bg-white/5" : "mt-4 flex items-center justify-between gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm dark:bg-white/5"}>
          <span className="min-w-0 truncate text-slate-600 dark:text-slate-300">{link}</span>
          <button onClick={copy} className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm dark:bg-slate-900 dark:text-slate-200">
            <Copy size={14} weight="bold" />
            Copy
          </button>
        </div>
      )}

      <div className="mt-6">
        <h3 className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">Pending invites</h3>
        <div className="mt-3 space-y-2">
          {invites.length === 0 ? (
            <p className="text-sm text-slate-400">No invites for this company.</p>
          ) : invites.map((invite) => (
            <div key={invite.token} className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4 dark:border-white/10 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{invite.role}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{invite.status} · expires {new Date(invite.expiresAt).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => navigator.clipboard.writeText(`${window.location.origin}/invite/${invite.token}`)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 dark:border-white/10 dark:text-slate-300">Copy link</button>
                <button onClick={() => revoke(invite.token)} className="inline-flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 dark:bg-rose-950/30 dark:text-rose-200">
                  <Trash size={14} weight="bold" />
                  Revoke
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {!embedded && <p className="mt-6 text-xs font-black uppercase tracking-[0.28em] text-slate-400">Company Invite</p>}
    </>
  );

  return embedded ? (
    <div>{body}</div>
  ) : (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-950">
      {body}
    </section>
  );
}
