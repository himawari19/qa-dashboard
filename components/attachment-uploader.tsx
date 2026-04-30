"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Paperclip, Link, X, Image, FilePdf, ArrowSquareOut } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export type Attachment = { type: "file" | "link"; url: string; name: string };

interface AttachmentUploaderProps {
  value: Attachment[];
  onChange: (items: Attachment[]) => void;
  disabled?: boolean;
}

function AttachmentIcon({ type, url }: { type: string; url: string }) {
  if (type === "link") return <Link size={13} weight="bold" className="shrink-0 text-blue-500" />;
  if (url.match(/\.(png|jpe?g|gif|webp)$/i)) return <Image size={13} weight="bold" className="shrink-0 text-emerald-500" />;
  if (url.match(/\.pdf$/i)) return <FilePdf size={13} weight="bold" className="shrink-0 text-red-500" />;
  return <Paperclip size={13} weight="bold" className="shrink-0 text-slate-400" />;
}

export function AttachmentUploader({ value, onChange, disabled }: AttachmentUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [linkInput, setLinkInput] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [drag, setDrag] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Ctrl+V paste from clipboard
  useEffect(() => {
    const handler = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) await uploadFile(file);
        }
      }
    };
    document.addEventListener("paste", handler);
    return () => document.removeEventListener("paste", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const uploadFile = useCallback(async (file: File) => {
    if (disabled) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.url) {
        onChange([...value, { type: "file", url: data.url, name: file.name }]);
      }
    } catch { /* ignore */ }
    setUploading(false);
  }, [value, onChange, disabled]);

  const addLink = () => {
    const url = linkInput.trim();
    if (!url) return;
    const name = url.replace(/^https?:\/\//, "").split("/")[0];
    onChange([...value, { type: "link", url, name }]);
    setLinkInput("");
    setShowLinkInput(false);
  };

  const remove = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-2">
      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={async e => {
          e.preventDefault(); setDrag(false);
          for (const file of Array.from(e.dataTransfer.files)) await uploadFile(file);
        }}
        className={cn(
          "relative flex min-h-[60px] cursor-pointer flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed transition-colors text-center px-4 py-3",
          drag ? "border-sky-400 bg-sky-50/60 dark:bg-sky-900/20" : "border-slate-200 dark:border-slate-700 hover:border-sky-300",
          disabled ? "opacity-50 pointer-events-none" : "",
        )}
        onClick={() => fileInputRef.current?.click()}
      >
        <Paperclip size={16} weight="bold" className={cn("shrink-0", drag ? "text-sky-500" : "text-slate-400")} />
        <p className="text-[10px] font-semibold text-slate-400 leading-relaxed">
          {uploading ? "Uploading…" : "Drop files here, click to browse, or Ctrl+V to paste"}
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf"
          multiple
          className="hidden"
          onChange={async e => {
            for (const file of Array.from(e.target.files ?? [])) await uploadFile(file);
            e.target.value = "";
          }}
        />
      </div>

      {/* Link input */}
      <div className="flex items-center gap-2">
        {showLinkInput ? (
          <>
            <input
              type="url"
              value={linkInput}
              onChange={e => setLinkInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addLink(); } }}
              placeholder="https://…"
              autoFocus
              className="flex-1 h-8 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-sky-400"
            />
            <button type="button" onClick={addLink} className="h-8 rounded-md bg-sky-600 px-3 text-xs font-bold text-white hover:bg-sky-700 transition">Add</button>
            <button type="button" onClick={() => setShowLinkInput(false)} className="h-8 px-2 text-slate-400 hover:text-slate-600 transition"><X size={13} weight="bold" /></button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setShowLinkInput(true)}
            disabled={disabled}
            className="flex h-7 items-center gap-1.5 rounded-md border border-slate-200 dark:border-slate-700 px-2.5 text-[11px] font-semibold text-slate-500 hover:border-sky-400 hover:text-sky-600 transition"
          >
            <Link size={12} weight="bold" /> Add link
          </button>
        )}
      </div>

      {/* Attachment list */}
      {value.length > 0 && (
        <div className="space-y-1">
          {value.map((att, idx) => (
            <div key={idx} className="flex items-center gap-2 rounded-md border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5 px-2.5 py-1.5">
              <AttachmentIcon type={att.type} url={att.url} />
              <a
                href={att.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-w-0 text-[11px] font-medium text-slate-700 dark:text-slate-200 truncate hover:text-sky-600 hover:underline"
              >
                {att.name}
              </a>
              <a href={att.url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-slate-300 hover:text-sky-500 transition">
                <ArrowSquareOut size={12} weight="bold" />
              </a>
              {!disabled && (
                <button type="button" onClick={() => remove(idx)} className="shrink-0 text-slate-300 hover:text-red-500 transition">
                  <X size={12} weight="bold" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
