import fs from "node:fs";
import path from "node:path";

const LOG_FILE = path.join(process.cwd(), "logs", "app.log");

export function friendlyErrorMessage(error: unknown, fallback: string): string {
  const raw = error instanceof Error ? error.message : String(error);
  if (raw.includes("already registered") || raw.includes("already exists")) return raw;
  if (/unique constraint/i.test(raw) && /email/i.test(raw)) return "Email address is already registered. Please use a different email.";
  if (/unique constraint/i.test(raw)) return "A record with the same value already exists. Please check for duplicates.";
  if (/ON CONFLICT/i.test(raw)) return "Unable to save due to a data conflict. Please try again.";
  if (/foreign key/i.test(raw)) return "This record is linked to other data and cannot be modified.";
  if (/not null/i.test(raw)) return "Please fill in all required fields.";
  return fallback;
}

export function logError(error: unknown, context: string) {
  const timestamp = new Date().toISOString();
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : "";
  
  const logEntry = `[${timestamp}] [ERROR] [${context}] ${message}\n${stack}\n---\n`;
  
  try {
    if (!fs.existsSync(path.join(process.cwd(), "logs"))) {
      fs.mkdirSync(path.join(process.cwd(), "logs"));
    }
    fs.appendFileSync(LOG_FILE, logEntry);
  } catch (err) {
    console.error("Failed to write log:", err);
  }
}

