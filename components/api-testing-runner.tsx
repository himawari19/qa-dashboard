"use client";

import { useState } from "react";
import { Play, Spinner, DownloadSimple, Plus, Trash } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

type ApiEndpoint = {
  id: number;
  title: string;
  method: string;
  endpoint: string;
  payload?: string | null;
  response?: string | null;
  notes?: string | null;
};

type ApiRun = {
  id: number;
  apiEndpointId?: number | null;
  title: string;
  method: string;
  endpoint: string;
  requestBody?: string | null;
  responseStatus: string;
  responseBody?: string | null;
  error?: string | null;
  createdAt?: string | null;
};

type RunResult = {
  ok: boolean;
  status?: number;
  statusText?: string;
  body?: string;
  error?: string;
};

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"];

export function ApiTestingRunner({
  endpoints: initialEndpoints,
  runs: initialRuns,
}: {
  endpoints: ApiEndpoint[];
  runs: ApiRun[];
}) {
  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>(initialEndpoints);
  const [runs, setRuns] = useState<ApiRun[]>(initialRuns);

  // Runner state
  const [selectedId, setSelectedId] = useState(initialEndpoints[0]?.id?.toString() || "");
  const [customEndpoint, setCustomEndpoint] = useState(initialEndpoints[0]?.endpoint || "");
  const [customMethod, setCustomMethod] = useState(initialEndpoints[0]?.method || "GET");
  const [requestBody, setRequestBody] = useState(initialEndpoints[0]?.payload || "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);

  // Save form state
  const [saveTitle, setSaveTitle] = useState("");
  const [saveMethod, setSaveMethod] = useState("GET");
  const [saveEndpoint, setSaveEndpoint] = useState("");
  const [savePayload, setSavePayload] = useState("");
  const [saveNotes, setSaveNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const selected = endpoints.find((item) => String(item.id) === selectedId);
  const selectedRuns = runs.filter((run) => {
    if (selected?.id && run.apiEndpointId) return Number(run.apiEndpointId) === Number(selected.id);
    return run.endpoint === customEndpoint && run.method === customMethod;
  });

  const syncFromSelection = (id: string) => {
    setSelectedId(id);
    const item = endpoints.find((row) => String(row.id) === id);
    if (item) {
      setCustomEndpoint(item.endpoint || "");
      setCustomMethod(item.method || "GET");
      setRequestBody(item.payload || "");
    }
    setResult(null);
  };

  const loadFromSaved = (item: ApiEndpoint) => {
    setSelectedId(String(item.id));
    setCustomEndpoint(item.endpoint || "");
    setCustomMethod(item.method || "GET");
    setRequestBody(item.payload || "");
    setResult(null);
  };

  async function run() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/api-testing/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          apiEndpointId: selected?.id,
          title: selected?.title || "Custom API Request",
          method: customMethod,
          endpoint: customEndpoint,
          requestBody,
        }),
      });
      const json = await res.json();
      setResult(json);
      // Refresh runs list
      const runsRes = await fetch("/api/api-testing/run");
      if (runsRes.ok) {
        const data = await runsRes.json();
        if (Array.isArray(data)) setRuns(data);
      }
    } finally {
      setLoading(false);
    }
  }

  async function saveApi() {
    if (!saveTitle || !saveEndpoint) return;
    setSaving(true);
    try {
      const res = await fetch("/api/api-testing/endpoint", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: saveTitle,
          method: saveMethod,
          endpoint: saveEndpoint,
          payload: savePayload,
          notes: saveNotes,
        }),
      });
      if (res.ok) {
        // Refresh endpoints list
        const epRes = await fetch("/api/api-testing/endpoint");
        if (epRes.ok) {
          const data = await epRes.json();
          if (Array.isArray(data)) setEndpoints(data);
        } else {
          // Fallback: optimistic update
          const newItem: ApiEndpoint = {
            id: Date.now(),
            title: saveTitle,
            method: saveMethod,
            endpoint: saveEndpoint,
            payload: savePayload,
            notes: saveNotes,
          };
          setEndpoints((prev) => [newItem, ...prev]);
        }
        setSaveTitle("");
        setSaveEndpoint("");
        setSavePayload("");
        setSaveNotes("");
        setSaveMethod("GET");
      }
    } finally {
      setSaving(false);
    }
  }

  async function deleteEndpoint(id: number) {
    const res = await fetch(`/api/api-testing/endpoint?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setEndpoints((prev) => prev.filter((e) => e.id !== id));
      if (String(id) === selectedId) {
        const remaining = endpoints.filter((e) => e.id !== id);
        if (remaining.length > 0) syncFromSelection(String(remaining[0].id));
        else { setSelectedId(""); setCustomEndpoint(""); setCustomMethod("GET"); setRequestBody(""); }
      }
    }
  }

  async function loadDemo() {
    setLoading(true);
    try {
      await fetch("/api/api-testing/seed", { method: "POST" });
      window.location.reload();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
      {/* LEFT: Save + Run controls */}
      <div className="space-y-4">
        {/* Save new API */}
        <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Save New API</p>
          <div className="space-y-2">
            <input
              value={saveTitle}
              onChange={(e) => setSaveTitle(e.target.value)}
              placeholder="API name"
              className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-sky-500"
            />
            <div className="flex gap-2">
              <select
                value={saveMethod}
                onChange={(e) => setSaveMethod(e.target.value)}
                className="h-10 w-28 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-sky-500"
              >
                {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              <input
                value={saveEndpoint}
                onChange={(e) => setSaveEndpoint(e.target.value)}
                placeholder="https://..."
                className="h-10 flex-1 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-sky-500"
              />
            </div>
            <textarea
              value={savePayload}
              onChange={(e) => setSavePayload(e.target.value)}
              placeholder="Request body (optional)"
              rows={3}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500"
            />
            <button
              type="button"
              onClick={() => void saveApi()}
              disabled={saving || !saveTitle || !saveEndpoint}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-sky-700 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? <Spinner size={15} className="animate-spin" /> : <Plus size={15} weight="bold" />}
              Save API
            </button>
          </div>
        </div>

        {/* Runner */}
        <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Run API</p>
          <div className="space-y-2">
            <select
              value={selectedId}
              onChange={(e) => syncFromSelection(e.target.value)}
              className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-sky-500"
            >
              {endpoints.map((item) => (
                <option key={item.id} value={item.id}>{item.title}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <select
                value={customMethod}
                onChange={(e) => setCustomMethod(e.target.value)}
                className="h-10 w-28 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-sky-500"
              >
                {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              <input
                value={customEndpoint}
                onChange={(e) => setCustomEndpoint(e.target.value)}
                placeholder="https://..."
                className="h-10 flex-1 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-sky-500"
              />
            </div>
            <textarea
              value={requestBody}
              onChange={(e) => setRequestBody(e.target.value)}
              rows={4}
              placeholder='{"key":"value"}'
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void run()}
                disabled={loading || !customEndpoint}
                className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-md bg-sky-700 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? <Spinner size={15} className="animate-spin" /> : <Play size={15} weight="bold" />}
                Run
              </button>
              <button
                type="button"
                onClick={() => void loadDemo()}
                className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:text-sky-700"
              >
                <DownloadSimple size={15} weight="bold" />
                Demo
              </button>
            </div>
          </div>
        </div>

        {/* History */}
        <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">History</p>
          <div className="space-y-2">
            {selectedRuns.length > 0 ? selectedRuns.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => {
                  setCustomEndpoint(r.endpoint);
                  setCustomMethod(r.method);
                  setRequestBody(r.requestBody || "");
                  setResult({
                    ok: !String(r.responseStatus).startsWith("ERROR"),
                    statusText: r.responseStatus,
                    body: r.responseBody || r.error || "No response",
                  });
                }}
                className="w-full rounded-md border border-slate-100 bg-slate-50 p-3 text-left transition hover:border-sky-300 hover:bg-sky-50"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-800 truncate">{r.title}</p>
                  <span className={cn(
                    "shrink-0 text-xs font-bold",
                    String(r.responseStatus).startsWith("2") ? "text-emerald-600" : "text-rose-600"
                  )}>{r.responseStatus}</span>
                </div>
                <p className="mt-0.5 text-xs text-slate-500 truncate">{r.method} {r.endpoint}</p>
              </button>
            )) : (
              <p className="text-sm text-slate-500">No history yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT: Response + Saved Requests */}
      <div className="space-y-4">
        {/* Response */}
        <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Response</p>
          {result ? (
            <div className="space-y-3">
              <p className={cn("text-base font-bold", result.ok ? "text-emerald-700" : "text-rose-700")}>
                {result.ok ? `✓ ${result.statusText ?? "Success"}` : `✗ ${result.statusText ?? "Failed"}`}
              </p>
              <pre className="max-h-[32rem] overflow-auto rounded-md bg-slate-950 p-4 text-xs leading-relaxed text-slate-100">
                {result.body || result.error || "No response"}
              </pre>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Run an API to see the response here.</p>
          )}
        </div>

        {/* Saved Requests — clickable */}
        <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Saved Requests ({endpoints.length})
          </p>
          <div className="space-y-2">
            {endpoints.length === 0 ? (
              <p className="text-sm text-slate-500">No saved APIs yet.</p>
            ) : (
              endpoints.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-center gap-2 rounded-md border p-3 transition",
                    String(item.id) === selectedId
                      ? "border-sky-300 bg-sky-50"
                      : "border-slate-100 bg-slate-50 hover:border-sky-300 hover:bg-sky-50"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => loadFromSaved(item)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-black",
                        item.method === "GET" ? "bg-emerald-100 text-emerald-700" :
                        item.method === "POST" ? "bg-sky-100 text-sky-700" :
                        item.method === "DELETE" ? "bg-rose-100 text-rose-700" :
                        "bg-amber-100 text-amber-700"
                      )}>{item.method}</span>
                      <p className="truncate text-sm font-semibold text-slate-800">{item.title}</p>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-slate-500">{item.endpoint}</p>
                  </button>
                  <button
                    type="button"
                    title="Delete endpoint"
                    onClick={() => void deleteEndpoint(item.id)}
                    className="shrink-0 rounded-md p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                  >
                    <Trash size={14} weight="bold" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
