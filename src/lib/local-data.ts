// Live public data from official sources, stored in SQLite.
// Tables are created on demand so no migration is needed.
import { sqlite } from "@/db";

sqlite.exec(`
CREATE TABLE IF NOT EXISTS local_sources (
  key TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  last_attempt TEXT,
  last_success TEXT,
  last_error TEXT,
  record_count INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS local_population (
  geography TEXT NOT NULL,
  year INTEGER NOT NULL,
  population INTEGER NOT NULL,
  source_key TEXT NOT NULL,
  PRIMARY KEY (geography, year)
);
CREATE TABLE IF NOT EXISTS local_officials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  jurisdiction TEXT NOT NULL,
  body TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  term TEXT,
  sort INTEGER NOT NULL DEFAULT 0,
  source_key TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS local_agendas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  jurisdiction TEXT NOT NULL,
  title TEXT NOT NULL,
  meeting_date TEXT,
  url TEXT NOT NULL,
  minutes_url TEXT,
  source_key TEXT NOT NULL
);
`);

export interface LocalSource {
  key: string;
  name: string;
  url: string;
  last_attempt: string | null;
  last_success: string | null;
  last_error: string | null;
  record_count: number;
}

export function getSources(): LocalSource[] {
  return sqlite.prepare("SELECT * FROM local_sources ORDER BY name").all() as LocalSource[];
}

export function getSource(key: string): LocalSource | undefined {
  return sqlite.prepare("SELECT * FROM local_sources WHERE key = ?").get(key) as LocalSource | undefined;
}

export function getPopulation() {
  return sqlite
    .prepare("SELECT geography, year, population, source_key FROM local_population ORDER BY geography, year")
    .all() as { geography: string; year: number; population: number; source_key: string }[];
}

export function getOfficials() {
  return sqlite
    .prepare("SELECT * FROM local_officials ORDER BY jurisdiction, sort")
    .all() as { jurisdiction: string; body: string; name: string; role: string; term: string | null; source_key: string }[];
}

export function getAgendas(limit = 12) {
  return sqlite
    .prepare(
      "SELECT * FROM local_agendas WHERE id IN (SELECT id FROM local_agendas a WHERE (SELECT count(*) FROM local_agendas b WHERE b.jurisdiction = a.jurisdiction AND coalesce(b.meeting_date,'') > coalesce(a.meeting_date,'')) < ?) ORDER BY jurisdiction, meeting_date DESC"
    )
    .all(limit) as { jurisdiction: string; title: string; meeting_date: string | null; url: string; minutes_url: string | null; source_key: string }[];
}

/** Latest successful update across scraper_runs and local sources, as ISO string. */
export function lastUpdated(opts: { scrapers?: string[]; sources?: string[] }): string | null {
  const times: string[] = [];
  if (opts.scrapers?.length) {
    const ph = opts.scrapers.map(() => "?").join(",");
    try {
      const r = sqlite
        .prepare(`SELECT max(completed_at) AS t FROM scraper_runs WHERE status = 'completed' AND scraper_name IN (${ph})`)
        .get(...opts.scrapers) as { t: string | null } | undefined;
      if (r?.t) times.push(r.t);
    } catch {
      /* table may not exist yet */
    }
  }
  if (opts.sources?.length) {
    const ph = opts.sources.map(() => "?").join(",");
    const r = sqlite
      .prepare(`SELECT max(last_success) AS t FROM local_sources WHERE key IN (${ph})`)
      .get(...opts.sources) as { t: string | null } | undefined;
    if (r?.t) times.push(r.t);
  }
  if (!times.length) return null;
  return times.map((t) => new Date(t.includes("T") ? t : t.replace(" ", "T") + "Z")).sort((a, b) => +b - +a)[0]!.toISOString();
}

export function getAcs() {
  try {
    return sqlite.prepare("SELECT geography, year, measure, value, moe, variable FROM local_acs").all() as {
      geography: string; year: number; measure: string; value: number; moe: number; variable: string;
    }[];
  } catch {
    return [];
  }
}

export function getJurisdictions() {
  try {
    return sqlite.prepare("SELECT * FROM local_jurisdictions ORDER BY sort").all() as {
      name: string; kind: string; website: string | null; population: number | null; pop_year: number; pop_note: string | null;
    }[];
  } catch {
    return [];
  }
}

export { sqlite };
