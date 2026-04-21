"use client";

import { useState } from "react";
import { DownloadSimple, Spinner } from "@phosphor-icons/react";

export function ApiTestingSeedButton() {
  const [loading, setLoading] = useState(false);

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
    <button
      type="button"
      onClick={() => void loadDemo()}
      disabled={loading}
      className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-sky-700 px-5 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? <Spinner size={16} className="animate-spin" /> : <DownloadSimple size={16} weight="bold" />}
      Load Demo API
    </button>
  );
}
