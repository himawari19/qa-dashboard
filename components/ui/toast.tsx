"use client";

import { useEffect, useState } from"react";
import { CheckCircle, WarningCircle, X, Info } from"@phosphor-icons/react";

type ToastType ="success" |"error" |"info";

interface Toast {
 id: string;
 signature: string;
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

type ToastHandler = (message: string, type: ToastType, options?: ToastOptions) => void;

let toastFn: ToastHandler | undefined;
const activeToastSignatures = new Set<string>();

function buildToastSignature(message: string, type: ToastType, options?: ToastOptions) {
 return [
  type,
  message,
  options?.duration ?? 2000,
  options?.countdown ? 1 : 0,
  options?.actionLabel ??"",
  options?.onAction ? 1 : 0,
 ].join("|");
}

export function toast(message: string, type: ToastType ="success", options?: ToastOptions) {
 if (!toastFn) return;

 const signature = buildToastSignature(message, type, options);
 if (activeToastSignatures.has(signature)) return;

 toastFn(message, type, options);
}

export function Toaster() {
 const [toasts, setToasts] = useState<Toast[]>([]);
 const [, forceTick] = useState(0);
 const defaultDuration = 2000;

 useEffect(() => {
 const handler: ToastHandler = (message, type, options) => {
 const id = Math.random().toString(36).substring(2, 9);
 const signature = buildToastSignature(message, type, options);
 const duration = options?.duration ?? defaultDuration;
 activeToastSignatures.add(signature);
 setToasts((prev) => [...prev, {
 id,
 signature,
 message,
 type,
 expiresAt: options?.countdown ? Date.now() + duration : undefined,
 actionLabel: options?.actionLabel,
 onAction: options?.onAction,
 }]);
 setTimeout(() => {
 activeToastSignatures.delete(signature);
 setToasts((prev) => prev.filter((t) => t.id !== id));
 }, duration);
 };
 toastFn = handler;
 return () => {
  if (toastFn === handler) {
   toastFn = undefined;
  }
  activeToastSignatures.clear();
 };
 }, []);

 useEffect(() => {
 const timer = setInterval(() => forceTick((v) => v + 1), 250);
 return () => clearInterval(timer);
 }, []);

 return (
 <div className="fixed bottom-6 left-1/2 z-[100] flex -translate-x-1/2 flex-col items-center gap-3">
 {toasts.slice(-3).map((t) => (
 <div
 key={t.id}
 className="flex min-w-[300px] max-w-md origin-bottom animate-in fade-in slide-in-from-bottom-2 zoom-in-95 transform items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-2xl duration-200"
 >
 {t.type ==="success" && <CheckCircle size={24} className="text-emerald-500" weight="fill" />}
 {t.type ==="error" && <WarningCircle size={24} className="text-rose-500" weight="fill" />}
 {t.type ==="info" && <Info size={24} className="text-sky-500" weight="fill" />}
 
 <p className="flex-1 text-sm font-semibold text-slate-800">
 {t.message}
 {t.expiresAt ?` ${Math.max(1, Math.ceil((t.expiresAt - Date.now()) / 1000))} seconds.` :""}
 </p>
 {t.onAction && (
 <button
 onClick={() => {
 t.onAction?.();
 setToasts((prev) => prev.filter((toast) => toast.id !== t.id));
 }}
 className="rounded-md border border-sky-200 px-3 py-1 text-xs font-bold text-sky-700 hover:bg-sky-50"
 >
 {t.actionLabel ??"Undo"}
 </button>
 )}
 
 <button
 onClick={() => {
  activeToastSignatures.delete(t.signature);
  setToasts((prev) => prev.filter((toast) => toast.id !== t.id));
 }}
 className="text-slate-400 hover:text-slate-600"
 >
 <X size={16} />
 </button>
 </div>
 ))}
 </div>
 );
}
