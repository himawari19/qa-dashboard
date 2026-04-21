"use client";

import { useState } from "react";
import { Plus, Spinner } from "@phosphor-icons/react";

export function ApiTestingEditor() {
  const [title, setTitle] = useState("");
  const [method, setMethod] = useState("GET");
  const [endpoint, setEndpoint] = useState("");
  const [payload, setPayload] = useState("");
  const [response, setResponse] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await fetch("/api/api-testing/endpoint", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title, method, endpoint, payload, response, notes }),
      });
      window.location.reload();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Request Builder</p>
          <p className="mt-1 text-sm text-slate-500">Save API endpoints directly to the internal DB.</p>
        </div>
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving || !title || !endpoint}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-sky-700 px-4 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? <Spinner size={16} className="animate-spin" /> : <Plus size={16} weight="bold" />}
          Save API
        </button>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="API name" className="h-11 rounded-2xl border border-slate-200 px-3 text-sm outline-none focus:border-sky-500" />
        <select value={method} onChange={(e) => setMethod(e.target.value)} className="h-11 rounded-2xl border border-slate-200 px-3 text-sm outline-none focus:border-sky-500">
          {["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"].map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <input value={endpoint} onChange={(e) => setEndpoint(e.target.value)} placeholder="https://..." className="h-11 rounded-2xl border border-slate-200 px-3 text-sm outline-none focus:border-sky-500 md:col-span-2" />
        <textarea value={payload} onChange={(e) => setPayload(e.target.value)} placeholder="Request body" rows={4} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500 md:col-span-2" />
        <textarea value={response} onChange={(e) => setResponse(e.target.value)} placeholder="Expected response" rows={4} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500 md:col-span-2" />
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes" rows={3} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500 md:col-span-2" />
      </div>
    </div>
  );
}
