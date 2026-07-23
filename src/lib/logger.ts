/**
 * Lightweight, dependency-free structured logger.
 *
 * Works in every runtime Boosta targets (Node.js, Edge, browser) without
 * pulling in a logging library that breaks the Edge runtime. Output is
 * JSON in production (machine-parseable) and pretty in development.
 *
 * Usage:
 * ```ts
 * import { logger } from "@/lib/logger";
 * logger.info("order.created", { orderId });
 *
 * const log = logger.child({ module: "auth" });
 * log.warn("otp.retry", { attempts });
 * ```
 */

export const LOG_LEVELS = ["debug", "info", "warn", "error"] as const;
export type LogLevel = (typeof LOG_LEVELS)[number];

type LogContext = Record<string, unknown>;

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const isProduction = process.env.NODE_ENV === "production";
const isTest = process.env.NODE_ENV === "test";

/** Minimum level that will be emitted. Silent during tests by default. */
const minLevel: LogLevel = isTest
  ? "error"
  : ((process.env.LOG_LEVEL as LogLevel | undefined) ??
    (isProduction ? "info" : "debug"));

function shouldLog(level: LogLevel): boolean {
  return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[minLevel];
}

function serializeError(value: unknown): unknown {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
      ...(value.cause ? { cause: serializeError(value.cause) } : {}),
    };
  }
  return value;
}

function normalizeContext(context?: LogContext): LogContext | undefined {
  if (!context) return undefined;
  const out: LogContext = {};
  for (const [key, val] of Object.entries(context)) {
    out[key] = val instanceof Error ? serializeError(val) : val;
  }
  return out;
}

function emit(
  level: LogLevel,
  bindings: LogContext,
  message: string,
  context?: LogContext,
): void {
  if (!shouldLog(level)) return;

  const time = new Date().toISOString();
  const merged = { ...bindings, ...normalizeContext(context) };

  if (isProduction) {
    // Structured single-line JSON for log aggregators.
    const payload = JSON.stringify({ level, time, message, ...merged });
    consoleFor(level)(payload);
    return;
  }

  // Human-friendly output in development.
  const hasContext = Object.keys(merged).length > 0;
  consoleFor(level)(
    `${time} ${level.toUpperCase().padEnd(5)} ${message}`,
    hasContext ? merged : "",
  );
}

function consoleFor(level: LogLevel): (...args: unknown[]) => void {
  switch (level) {
    case "debug":
      return console.debug;
    case "info":
      return console.info;
    case "warn":
      return console.warn;
    case "error":
      return console.error;
  }
}

export interface Logger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext): void;
  /** Create a child logger that always includes the given bindings. */
  child(bindings: LogContext): Logger;
}

function createLogger(bindings: LogContext = {}): Logger {
  return {
    debug: (message, context) => emit("debug", bindings, message, context),
    info: (message, context) => emit("info", bindings, message, context),
    warn: (message, context) => emit("warn", bindings, message, context),
    error: (message, context) => emit("error", bindings, message, context),
    child: (childBindings) => createLogger({ ...bindings, ...childBindings }),
  };
}

/** The application-wide root logger. */
export const logger: Logger = createLogger();
