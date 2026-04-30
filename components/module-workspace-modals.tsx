"use client";

import { WarningCircle } from "@phosphor-icons/react";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { AutoResizeTextarea } from "@/components/ui/auto-resize-textarea";

type ModuleWorkspaceModalsProps = {
  deleteOpen: boolean;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
  reopenOpen: boolean;
  reopenReason: string;
  onReopenReasonChange: (value: string) => void;
  onReopenCancel: () => void;
  onReopenConfirm: () => void | Promise<void>;
};

export function ModuleWorkspaceModals({
  deleteOpen,
  onDeleteConfirm,
  onDeleteCancel,
  reopenOpen,
  reopenReason,
  onReopenReasonChange,
  onReopenCancel,
  onReopenConfirm,
}: ModuleWorkspaceModalsProps) {
  return (
    <>
      <ConfirmModal
        isOpen={deleteOpen}
        title="Delete Item"
        message="Are you sure you want to delete this item? This action cannot be undone."
        type="danger"
        confirmText="Delete"
        onConfirm={onDeleteConfirm}
        onCancel={onDeleteCancel}
      />

      {reopenOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={onReopenCancel} />
          <div className="relative w-full max-w-sm overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 duration-150 dark:border-slate-700 dark:bg-slate-900">
            <div className="px-5 pt-5 pb-4">
              <div className="mb-3 flex items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-amber-500 text-white">
                  <WarningCircle size={16} weight="bold" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">Re-open Bug</h3>
                  <p className="text-[11px] text-slate-400">Status will be set back to Open</p>
                </div>
              </div>
              <label className="block">
                <span className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Reason for Re-opening
                </span>
                <AutoResizeTextarea
                  value={reopenReason}
                  onChange={(e) => onReopenReasonChange(e.target.value)}
                  placeholder="Describe why this bug needs to be re-opened…"
                  className="w-full"
                />
              </label>
            </div>
            <div className="flex gap-2 px-5 pb-5">
              <button
                onClick={onReopenCancel}
                className="flex-1 h-9 rounded-md border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={onReopenConfirm}
                className="flex-1 h-9 rounded-md bg-amber-500 text-xs font-bold text-white transition hover:bg-amber-600"
              >
                Re-open Bug
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
