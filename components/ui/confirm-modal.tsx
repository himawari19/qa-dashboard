"use client";

import { useEffect, useState } from "react";
import { Warning, X, Check } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "info" | "warning";
}

export function ConfirmModal({
  isOpen,
  title = "Confirmation",
  message,
  onConfirm,
  onCancel,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "warning"
}: ConfirmModalProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShow(true);
    } else {
      const timer = setTimeout(() => setShow(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen && !show) return null;

  return (
    <div className={cn(
      "fixed inset-0 z-[200] flex items-center justify-center p-4 transition-all duration-300",
      isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
    )}>
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={onCancel} />
      
      <div className={cn(
        "relative w-full max-w-sm transform overflow-hidden rounded-xl bg-white dark:bg-slate-900 shadow-2xl transition-all duration-300 border border-slate-200 dark:border-slate-700",
        isOpen ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
      )}>
        <div className="flex flex-col items-center text-center px-6 pt-6 pb-4">
          <div className={cn(
            "mb-3 flex h-10 w-10 items-center justify-center rounded-lg text-white",
            type === "danger" ? "bg-red-600" :
            type === "warning" ? "bg-amber-500" :
            "bg-blue-600"
          )}>
            {type === "danger" ? <X size={20} weight="bold" /> :
             type === "warning" ? <Warning size={20} weight="bold" /> :
             <Check size={20} weight="bold" />}
          </div>
          <h3 className="mb-1 text-base font-black text-slate-900 dark:text-white">{title}</h3>
          <p className="text-xs font-medium leading-relaxed text-slate-500 dark:text-slate-400">{message}</p>
        </div>
        <div className="flex gap-2 px-6 pb-5">
          <button
            onClick={onCancel}
            className="flex-1 h-9 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 transition hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95"
          >
            {cancelText}
          </button>
          <button
            onClick={() => { onConfirm(); onCancel(); }}
            className={cn(
              "flex-1 h-9 rounded-md text-xs font-bold text-white transition active:scale-95",
              type === "danger" ? "bg-red-600 hover:bg-red-700" :
              type === "warning" ? "bg-amber-500 hover:bg-amber-600" :
              "bg-blue-600 hover:bg-blue-700"
            )}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
