"use client";

import { useState } from "react";
import {
  Coffee,
  Copy,
  ArrowsClockwise,
  Fingerprint,
  Envelope,
  User,
  PhoneCall,
  LinkSimple,
} from "@phosphor-icons/react";
import { toast } from "@/components/ui/toast";
import { PageShell, ActionButton } from "@/components/page-shell";
import { EmptyState } from "@/components/skeleton";

export default function QAToolboxPage() {
  const [standup, setStandup] = useState("");
  const [loadingStandup, setLoadingStandup] = useState(false);
  const [fakeData, setFakeData] = useState<{ label: string; value: string }[]>([]);

  const generateStandup = async () => {
    setLoadingStandup(true);
    try {
      const res = await fetch("/api/tools/standup");
      const data = await res.json();
      setStandup(data.formatted);
    } catch {
      toast("Could not generate standup update.", "error");
    } finally {
      setLoadingStandup(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast("Value copied to clipboard.", "success");
    });
  };

  const generateFakeData = () => {
    const names = ["Andi Pratama", "Siti Aminah", "Budi Santoso", "Lina Wijaya", "Rizky Ramadhan"];
    const name = names[Math.floor(Math.random() * names.length)];
    const email = name.toLowerCase().replace(" ", ".") + Math.floor(Math.random() * 100) + "@qa.test";
    const phone = "08" + Math.floor(1000000000 + Math.random() * 9000000000);
    const nik = "32" + Math.floor(10000000000000 + Math.random() * 90000000000000);

    setFakeData([
      { label: "Random Name", value: name },
      { label: "Random Email", value: email },
      { label: "Phone (ID)", value: phone },
      { label: "Mock NIK (ID)", value: nik },
      { label: "Timestamp", value: new Date().toISOString() },
    ]);
  };

  return (
    <PageShell
      eyebrow="QA Toolbox"
      title="Quick Utilities"
      description="Fast helpers for standups, sample data, and links."
      actions={
        <ActionButton type="button" onClick={generateStandup} disabled={loadingStandup}>
          <Coffee size={16} weight="bold" />
          {loadingStandup ? "Generating..." : "Generate Standup"}
        </ActionButton>
      }
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-amber-50 p-2 text-amber-600">
                <Coffee size={22} weight="bold" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Standup Generator</h2>
                <p className="text-xs text-slate-400">Summarize work for Slack or Teams</p>
              </div>
            </div>
            <button
              onClick={generateStandup}
              disabled={loadingStandup}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-slate-900 px-4 text-xs font-bold text-white transition hover:bg-slate-700 disabled:opacity-50"
            >
              <ArrowsClockwise size={14} weight="bold" />
              Refresh
            </button>
          </div>

          <div className="relative">
            <textarea
              readOnly
              value={standup}
              placeholder="Generate a standup summary from current work."
              className="min-h-[220px] w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 outline-none resize-none"
            />
            {standup ? (
              <button
                onClick={() => copyToClipboard(standup)}
                className="absolute bottom-4 right-4 rounded-xl border border-slate-200 bg-white p-2 text-slate-500 shadow-sm transition hover:text-sky-600"
              >
                <Copy size={18} weight="bold" />
              </button>
            ) : null}
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-sky-50 p-2 text-sky-600">
                <Fingerprint size={22} weight="bold" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Fake Data</h2>
                <p className="text-xs text-slate-400">Generate simple test identities quickly</p>
              </div>
            </div>
            <button
              onClick={generateFakeData}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-sky-200 bg-white px-4 text-xs font-bold text-sky-700 transition hover:bg-sky-600 hover:text-white"
            >
              <User size={14} weight="bold" />
              Generate
            </button>
          </div>

          <div className="space-y-3">
            {fakeData.length === 0 ? (
              <EmptyState title="No Sample Data" description="Generate sample QA data for test flows and screenshots." />
            ) : (
              fakeData.map((data) => (
                <div key={data.label} className="group flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    {data.label.includes("Email") ? <Envelope size={16} className="text-sky-600" /> : null}
                    {data.label.includes("Phone") ? <PhoneCall size={16} className="text-emerald-600" /> : null}
                    {!data.label.includes("Email") && !data.label.includes("Phone") ? <Fingerprint size={16} className="text-slate-500" /> : null}
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{data.label}</p>
                      <p className="truncate text-sm font-semibold text-slate-700">{data.value}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(data.value)}
                    className="rounded-xl p-2 text-slate-400 transition hover:bg-white hover:text-sky-600"
                  >
                    <Copy size={16} weight="bold" />
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <section className="mt-8">
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-700">Quick Assets</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">Useful Links</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { name: "Placeholder Images", url: "https://via.placeholder.com" },
            { name: "JSON Sample API", url: "https://dummyjson.com" },
            { name: "Regex Tester", url: "https://regex101.com" },
            { name: "Speed Test", url: "https://fast.com" },
          ].map((link) => (
            <a
              key={link.name}
              href={link.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="rounded-xl bg-slate-50 p-2 text-sky-600">
                <LinkSimple size={16} weight="bold" />
              </div>
              <span className="text-sm font-bold text-slate-700">{link.name}</span>
            </a>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
