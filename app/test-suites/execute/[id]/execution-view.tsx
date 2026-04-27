"use client";

import { useState, useEffect, useCallback } from "react";
import { CheckCircle, XCircle, ArrowLeft, Database, Play, FastForward, Keyboard, Warning } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { toast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/badge";
import { Breadcrumb } from "@/components/breadcrumb";

type TestCase = {
  id: string | number;
  code: string;
  caseName: string;
  preCondition: string;
  testStep: string;
  expectedResult: string;
  actualResult: string;
  status: string;
};

type Suite = {
  project: string;
  sprint: string;
  title: string;
};

type SessionForm = {
  project: string;
  sprint: string;
  tester: string;
  notes: string;
};

export function SuiteExecutionView({
  suite,
  cases,
  suiteToken,
}: {
  suite: Suite;
  cases: TestCase[];
  scenarioId: string;
  suiteToken: string;
}) {
  const router = useRouter();
  const [items, setItems] = useState<TestCase[]>(cases);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | number | null>(
    cases.length > 0 ? cases[0].id : null,
  );
  const [showModal, setShowModal] = useState(false);
  const [sessionForm, setSessionForm] = useState<SessionForm>({
    project: suite.project || "",
    sprint: suite.sprint || "",
    tester: "",
    notes: "",
  });

  const selectedCase = items.find((i) => i.id === selectedId);
  const selectedIndex = items.findIndex((i) => i.id === selectedId);

  const total = items.length;
  const passed = items.filter((i) => i.status === "Passed").length;
  const failed = items.filter((i) => i.status === "Failed").length;
  const blocked = items.filter((i) => i.status === "Blocked").length;
  const completed = passed + failed + blocked;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  const goToNext = useCallback(() => {
    if (selectedIndex < items.length - 1) setSelectedId(items[selectedIndex + 1].id);
  }, [selectedIndex, items]);

  const goToPrev = useCallback(() => {
    if (selectedIndex > 0) setSelectedId(items[selectedIndex - 1].id);
  }, [selectedIndex, items]);

  const updateStatus = useCallback(
    (id: string | number, status: string, advance = false) => {
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
      if (advance) setTimeout(goToNext, 150);
    },
    [goToNext],
  );

  const updateActualResult = useCallback((id: string | number, actualResult: string) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, actualResult } : item)));
  }, []);

  const setAllStatus = (status: string) => {
    setItems((prev) => prev.map((item) => ({ ...item, status })));
    toast(`All cases set to ${status}`, "info");
  };

  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.key.toLowerCase()) {
        case "p":
          if (selectedId) updateStatus(selectedId, "Passed", true);
          break;
        case "f":
          if (selectedId) updateStatus(selectedId, "Failed", true);
          break;
        case "b":
          if (selectedId) updateStatus(selectedId, "Blocked", true);
          break;
        case "arrowdown":
        case "j":
          e.preventDefault();
          goToNext();
          break;
        case "arrowup":
        case "k":
          e.preventDefault();
          goToPrev();
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedId, updateStatus, goToNext, goToPrev]);

  const saveResults = async () => {
    if (!sessionForm.tester.trim()) {
      toast("Tester name is required.", "error");
      return;
    }
    setLoading(true);
    try {
      const tcRes = await fetch("/api/test-cases", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: items }),
      });
      if (!tcRes.ok) throw new Error("Failed to save test case results");

      const result = failed > 0 ? "fail" : blocked > 0 ? "blocked" : "pass";
      const formData = new FormData();
      formData.set("date", new Date().toISOString().split("T")[0]);
      formData.set("project", sessionForm.project);
      formData.set("sprint", sessionForm.sprint);
      formData.set("tester", sessionForm.tester);
      formData.set("scope", suite.title);
      formData.set("totalCases", String(total));
      formData.set("passed", String(passed));
      formData.set("failed", String(failed));
      formData.set("blocked", String(blocked));
      formData.set("result", result);
      formData.set("notes", sessionForm.notes);
      formData.set("evidence", "");

      const sessionRes = await fetch("/api/items/test-sessions", {
        method: "POST",
        body: formData,
      });
      if (!sessionRes.ok) {
        const d = await sessionRes.json();
        throw new Error(d.error || "Failed to create test session");
      }

      toast("Session saved!", "success");
      router.push("/test-sessions");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Failed to save", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-6">
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Finish Session</h2>
              <p className="text-sm text-slate-500 mt-1">Review the results and confirm session details.</p>
            </div>

            <div className="grid grid-cols-3 divide-x divide-slate-100 dark:divide-slate-800 border-b border-slate-100 dark:border-slate-800">
              <div className="p-4 text-center">
                <p className="text-2xl font-black text-emerald-600">{passed}</p>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-1">Passed</p>
              </div>
              <div className="p-4 text-center">
                <p className="text-2xl font-black text-rose-600">{failed}</p>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-1">Failed</p>
              </div>
              <div className="p-4 text-center">
                <p className="text-2xl font-black text-amber-600">{blocked}</p>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-1">Blocked</p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Project</label>
                <input
                  type="text"
                  value={sessionForm.project}
                  onChange={(e) => setSessionForm((p) => ({ ...p, project: e.target.value }))}
                  className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Project name"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Sprint</label>
                <input
                  type="text"
                  value={sessionForm.sprint}
                  onChange={(e) => setSessionForm((p) => ({ ...p, sprint: e.target.value }))}
                  className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Sprint 5"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
                  Tester <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={sessionForm.tester}
                  onChange={(e) => setSessionForm((p) => ({ ...p, tester: e.target.value }))}
                  className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Notes</label>
                <textarea
                  value={sessionForm.notes}
                  onChange={(e) => setSessionForm((p) => ({ ...p, notes: e.target.value }))}
                  rows={2}
                  className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Optional session notes"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 p-6 pt-0">
              <button
                onClick={() => setShowModal(false)}
                disabled={loading}
                className="flex-1 h-11 rounded-md border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={saveResults}
                disabled={loading}
                className="flex-1 h-11 rounded-md bg-slate-900 dark:bg-white text-sm font-semibold text-white dark:text-slate-900 hover:bg-blue-600 dark:hover:bg-blue-50 transition disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save Session"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="animate-in fade-in slide-in-from-top-2 duration-500">
        <Breadcrumb
          crumbs={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Test Execution", href: "/test-execution" },
            { label: "Execute Session" },
          ]}
        />
      </div>

      <div className="rounded-md bg-white p-2 shadow-sm dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between px-6 py-5">
          <div className="flex items-center gap-5">
            <Link
              href="/test-execution"
              className="flex h-11 w-11 items-center justify-center rounded-md bg-slate-50 text-slate-400 transition hover:bg-blue-600 hover:text-white active:scale-90 dark:bg-slate-800"
            >
              <ArrowLeft size={20} weight="bold" />
            </Link>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Link
                  href="/test-suites"
                  className="text-xs font-semibold text-blue-700 hover:text-blue-600 uppercase tracking-widest transition-colors"
                >
                  Test Suites
                </Link>
                <div className="h-1 w-1 rounded-md bg-slate-300" />
                <span className="text-xs font-semibold tracking-widest text-slate-500 uppercase">
                  {suite.project}
                </span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white leading-none">
                {suite.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/test-cases/detail/${suiteToken}`}
              className="inline-flex h-11 items-center gap-2 rounded-md border border-blue-200 bg-white px-5 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 hover:border-blue-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
            >
              Add Test Case
            </Link>
            <div className="h-6 w-px bg-slate-200 mx-2 dark:bg-slate-700" />
            <button
              onClick={() => setShowModal(true)}
              disabled={total === 0}
              className="group relative inline-flex h-11 items-center gap-2 overflow-hidden rounded-md bg-slate-900 px-6 text-sm font-semibold text-white shadow-sm transition-all hover:bg-slate-800 active:scale-95 disabled:opacity-30 dark:bg-white dark:text-slate-900"
            >
              <CheckCircle
                size={18}
                weight="fill"
                className={cn(total > 0 ? "text-emerald-400" : "text-slate-400")}
              />
              Finish Session
            </button>
          </div>
        </div>

        {total > 0 && (
          <div className="px-6 pb-2">
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-md overflow-hidden">
              <div
                style={{ width: `${progress}%` }}
                className="bg-blue-600 h-full transition-all duration-1000"
              />
            </div>
            <div className="flex justify-between mt-2 mb-2">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                Progress: {progress}%
              </div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                {completed} of {total} Cases
              </div>
            </div>
          </div>
        )}
      </div>

      {total === 0 ? (
        <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-md border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900 shadow-sm">
          <div className="h-20 w-20 rounded-md bg-slate-50 flex items-center justify-center text-slate-400 mb-6 dark:bg-slate-800">
            <Database size={40} weight="duotone" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Suite is Empty</h3>
          <p className="mt-3 text-slate-600 max-w-md mx-auto text-base">
            This test suite doesn&apos;t have any scenarios yet. Add at least one test case to start
            execution.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
            <Link
              href={`/test-cases/detail/${suiteToken}`}
              className="inline-flex h-11 items-center gap-2 rounded-md bg-blue-600 px-6 font-semibold text-white shadow-sm transition duration-200 hover:bg-blue-700 active:scale-95"
            >
              Add Test Case <FastForward size={16} weight="bold" />
            </Link>
            <Link
              href="/test-execution"
              className="inline-flex h-11 items-center gap-2 rounded-md border border-slate-200 bg-white px-6 font-semibold text-slate-600 shadow-sm transition duration-200 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
            >
              Go Back
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                Scenarios ({items.length})
              </h3>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setAllStatus("Passed")}
                  className="p-1.5 rounded-md bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                  title="Mark All Pass"
                >
                  <CheckCircle size={14} weight="bold" />
                </button>
                <button
                  onClick={() => setAllStatus("Failed")}
                  className="p-1.5 rounded-md bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                  title="Mark All Fail"
                >
                  <XCircle size={14} weight="bold" />
                </button>
              </div>
            </div>

            <div className="max-h-[65vh] overflow-y-auto space-y-2 pr-2 scrollbar-thin">
              {items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  className={cn(
                    "group relative cursor-pointer overflow-hidden rounded-md border p-3.5 transition-all duration-200",
                    selectedId === item.id
                      ? "border-blue-600 bg-blue-50/50 ring-1 ring-blue-600 shadow-sm dark:bg-blue-950/20"
                      : "border-slate-200 bg-white hover:border-blue-300 dark:border-slate-800 dark:bg-slate-900",
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={cn(
                            "h-2 w-2 rounded-md",
                            item.status === "Passed"
                              ? "bg-emerald-500 shadow-[0_0_8px_#10b981]"
                              : item.status === "Failed"
                                ? "bg-rose-500 shadow-[0_0_8px_#f43f5e]"
                                : item.status === "Blocked"
                                  ? "bg-amber-500 shadow-[0_0_8px_#f59e0b]"
                                  : "bg-slate-300",
                          )}
                        />
                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                          {item.code}
                        </p>
                      </div>
                      <h4
                        className={cn(
                          "truncate text-sm font-semibold transition-colors",
                          selectedId === item.id
                            ? "text-blue-900 dark:text-white"
                            : "text-slate-700 dark:text-slate-300",
                        )}
                      >
                        {item.caseName}
                      </h4>
                    </div>
                    {(item.status === "Passed" ||
                      item.status === "Failed" ||
                      item.status === "Blocked") && (
                      <div
                        className={cn(
                          "flex h-6 w-6 items-center justify-center rounded-md text-white shadow-sm transition-transform animate-in zoom-in",
                          item.status === "Passed"
                            ? "bg-emerald-500"
                            : item.status === "Failed"
                              ? "bg-rose-500"
                              : "bg-amber-500",
                        )}
                      >
                        {item.status === "Passed" ? (
                          <CheckCircle size={14} weight="bold" />
                        ) : item.status === "Failed" ? (
                          <XCircle size={14} weight="bold" />
                        ) : (
                          <Warning size={14} weight="bold" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-md bg-slate-50 p-4 border border-slate-200 dark:bg-slate-800/50 dark:border-slate-700">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 uppercase mb-3">
                <Keyboard size={16} weight="bold" />
                Shortcuts
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs font-medium text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="bg-white px-1.5 py-0.5 rounded border border-slate-200 dark:bg-slate-800 dark:border-slate-700 font-mono text-slate-700 dark:text-slate-300">
                    P
                  </span>{" "}
                  Pass
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-white px-1.5 py-0.5 rounded border border-slate-200 dark:bg-slate-800 dark:border-slate-700 font-mono text-slate-700 dark:text-slate-300">
                    F
                  </span>{" "}
                  Fail
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-white px-1.5 py-0.5 rounded border border-slate-200 dark:bg-slate-800 dark:border-slate-700 font-mono text-slate-700 dark:text-slate-300">
                    B
                  </span>{" "}
                  Block
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-white px-1.5 py-0.5 rounded border border-slate-200 dark:bg-slate-800 dark:border-slate-700 font-mono text-slate-700 dark:text-slate-300">
                    ↓
                  </span>{" "}
                  Next
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-white px-1.5 py-0.5 rounded border border-slate-200 dark:bg-slate-800 dark:border-slate-700 font-mono text-slate-700 dark:text-slate-300">
                    ↑
                  </span>{" "}
                  Prev
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8">
            {selectedCase && (
              <div className="sticky top-6 flex flex-col gap-5">
                <div className="rounded-md border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-6 border-b border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-md bg-blue-600 text-white shadow-sm animate-pulse">
                        <Play size={24} weight="fill" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold tracking-widest text-slate-500 uppercase mb-1">
                          Execution Mode
                        </p>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                          {selectedCase.caseName}
                        </h2>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => updateStatus(selectedCase.id, "Passed", true)}
                        className={cn(
                          "flex h-11 w-24 items-center justify-center gap-2 rounded-md font-semibold text-sm transition-all active:scale-95",
                          selectedCase.status === "Passed"
                            ? "bg-emerald-500 text-white shadow-sm"
                            : "bg-emerald-50 hover:bg-emerald-500 hover:text-white text-emerald-600 border border-emerald-100",
                        )}
                      >
                        <CheckCircle size={18} weight="bold" /> PASS
                      </button>
                      <button
                        onClick={() => updateStatus(selectedCase.id, "Failed", true)}
                        className={cn(
                          "flex h-11 w-24 items-center justify-center gap-2 rounded-md font-semibold text-sm transition-all active:scale-95",
                          selectedCase.status === "Failed"
                            ? "bg-rose-500 text-white shadow-sm"
                            : "bg-rose-50 hover:bg-rose-500 hover:text-white text-rose-600 border border-rose-100",
                        )}
                      >
                        <XCircle size={18} weight="bold" /> FAIL
                      </button>
                      <button
                        onClick={() => updateStatus(selectedCase.id, "Blocked", true)}
                        className={cn(
                          "flex h-11 w-24 items-center justify-center gap-2 rounded-md font-semibold text-sm transition-all active:scale-95",
                          selectedCase.status === "Blocked"
                            ? "bg-amber-500 text-white shadow-sm"
                            : "bg-amber-50 hover:bg-amber-500 hover:text-white text-amber-600 border border-amber-100",
                        )}
                      >
                        <Warning size={18} weight="bold" /> BLOCK
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-8 md:grid-cols-2">
                    <div className="space-y-6">
                      <section>
                        <div className="flex items-center gap-2 mb-2.5">
                          <div className="h-1.5 w-1.5 rounded-md bg-slate-400" />
                          <h5 className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                            Pre-conditions
                          </h5>
                        </div>
                        <div className="text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-md border border-slate-200 dark:border-slate-700">
                          {selectedCase.preCondition || "No specific preconditions."}
                        </div>
                      </section>

                      <section>
                        <div className="flex items-center gap-2 mb-2.5">
                          <div className="h-1.5 w-1.5 rounded-md bg-blue-500" />
                          <h5 className="text-xs font-semibold uppercase tracking-widest text-blue-600">
                            Steps to Reproduce
                          </h5>
                        </div>
                        <div className="text-sm font-medium leading-relaxed text-slate-700 dark:text-slate-200 bg-blue-50/50 dark:bg-blue-950/10 p-5 rounded-md border border-blue-100 dark:border-blue-900/30 whitespace-pre-line shadow-inner">
                          {selectedCase.testStep}
                        </div>
                      </section>
                    </div>

                    <div className="space-y-6">
                      <section>
                        <div className="flex items-center gap-2 mb-2.5">
                          <div className="h-1.5 w-1.5 rounded-md bg-emerald-500" />
                          <h5 className="text-xs font-semibold uppercase tracking-widest text-emerald-600">
                            Expected Outcome
                          </h5>
                        </div>
                        <div className="text-sm font-medium leading-relaxed text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/10 p-5 rounded-md border border-emerald-100 dark:border-emerald-900/30">
                          {selectedCase.expectedResult}
                        </div>
                      </section>

                      <div className="rounded-md bg-slate-900 p-6 text-white shadow-sm dark:bg-black border border-slate-800">
                        <div className="flex items-center justify-between mb-4">
                          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                            Execution Verdict
                          </p>
                          {selectedCase.status && <Badge value={selectedCase.status} />}
                        </div>

                        <div className="mb-4">
                          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
                            Actual Result
                          </label>
                          <textarea
                            rows={2}
                            value={selectedCase.actualResult || ""}
                            onChange={(e) => updateActualResult(selectedCase.id, e.target.value)}
                            placeholder="What actually happened?"
                            className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateStatus(selectedCase.id, "Passed", true)}
                            className={cn(
                              "flex-1 group/btn h-14 rounded-md flex flex-col items-center justify-center gap-1 transition-all active:scale-95",
                              selectedCase.status === "Passed"
                                ? "bg-emerald-500 text-white shadow-sm"
                                : "bg-slate-800 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400 border border-slate-700",
                            )}
                          >
                            <CheckCircle
                              size={20}
                              weight={selectedCase.status === "Passed" ? "fill" : "bold"}
                            />
                            <span className="text-[10px] font-semibold uppercase tracking-widest">
                              Pass
                            </span>
                          </button>
                          <button
                            onClick={() => updateStatus(selectedCase.id, "Failed", true)}
                            className={cn(
                              "flex-1 group/btn h-14 rounded-md flex flex-col items-center justify-center gap-1 transition-all active:scale-95",
                              selectedCase.status === "Failed"
                                ? "bg-rose-500 text-white shadow-sm"
                                : "bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700",
                            )}
                          >
                            <XCircle
                              size={20}
                              weight={selectedCase.status === "Failed" ? "fill" : "bold"}
                            />
                            <span className="text-[10px] font-semibold uppercase tracking-widest">
                              Fail
                            </span>
                          </button>
                          <button
                            onClick={() => updateStatus(selectedCase.id, "Blocked", true)}
                            className={cn(
                              "flex-1 group/btn h-14 rounded-md flex flex-col items-center justify-center gap-1 transition-all active:scale-95",
                              selectedCase.status === "Blocked"
                                ? "bg-amber-500 text-white shadow-sm"
                                : "bg-slate-800 hover:bg-amber-500/20 text-slate-400 hover:text-amber-400 border border-slate-700",
                            )}
                          >
                            <Warning
                              size={20}
                              weight={selectedCase.status === "Blocked" ? "fill" : "bold"}
                            />
                            <span className="text-[10px] font-semibold uppercase tracking-widest">
                              Block
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between px-4 py-2">
                  <button
                    onClick={goToPrev}
                    disabled={selectedIndex === 0}
                    className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600 disabled:opacity-30 transition-colors"
                  >
                    <ArrowLeft size={16} weight="bold" /> PREVIOUS CASE
                  </button>
                  <button
                    onClick={goToNext}
                    disabled={selectedIndex === items.length - 1}
                    className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600 disabled:opacity-30 transition-colors"
                  >
                    NEXT CASE <FastForward size={16} weight="bold" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
