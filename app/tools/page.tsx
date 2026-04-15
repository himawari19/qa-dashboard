"use client";

import { useState } from "react";
import { 
  Coffee, 
  Copy, 
  DownloadSimple, 
  ArrowsClockwise, 
  Terminal, 
  Fingerprint, 
  Envelope, 
  User, 
  PhoneCall,
  LinkSimple
} from "@phosphor-icons/react";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export default function QAToolboxPage() {
  const [standup, setStandup] = useState<string>("");
  const [loadingStandup, setLoadingStandup] = useState(false);

  // Data Faker State
  const [fakeData, setFakeData] = useState<{
    label: string,
    value: string
  }[]>([]);

  const generateStandup = async () => {
    setLoadingStandup(true);
    try {
      const res = await fetch("/api/tools/standup");
      const data = await res.json();
      setStandup(data.formatted);
    } catch (err) {
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
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-5xl">
        <header className="mb-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
              QA Toolbox
            </h1>
            <p className="mt-2 text-slate-500 font-medium">
              Daily productivity tools to automate the repetitive parts of QA work.
            </p>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Standup Generator */}
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
                  <Coffee size={24} weight="bold" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-800">Standup Generator</h2>
                  <p className="text-xs text-slate-400">Summarize your work for Slack/Teams</p>
                </div>
              </div>
              <button 
                onClick={generateStandup}
                disabled={loadingStandup}
                className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-700 active:scale-95 disabled:opacity-50"
              >
                {loadingStandup ? "..." : <ArrowsClockwise size={16} weight="bold" />}
                Generate
              </button>
            </div>

            <div className="relative group">
              <textarea 
                readOnly
                value={standup}
                placeholder="Click generate to pull data from tasks and logs..."
                className="w-full min-h-[180px] rounded-2xl bg-slate-50 border border-slate-100 p-4 text-xs font-mono text-slate-600 outline-none resize-none"
              />
              {standup && (
                <button 
                  onClick={() => copyToClipboard(standup)}
                  className="absolute bottom-4 right-4 p-2 bg-white rounded-lg shadow-sm border border-slate-100 text-slate-500 hover:text-sky-600 transition"
                >
                  <Copy size={18} weight="bold" />
                </button>
              )}
            </div>
          </div>

          {/* Test Data Faker */}
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-sky-50 rounded-xl text-sky-600">
                  <Terminal size={24} weight="bold" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-800">Test Data Faker</h2>
                  <p className="text-xs text-slate-400">Generate dummy values for forms</p>
                </div>
              </div>
              <button 
                onClick={generateFakeData}
                className="flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-sky-500 active:scale-95"
              >
                <ArrowsClockwise size={16} weight="bold" />
                New Data
              </button>
            </div>

            <div className="space-y-3">
              {fakeData.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-300">
                  <Fingerprint size={48} weight="light" />
                  <p className="text-sm">Click generate for new values</p>
                </div>
              ) : (
                fakeData.map((data, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 group">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{data.label}</p>
                      <p className="text-sm font-semibold text-slate-700">{data.value}</p>
                    </div>
                    <button 
                      onClick={() => copyToClipboard(data.value)}
                      className="p-1.5 opacity-0 group-hover:opacity-100 transition text-slate-400 hover:text-sky-600"
                    >
                      <Copy size={16} weight="bold" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Useful Quick Links */}
        <section className="mt-8">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Quick Testing Assets</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { name: "Placeholder Images", url: "https://via.placeholder.com", icon: <LinkSimple /> },
              { name: "Dummy JSON API", url: "https://dummyjson.com", icon: <LinkSimple /> },
              { name: "RegEx Tester", url: "https://regex101.com", icon: <LinkSimple /> },
              { name: "Speed Test", url: "https://fast.com", icon: <LinkSimple /> }
            ].map(link => (
              <a 
                key={link.name}
                href={link.url} 
                target="_blank" 
                className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm transition hover:scale-[1.02] hover:shadow-md group"
              >
                <div className="text-slate-300 group-hover:text-amber-500 transition">{link.icon}</div>
                <span className="text-sm font-bold text-slate-600">{link.name}</span>
              </a>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
