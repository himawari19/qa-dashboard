/**
 * Structured logger for QA Hub.
 * Outputs JSON in production, readable format in development.
 * No external dependencies — uses built-in console with structured data.
 */

type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const MIN_LEVEL = LOG_LEVELS[(process.env.LOG_LEVEL as LogLevel) || "info"] ?? 1;
const IS_PROD = process.env.NODE_ENV === "production";

let requestCounter = 0;

function getTraceId(): string {
  return `${Date.now().toString(36)}-${(++requestCounter).toString(36)}`;
}

function formatMessage(level: LogLevel, message: string, meta?: Record<string, unknown>): string {
  if (IS_PROD) {
    return JSON.stringify({
      ts: new Date().toISOString(),
      level,
      msg: message,
      ...meta,
    });
  }
  const prefix = `[${level.toUpperCase().padEnd(5)}]`;
  const metaStr = meta && Object.keys(meta).length > 0
    ? ` ${JSON.stringify(meta)}`
    : "";
  return `${prefix} ${message}${metaStr}`;
}

export const logger = {
  debug(message: string, meta?: Record<string, unknown>) {
    if (LOG_LEVELS.debug < MIN_LEVEL) return;
    console.debug(formatMessage("debug", message, meta));
  },

  info(message: string, meta?: Record<string, unknown>) {
    if (LOG_LEVELS.info < MIN_LEVEL) return;
    console.info(formatMessage("info", message, meta));
  },

  warn(message: string, meta?: Record<string, unknown>) {
    if (LOG_LEVELS.warn < MIN_LEVEL) return;
    console.warn(formatMessage("warn", message, meta));
  },

  error(message: string, error?: unknown, meta?: Record<string, unknown>) {
    if (LOG_LEVELS.error < MIN_LEVEL) return;
    const errorMeta: Record<string, unknown> = { ...meta };
    if (error instanceof Error) {
      errorMeta.errorName = error.name;
      errorMeta.errorMessage = error.message;
      if (!IS_PROD) {
        errorMeta.stack = error.stack;
      }
    } else if (error !== undefined) {
      errorMeta.errorRaw = String(error);
    }
    console.error(formatMessage("error", message, errorMeta));
  },

  /** Create a child logger with bound context */
  child(context: Record<string, unknown>) {
    return {
      debug: (msg: string, meta?: Record<string, unknown>) => logger.debug(msg, { ...context, ...meta }),
      info: (msg: string, meta?: Record<string, unknown>) => logger.info(msg, { ...context, ...meta }),
      warn: (msg: string, meta?: Record<string, unknown>) => logger.warn(msg, { ...context, ...meta }),
      error: (msg: string, err?: unknown, meta?: Record<string, unknown>) => logger.error(msg, err, { ...context, ...meta }),
    };
  },

  traceId: getTraceId,
};

/**
 * Extract a user-friendly error message from an unknown error.
 * Falls back to the provided default message.
 */
export function friendlyErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    // Expose validation/constraint messages but not internal errors
    const msg = error.message;
    if (
      msg.includes("UNIQUE constraint") ||
      msg.includes("duplicate key") ||
      msg.includes("is required") ||
      msg.includes("already exists") ||
      msg.includes("not found")
    ) {
      return msg;
    }
  }
  return fallback;
}

/**
 * Log an error with context (convenience wrapper around logger.error).
 */
export function logError(error: unknown, context: string): void {
  logger.error(context, error);
}
