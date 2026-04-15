import fs from "node:fs";
import path from "node:path";

const LOG_FILE = path.join(process.cwd(), "logs", "app.log");

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

export function logInfo(message: string, context: string) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [INFO] [${context}] ${message}\n`;
  
  try {
    if (!fs.existsSync(path.join(process.cwd(), "logs"))) {
      fs.mkdirSync(path.join(process.cwd(), "logs"));
    }
    fs.appendFileSync(LOG_FILE, logEntry);
  } catch (err) {
    console.error("Failed to write log:", err);
  }
}
