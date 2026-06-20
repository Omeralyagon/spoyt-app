import "server-only";

/**
 * Minimal structured logger. Emits one JSON line per event so Vercel / any log
 * drain can parse it. Never throws.
 */
type Level = "info" | "warn" | "error";

export interface LogFields {
  action: string;
  status: "ok" | "error";
  userId?: string | null;
  durationMs?: number;
  errorCode?: string;
  errorMessage?: string;
  [key: string]: unknown;
}

export function log(level: Level, fields: LogFields) {
  try {
    const record = { ts: new Date().toISOString(), level, ...fields };
    // eslint-disable-next-line no-console
    console[level](JSON.stringify(record));
  } catch {
    /* logging must never break the request */
  }
}

/** Wraps an async unit of work with timing + structured success/error logs. */
export async function withLog<T>(
  action: string,
  userId: string | null | undefined,
  fn: () => Promise<T>,
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    log("info", { action, status: "ok", userId, durationMs: Date.now() - start });
    return result;
  } catch (e) {
    log("error", {
      action,
      status: "error",
      userId,
      durationMs: Date.now() - start,
      errorMessage: (e as Error)?.message ?? String(e),
    });
    throw e;
  }
}
