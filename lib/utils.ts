import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

function normalizeDate(value: string | Date): Date {
  // SQLite stores "YYYY-MM-DD HH:MM:SS" (space). Browsers need ISO "T" separator.
  const normalized = typeof value === "string" ? value.replace(" ", "T") : value;
  return new Date(normalized);
}

export function formatDate(value?: string | Date | null) {
  if (!value) return "-";
  try {
    const date = normalizeDate(value);
    if (isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  } catch {
    return String(value);
  }
}

export function toDateInput(value?: string | Date | null) {
  if (!value) return "";
  try {
    const date = normalizeDate(value);
    if (isNaN(date.getTime())) return "";
    return date.toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

export function normalizeMultiline(value: string) {
  return value.replace(/\r\n/g, "\n").trim();
}

function formatDisplaySegment(segment: string): string {
  if (!segment) return segment;
  if (segment.includes("/")) {
    return segment
      .split("/")
      .map((part) => formatDisplaySegment(part))
      .join("/");
  }
  if (/^[A-Z0-9]{2,4}$/.test(segment)) return segment;
  return segment.slice(0, 1).toUpperCase() + segment.slice(1).toLowerCase();
}

export function formatDisplayText(value?: string | number | null): string {
  const text = String(value ?? "").trim();
  if (!text) return "-";
  const normalized = text
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return normalized.split(" ").map(formatDisplaySegment).join(" ");
}

export function codeFromId(prefix: string, id: number) {
  return `${prefix}-${String(id).padStart(3, "0")}`;
}
