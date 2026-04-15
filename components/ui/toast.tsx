"use client";

import { useState, useEffect } from "react";
import { CheckCircle, WarningCircle, X, Info } from "@phosphor-icons/react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

let toastFn: (message: string, type: ToastType) => void;

export function toast(message: string, type: ToastType = "success") {
  if (toastFn) toastFn(message, type);
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    toastFn = (message, type) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 5000);
    };
  }, []);

  return (
    <div className="fixed bottom-8 right-8 z-[100] flex flex-col gap-3">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="flex min-w-[300px] animate-in slide-in-from-right-10 fade-in-0 transform items-center gap-3 rounded-2xl border bg-white p-4 shadow-xl transition-all duration-300"
        >
          {t.type === "success" && <CheckCircle size={24} className="text-emerald-500" weight="fill" />}
          {t.type === "error" && <WarningCircle size={24} className="text-rose-500" weight="fill" />}
          {t.type === "info" && <Info size={24} className="text-sky-500" weight="fill" />}
          
          <p className="flex-1 text-sm font-semibold text-slate-800">{t.message}</p>
          
          <button
            onClick={() => setToasts((prev) => prev.filter((toast) => toast.id !== t.id))}
            className="text-slate-400 hover:text-slate-600"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
