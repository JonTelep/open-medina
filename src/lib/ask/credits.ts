// Firecrawl credit guardrails: a per-day call counter (America/New_York days) stored in SQLite.
// Cache hits never reach this file, so they never count.
import { sqlite } from "@/db";

sqlite.exec(`CREATE TABLE IF NOT EXISTS firecrawl_usage (
  day TEXT PRIMARY KEY,
  calls INTEGER NOT NULL DEFAULT 0,
  exhausted_at TEXT
)`);

export function etDay(d = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

export function dailyCap() {
  const n = Number(process.env.FIRECRAWL_DAILY_CAP);
  return Number.isFinite(n) && n >= 0 && process.env.FIRECRAWL_DAILY_CAP !== "" && process.env.FIRECRAWL_DAILY_CAP != null ? Math.floor(n) : 80;
}

const reserve = sqlite.prepare(
  `INSERT INTO firecrawl_usage (day, calls) VALUES (?, 1)
   ON CONFLICT(day) DO UPDATE SET calls = calls + 1
   WHERE firecrawl_usage.calls < ? AND firecrawl_usage.exhausted_at IS NULL`
);
const markStmt = sqlite.prepare(
  `INSERT INTO firecrawl_usage (day, calls, exhausted_at) VALUES (?, 0, ?)
   ON CONFLICT(day) DO UPDATE SET exhausted_at = excluded.exhausted_at`
);
const readStmt = sqlite.prepare("SELECT calls, exhausted_at FROM firecrawl_usage WHERE day = ?");

/** Reserve one Firecrawl call for today. False when today's cap is reached or credits ran out today. */
export function tryReserveCall(): boolean {
  const day = etDay();
  const cap = dailyCap();
  if (cap === 0) return false;
  return reserve.run(day, cap).changes > 0;
}

/** Firecrawl said we are out of credits or rate limited: rest until the next ET day. */
export function markExhausted() {
  markStmt.run(etDay(), new Date().toISOString());
}

export function usageToday() {
  const r = readStmt.get(etDay()) as { calls: number; exhausted_at: string | null } | undefined;
  return { calls: r?.calls ?? 0, cap: dailyCap(), exhausted: !!r?.exhausted_at };
}

export function searchAvailable() {
  const u = usageToday();
  return !u.exhausted && u.calls < u.cap && u.cap > 0;
}
