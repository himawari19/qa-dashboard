"use client";

import { cn } from "@/lib/utils";

export function HighlightText({ 
  text, 
  query 
}: { 
  text: string; 
  query: string 
}) {
  if (!query.trim()) return <span>{text}</span>;

  // Escape special regex characters to prevent crashes
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escapedQuery})`, "gi"));

  return (
    <span>
      {parts.map((part, i) => (
        <span
          key={i}
          className={
            part.toLowerCase() === query.toLowerCase()
              ? "bg-sky-100 text-sky-900 font-bold px-0.5 rounded-sm"
              : ""
          }
        >
          {part}
        </span>
      ))}
    </span>
  );
}
