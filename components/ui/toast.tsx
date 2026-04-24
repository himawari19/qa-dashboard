"use client";

import { useEffect, useState } from "react";
import { CheckCircle, WarningCircle, X, Info } from "@phosphor-icons/react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  expiresAt?: number;
  actionLabel?: string;
  onAction?: () => void;
}

type ToastOptions = {
  duration?: number;
  countdown?: boolean;
  actionLabel?: string;
  onAction?: () => void;
};

let toastFn: (message: string, type: ToastType, options?: ToastOptions) => void;

export function toast(message: string, type: ToastType = "success", options?: ToastOptions) {
  if (toastFn) toastFn(message, type, options);
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [, forceTick] = useState(0);

  useEffect(() => {
    toastFn = (message, type, options) => {
      const id = Math.random().toString(36).substring(2, 9);
      const duration = options?.duration ?? 5000;
      setToasts((prev) => [...prev, {
        id,
        message,
        type,
        expiresAt: options?.countdown ? Date.now() + duration : undefined,
        actionLabel: options?.actionLabel,
        onAction: options?.onAction,
      }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => forceTick((v) => v + 1), 250);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed bottom-8 right-8 z-[100] flex flex-col gap-3">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="flex min-w-[300px] animate-in slide-in-from-right-10 fade-in-0 transform items-center gap-3 rounded-md border bg-white p-4 shadow-xl transition-all duration-300"
        >
          {t.type === "success" && <CheckCircle size={24} className="text-emerald-500" weight="fill" />}
          {t.type === "error" && <WarningCircle size={24} className="text-rose-500" weight="fill" />}
          {t.type === "info" && <Info size={24} className="text-sky-500" weight="fill" />}
          
          <p className="flex-1 text-sm font-semibold text-slate-800">
            {t.message}
            {t.expiresAt ? ` ${Math.max(1, Math.ceil((t.expiresAt - Date.now()) / 1000))} seconds.` : ""}
          </p>
          {t.onAction && (
            <button
              onClick={() => {
                t.onAction?.();
                setToasts((prev) => prev.filter((toast) => toast.id !== t.id));
              }}
              className="rounded-md border border-sky-200 px-3 py-1 text-xs font-bold text-sky-700 hover:bg-sky-50"
            >
              {t.actionLabel ?? "Undo"}
            </button>
          )}
          
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
