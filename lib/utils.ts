import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(value?: string | Date | null) {
  if (!value) return "-";
  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) return String(value);
    
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  } catch (e) {
    return String(value);
  }
}

export function toDateInput(value?: string | Date | null) {
  if (!value) return "";
  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) return "";
    return date.toISOString().slice(0, 10);
  } catch (e) {
    return "";
  }
}

export function normalizeMultiline(value: string) {
  return value.replace(/\r\n/g, "\n").trim();
}

export function codeFromId(prefix: string, id: number) {
  return `${prefix}-${String(id).padStart(3, "0")}`;
}
