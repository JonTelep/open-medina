// First-party, privacy-friendly analytics. No cookies, no IP, no user agent stored.
import { sqlite } from "@/db/index";

sqlite.exec(`CREATE TABLE IF NOT EXISTS page_views (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts TEXT NOT NULL,
  path TEXT NOT NULL,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  referrer_host TEXT,
  device TEXT
);
CREATE INDEX IF NOT EXISTS page_views_ts ON page_views(ts);
CREATE TABLE IF NOT EXISTS signup_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts TEXT NOT NULL,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT
);`);

const clip = (v: unknown, n = 100) => {
  const s = typeof v === "string" ? v.trim().toLowerCase() : "";
  return s ? s.slice(0, n) : null;
};

export const BOT_RE = /bot|crawl|spider|slurp|preview|facebookexternalhit|meta-externalagent|headless|lighthouse|pingdom|uptime|monitor|curl|wget|python|go-http|java\/|axios|node-fetch|httpclient|scrapy|semrush|ahrefs|bingpreview|embedly|whatsapp|telegram|discord|slack/i;

export function deviceOf(ua: string): string {
  if (/ipad|tablet/i.test(ua)) return "tablet";
  if (/mobi|iphone|android/i.test(ua)) return "mobile";
  return "desktop";
}

export function recordView(v: { path: string; utm_source?: string; utm_medium?: string; utm_campaign?: string; referrer_host?: string; device?: string }) {
  sqlite
    .prepare("INSERT INTO page_views (ts, path, utm_source, utm_medium, utm_campaign, referrer_host, device) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .run(new Date().toISOString(), String(v.path).slice(0, 300), clip(v.utm_source), clip(v.utm_medium), clip(v.utm_campaign), clip(v.referrer_host, 200), clip(v.device, 10));
}

export function recordSignup(b: Record<string, string>) {
  sqlite
    .prepare("INSERT INTO signup_events (ts, utm_source, utm_medium, utm_campaign) VALUES (?, ?, ?, ?)")
    .run(new Date().toISOString(), clip(b.utm_source), clip(b.utm_medium), clip(b.utm_campaign));
}

type Row = Record<string, string | number | null>;
const q = (sql: string, ...a: unknown[]) => sqlite.prepare(sql).all(...a) as Row[];

export function stats() {
  const now = Date.now();
  const day = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00Z").toISOString();
  const week = new Date(now - 7 * 864e5).toISOString();
  const one = (sql: string, a: string) => (sqlite.prepare(sql).get(a) as { c: number }).c;
  return {
    today: one("SELECT count(*) c FROM page_views WHERE ts >= ?", day),
    week: one("SELECT count(*) c FROM page_views WHERE ts >= ?", week),
    signupsWeek: one("SELECT count(*) c FROM signup_events WHERE ts >= ?", week),
    daily: q("SELECT substr(ts,1,10) day, count(*) views FROM page_views WHERE ts >= ? GROUP BY day ORDER BY day DESC", week),
    pages: q("SELECT path, count(*) views FROM page_views WHERE ts >= ? GROUP BY path ORDER BY views DESC LIMIT 25", week),
    sources: q(
      `SELECT s, c, sum(v) views, sum(g) signups FROM (
         SELECT coalesce(utm_source,'(none)') s, coalesce(utm_campaign,'(none)') c, 1 v, 0 g FROM page_views WHERE ts >= ?
         UNION ALL SELECT coalesce(utm_source,'(none)'), coalesce(utm_campaign,'(none)'), 0, 1 FROM signup_events WHERE ts >= ?
       ) GROUP BY s, c ORDER BY views DESC LIMIT 25`,
      week, week,
    ),
    referrers: q("SELECT referrer_host host, count(*) views FROM page_views WHERE ts >= ? AND referrer_host IS NOT NULL GROUP BY host ORDER BY views DESC LIMIT 25", week),
    devices: q("SELECT coalesce(device,'?') device, count(*) views FROM page_views WHERE ts >= ? GROUP BY device ORDER BY views DESC", week),
  };
}
