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
  const defaultDuration = 2000;

  useEffect(() => {
    toastFn = (message, type, options) => {
      const id = Math.random().toString(36).substring(2, 9);
      const duration = options?.duration ?? defaultDuration;
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
    <div className="fixed right-8 top-8 z-[100] flex flex-col items-end gap-3">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="flex min-w-[300px] origin-top-right animate-in fade-in slide-in-from-top-2 slide-in-from-right-4 zoom-in-95 transform items-center gap-3 rounded-md border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800 p-4 shadow-xl duration-200"
        >
          {t.type === "success" && <CheckCircle size={24} className="text-emerald-500" weight="fill" />}
          {t.type === "error" && <WarningCircle size={24} className="text-rose-500" weight="fill" />}
          {t.type === "info" && <Info size={24} className="text-sky-500" weight="fill" />}
          
          <p className="flex-1 text-sm font-semibold text-slate-800 dark:text-slate-200">
            {t.message}
            {t.expiresAt ? ` ${Math.max(1, Math.ceil((t.expiresAt - Date.now()) / 1000))} seconds.` : ""}
          </p>
          {t.onAction && (
            <button
              onClick={() => {
                t.onAction?.();
                setToasts((prev) => prev.filter((toast) => toast.id !== t.id));
              }}
              className="rounded-md border border-sky-200 dark:border-sky-800 px-3 py-1 text-xs font-bold text-sky-700 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/30"
            >
              {t.actionLabel ?? "Undo"}
            </button>
          )}
          
          <button
            onClick={() => setToasts((prev) => prev.filter((toast) => toast.id !== t.id))}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
