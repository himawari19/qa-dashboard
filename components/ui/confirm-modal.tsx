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
        "relative w-full max-w-md transform overflow-hidden rounded-[24px] bg-white p-8 shadow-2xl transition-all duration-300",
        isOpen ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
      )}>
        <div className="flex flex-col items-center text-center">
          <div className={cn(
            "mb-6 flex h-16 w-16 items-center justify-center rounded-full text-white shadow-lg",
            type === "danger" ? "bg-rose-500 shadow-rose-200" : 
            type === "warning" ? "bg-amber-500 shadow-amber-200" : 
            "bg-sky-500 shadow-sky-200"
          )}>
            {type === "danger" ? <X size={32} weight="bold" /> : 
             type === "warning" ? <Warning size={32} weight="bold" /> : 
             <Check size={32} weight="bold" />}
          </div>
          
          <h3 className="mb-2 text-xl font-bold text-slate-900">{title}</h3>
          <p className="mb-8 text-sm font-medium leading-relaxed text-slate-500">
            {message}
          </p>
          
          <div className="flex w-full gap-3">
            <button
              onClick={onCancel}
              className="flex-1 h-12 rounded-2xl border border-slate-200 bg-white text-sm font-bold text-slate-600 transition hover:bg-slate-50 active:scale-95"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onCancel();
              }}
              className={cn(
                "flex-1 h-12 rounded-2xl text-sm font-bold text-white shadow-md transition active:scale-95",
                type === "danger" ? "bg-rose-600 hover:bg-rose-700 shadow-rose-200" : 
                type === "warning" ? "bg-amber-600 hover:bg-amber-700 shadow-amber-200" : 
                "bg-sky-700 hover:bg-sky-800 shadow-sky-200"
              )}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
