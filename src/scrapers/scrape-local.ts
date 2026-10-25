/**
 * Live data from official public sources for Medina County, Ohio.
 *
 * Usage:
 *   tsx src/scrapers/scrape-local.ts            # all jobs
 *   tsx src/scrapers/scrape-local.ts elections  # election job only
 *
 * Each job records its source URL, last attempt, last success and last error in
 * the local_sources table. A job that fails or parses nothing never wipes data.
 */
import * as cheerio from "cheerio";
import { sqlite } from "@/lib/local-data";

const UA =
  "Mozilla/5.0 (compatible; OpenMedinaBot/1.0; +https://openmedina.org/about) civic data project";

async function get(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml,text/csv,*/*" },
    redirect: "follow",
    signal: AbortSignal.timeout(60000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

const now = () => new Date().toISOString();

function record(key: string, name: string, url: string, ok: boolean, count: number, error?: string) {
  const t = now();
  sqlite
    .prepare(
      `INSERT INTO local_sources (key, name, url, last_attempt, last_success, last_error, record_count)
       VALUES (@key, @name, @url, @t, @succ, @err, @count)
       ON CONFLICT(key) DO UPDATE SET name=@name, url=@url, last_attempt=@t,
         last_success=COALESCE(@succ, last_success), last_error=@err,
         record_count=CASE WHEN @succ IS NULL THEN record_count ELSE @count END`
    )
    .run({ key, name, url, t, succ: ok ? t : null, err: ok ? null : (error ?? "unknown error").slice(0, 500), count });
}

type Job = { key: string; name: string; url: string; run: () => Promise<number> };

function textLines(html: string): string[] {
  const $ = cheerio.load(html);
  $("script,style,noscript").remove();
  $("br,p,div,li,h1,h2,h3,h4,h5,h6,td,th,tr,a,span,strong").each((_, el) => {
    $(el).prepend("\n").append("\n");
  });
  return $("body")
    .text()
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function replaceRows(table: string, sourceKey: string, insert: () => void) {
  sqlite.transaction(() => {
    sqlite.prepare(`DELETE FROM ${table} WHERE source_key = ?`).run(sourceKey);
    insert();
  })();
}

// ── Census population estimates ─────────────────────────────────────
function parseCsv(text: string): string[][] {
  return text
    .split(/\r?\n/)
    .filter(Boolean)
    .map((l) => l.split(",").map((c) => c.replace(/^"|"$/g, "")));
}

const CENSUS_COUNTY = "https://www2.census.gov/programs-surveys/popest/datasets/2020-2025/counties/totals/co-est2025-alldata.csv";
const CENSUS_CITIES = "https://www2.census.gov/programs-surveys/popest/datasets/2020-2025/cities/totals/sub-est2025.csv";

async function censusCounty(): Promise<number> {
  const rows = parseCsv(await get(CENSUS_COUNTY));
  const h = rows[0]!;
  const r = rows.find((x) => x[h.indexOf("STATE")] === "39" && x[h.indexOf("COUNTY")] === "103");
  if (!r || !/Medina County/.test(r[h.indexOf("CTYNAME")] ?? "")) throw new Error("Medina County row not found");
  const vals = h
    .map((col, i) => ({ col, i }))
    .filter(({ col }) => /^POPESTIMATE20\d\d$/.test(col))
    .map(({ col, i }) => ({ year: Number(col.slice(-4)), pop: Number(r[i]) }))
    .filter((v) => v.pop > 0);
  replaceRows("local_population", "census-county", () => {
    const ins = sqlite.prepare("INSERT OR REPLACE INTO local_population (geography, year, population, source_key, source_url, verified_at) VALUES (?, ?, ?, 'census-county', ?, ?)");
    const t = now();
    for (const v of vals) ins.run("Medina County", v.year, v.pop, CENSUS_COUNTY, t);
  });
  return vals.length;
}

// ── ACS 5-year estimates (Census API, key from env, never stored in URLs we save) ──
export const ACS_URL = "https://api.census.gov/data/2024/acs/acs5";
const ACS_VARS = [
  { measure: "Median household income", table: "", v: "B19013_001" },
  { measure: "Median home value", table: "", v: "B25077_001" },
  { measure: "Poverty rate", table: "/subject", v: "S1701_C03_001" },
  { measure: "Bachelor's degree or higher (age 25+)", table: "/subject", v: "S1501_C02_015" },
];
const ACS_GEOS = [
  { name: "Medina County", q: "for=county:103&in=state:39" },
  { name: "City of Medina", q: "for=place:48790&in=state:39" },
  { name: "City of Brunswick", q: "for=place:09680&in=state:39" },
  { name: "City of Wadsworth", q: "for=place:80304&in=state:39" },
];
async function censusAcs(): Promise<number> {
  const key = process.env.CENSUS_API_KEY;
  if (!key) throw new Error("CENSUS_API_KEY not set");
  const rows: [string, number, string, number, number, string, string, string][] = [];
  for (const g of ACS_GEOS)
    for (const a of ACS_VARS) {
      const res = await fetch(`${ACS_URL}${a.table}?get=NAME,${a.v}E,${a.v}M&${g.q}&key=${key}`, { signal: AbortSignal.timeout(60000) });
      if (!res.ok) throw new Error(`Census API HTTP ${res.status} for ${a.v}`);
      const [, r] = (await res.json()) as string[][];
      const val = Number(r![1]);
      if (!Number.isFinite(val) || val < 0) throw new Error(`Census API returned no value for ${g.name} ${a.v}`);
      rows.push([g.name, 2024, a.measure, val, Number(r![2]), a.v + "E", `${ACS_URL}${a.table}?get=NAME,${a.v}E,${a.v}M&${g.q}`, now()]);
    }
  const ins = sqlite.prepare("INSERT OR REPLACE INTO local_acs (geography, year, measure, value, moe, variable, source_url, verified_at, source_key) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'census-acs')");
  sqlite.transaction(() => rows.forEach((r) => ins.run(...r)))();
  return rows.length;
}

async function censusCities(): Promise<number> {
  const rows = parseCsv(await get(CENSUS_CITIES));
  const h = rows[0]!;
  const want = ["Medina city", "Brunswick city", "Wadsworth city"];
  let n = 0;
  const found: { name: string; year: number; pop: number }[] = [];
  for (const r of rows) {
    if (r[h.indexOf("STATE")] !== "39" || r[h.indexOf("SUMLEV")] !== "162") continue;
    const name = r[h.indexOf("NAME")] ?? "";
    if (!want.includes(name)) continue;
    h.forEach((col, i) => {
      if (/^POPESTIMATE20\d\d$/.test(col) && Number(r[i]) > 0)
        found.push({ name: "City of " + name.replace(" city", ""), year: Number(col.slice(-4)), pop: Number(r[i]) });
    });
  }
  if (new Set(found.map((f) => f.name)).size !== 3) throw new Error("Expected 3 cities in Census file");
  replaceRows("local_population", "census-cities", () => {
    const ins = sqlite.prepare("INSERT OR REPLACE INTO local_population (geography, year, population, source_key, source_url, verified_at) VALUES (?, ?, ?, 'census-cities', ?, ?)");
    const t = now();
    for (const f of found) (ins.run(f.name, f.year, f.pop, CENSUS_CITIES, t), n++);
  });
  return n;
}

// ── City councils ───────────────────────────────────────────────────
type Official = { name: string; role: string; term?: string };

function saveOfficials(key: string, jurisdiction: string, list: Official[]) {
  if (list.length < 3) throw new Error(`Parsed only ${list.length} officials, page layout may have changed`);
  replaceRows("local_officials", key, () => {
    const ins = sqlite.prepare(
      "INSERT INTO local_officials (jurisdiction, body, name, role, term, sort, source_key, source_url, verified_at) VALUES (?, 'City Council', ?, ?, ?, ?, ?, ?, ?)"
    );
    const url = { "medina-council": MEDINA_COUNCIL, "brunswick-council": BRUNSWICK_COUNCIL, "wadsworth-council": WADSWORTH_COUNCIL }[key] ?? null;
    const t = now();
    list.forEach((o, i) => ins.run(jurisdiction, o.name, o.role, o.term ?? null, i, key, url, t));
  });
  return list.length;
}

const MEDINA_COUNCIL = "https://medinaoh.org/city-hall/city-council/";
async function medinaCouncil() {
  const L = textLines(await get(MEDINA_COUNCIL));
  const out: Official[] = [];
  for (let i = 0; i < L.length - 2; i++) {
    const role = L[i]!;
    if (!/^(President of Council|Ward \d+ Council Representative|.*At[- ]Large.*)$/i.test(role)) continue;
    if (!/^Term expires/i.test(L[i + 2]!)) continue;
    const name = L[i + 1]!;
    if (name.length > 40 || out.some((o) => o.name === name)) continue;
    out.push({ name, role: role.replace(" Council Representative", ""), term: L[i + 2]!.replace(/^Term expires\s*/i, "Term expires ") });
  }
  return saveOfficials("medina-council", "City of Medina", out);
}

const BRUNSWICK_COUNCIL = "https://www.brunswick.oh.us/city-council/";
async function brunswickCouncil() {
  const L = textLines(await get(BRUNSWICK_COUNCIL));
  const out: Official[] = [];
  for (let i = 1; i < L.length; i++) {
    const role = L[i]!;
    if (!/^(Council Ward \d+|Council-at-Large|Council President|President of Council|Clerk of Council)$/i.test(role)) continue;
    const name = L[i - 1]!;
    if (!/^[A-Z][A-Za-z.' -]+$/.test(name) || name.length > 40 || out.some((o) => o.name === name)) continue;
    out.push({ name, role: role.replace(/^Council /, "") });
  }
  return saveOfficials("brunswick-council", "City of Brunswick", out);
}

const WADSWORTH_COUNCIL = "https://www.wadsworthcity.com/461/City-Council";
async function wadsworthCouncil() {
  const L = textLines(await get(WADSWORTH_COUNCIL));
  const out: Official[] = [];
  for (const l of L) {
    const m = l.match(/^([A-Z][A-Za-z.' -]+), (President|At-Large|Ward \d+|Council Clerk)$/);
    if (m && !out.some((o) => o.name === m[1])) out.push({ name: m[1]!, role: m[2]! });
  }
  return saveOfficials("wadsworth-council", "City of Wadsworth", out);
}

// ── Agendas ─────────────────────────────────────────────────────────
type Agenda = { title: string; date: string | null; url: string; minutes?: string | null };

function saveAgendas(key: string, jurisdiction: string, list: Agenda[]) {
  if (!list.length) throw new Error("No agendas parsed, page layout may have changed");
  replaceRows("local_agendas", key, () => {
    const ins = sqlite.prepare(
      "INSERT INTO local_agendas (jurisdiction, title, meeting_date, url, minutes_url, source_key) VALUES (?, ?, ?, ?, ?, ?)"
    );
    for (const a of list) ins.run(jurisdiction, a.title, a.date, a.url, a.minutes ?? null, key);
  });
  return list.length;
}

const WADSWORTH_AGENDAS = "https://www.wadsworthcity.com/AgendaCenter";
async function wadsworthAgendas() {
  const $ = cheerio.load(await get(WADSWORTH_AGENDAS));
  const out: Agenda[] = [];
  $("tr.catAgendaRow").each((_, tr) => {
    const row = $(tr);
    const a = row.find('a[href*="/AgendaCenter/ViewFile/Agenda/"]').first();
    const href = a.attr("href");
    if (!href) return;
    const label = row.find("strong[aria-label]").attr("aria-label") ?? "";
    const d = label.replace(/^Agenda for /, "");
    const parsed = d ? new Date(d + " 12:00 UTC") : null;
    const minutes = row.find('a[href*="/AgendaCenter/ViewFile/Minutes/"]').attr("href");
    const abs = (h: string) => new URL(h, WADSWORTH_AGENDAS).toString();
    if (out.some((o) => o.url === abs(href))) return;
    out.push({
      title: a.text().replace(/\s+/g, " ").trim(),
      date: parsed && !isNaN(+parsed) ? parsed.toISOString().slice(0, 10) : null,
      url: abs(href),
      minutes: minutes ? abs(minutes) : null,
    });
  });
  return saveAgendas("wadsworth-agendas", "City of Wadsworth", out);
}

function medinaAgendaUrl() {
  return `https://medinaoh.org/city-hall/city-council/clerk-of-council/${new Date().getFullYear()}-finance-agendas/`;
}
async function medinaAgendas() {
  const url = medinaAgendaUrl();
  const $ = cheerio.load(await get(url));
  const out: Agenda[] = [];
  $('a[href$=".pdf"]').each((_, el) => {
    // The source page has at least one href with the URL written twice; keep the last full URL.
    const raw = $(el).attr("href")!;
    const href = raw.lastIndexOf("https://") > 0 ? raw.slice(raw.lastIndexOf("https://")) : raw;
    const t = $(el).text().trim();
    const m = t.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (!m || !/Finance-Agenda/i.test(href)) return;
    out.push({ title: "Finance Committee Agenda", date: `${m[3]}-${m[1]}-${m[2]}`, url: href });
  });
  return saveAgendas("medina-agendas", "City of Medina", out);
}

// ── All jurisdictions: Medina County Public Officials Directory (official county PDF) ──
export const COUNTY_DIRECTORY = "https://www.medinaco.org/wp-content/uploads/2026-Public-Officials-Directory_0926.pdf";
const SUB_EST = "https://www2.census.gov/programs-surveys/popest/datasets/2020-2025/cities/totals/sub-est2025.csv";
const ROLE_HEADINGS: Record<string, string> = {
  "MAYOR": "Mayor", "FISCAL OFFICER": "Fiscal Officer", "CLERK TREASURER": "Clerk Treasurer",
  "CLERK OF COUNCIL": "Clerk of Council", "TRUSTEES": "Trustee", "COUNCIL MEMBERS": "Council Member",
  "PRESIDENT OF COUNCIL": "President of Council", "COUNCIL PRESIDENT": "President of Council",
};
async function countyDirectory(): Promise<number> {
  // medinaco.org challenges automated requests that identify themselves, so we do not fetch it on a
  // schedule. This is a text copy of the official September 2026 PDF, retrieved Oct 24, 2026.
  const { readFileSync } = await import("node:fs");
  const text = readFileSync(`${process.cwd()}/src/data/county-directory-2026-09.txt`, "utf8");

  type J = { name: string; kind: string; website?: string; people: { role: string; name: string }[] };
  const js: J[] = [];
  let cur: J | null = null;
  let role: string | null = null;
  for (const raw of text.split("\n")) {
    const line = raw.replace(/[\x00-\x08\x0b-\x1f]/g, "");
    const t = line.trim();
    const head = t.match(/^(VILLAGE OF [A-Z ]+|CITY OF [A-Z]+|[A-Z ]+ TOWNSHIP)$/);
    if (head && line.startsWith("  ")) {
      const h = head[1]!;
      const title = (x: string) => x.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
      const name = h.startsWith("VILLAGE OF ") ? `Village of ${title(h.slice(11))}` : h.startsWith("CITY OF ") ? `City of ${title(h.slice(8))}` : title(h);
      cur = { name, kind: h.startsWith("VILLAGE") ? "village" : h.startsWith("CITY") ? "city" : "township", people: [] };
      js.push(cur);
      role = null;
      continue;
    }
    if (!cur) continue;
    if (!cur.website && /^(www\.)?[A-Za-z]+\.(org|com|net|gov|us|oh\.us)$/i.test(t)) {
      cur.website = "https://" + t.toLowerCase().replace(/^www\./, "www.");
      continue;
    }
    const rh = t.match(/^([A-Z][A-Z /&.,'-]+):$/);
    if (rh) { role = ROLE_HEADINGS[rh[1]!] ?? null; continue; }
    if (!role || !/^\s{1,8}\S/.test(line)) { if (!t) continue; if (!/^\s/.test(line)) role = null; continue; }
    let nm = t.split(/\.{2,}|\uFFFD|\s{2,}|\d{3}-\d{3}/)[0]!.trim().replace(/[.\s]+$/, "");
    let r = role;
    const paren = nm.match(/ \((At-Large|Ward \d)\)$/);
    if (paren) { nm = nm.slice(0, paren.index); r = `${role}, ${paren[1]}`; }
    const comma = nm.indexOf(", ");
    if (comma > 0) {
      const extra = nm.slice(comma + 2);
      if (/clerk/i.test(extra)) r = "Clerk of Council";
      if (!/^(Jr|Sr|II|III)\b/.test(extra)) nm = nm.slice(0, comma);
    }
    if (!/^[A-Z][A-Za-z.'-]+( [A-Z(][A-Za-z.'()-]*\.?)+(,? (Jr|Sr|II|III)\.?)?$/.test(nm) || /position|vacant|not currently/i.test(nm)) continue;
    cur.people.push({ role: r, name: nm.replace(/\.\.$/, ".") });
  }
  const townships = js.filter((j) => j.kind === "township");
  if (townships.length !== 17) throw new Error(`Expected 17 townships in county directory, found ${townships.length}`);

  // Census sub-county estimates: townships (SUMLEV 061) and places (SUMLEV 162).
  const csv = await get(SUB_EST);
  const [hdr, ...rows] = csv.trim().split(/\r?\n/).map((l) => l.split(","));
  const h = hdr!;
  const col = (r: string[], c: string) => r[h.indexOf(c)]!;
  const pop = (pred: (r: string[]) => boolean) => rows.find(pred);
  const insJ = sqlite.prepare("INSERT OR REPLACE INTO local_jurisdictions (name, kind, website, population, pop_year, pop_note, sort, source_url, verified_at) VALUES (?, ?, ?, ?, 2025, ?, ?, ?, ?)");
  const insO = sqlite.prepare("INSERT INTO local_officials (jurisdiction, body, name, role, term, source_key, source_url, verified_at) VALUES (?, ?, ?, ?, NULL, 'county-directory', ?, ?)");
  let n = 0;
  const t = now();
  sqlite.transaction(() => {
    sqlite.prepare("DELETE FROM local_officials WHERE source_key = 'county-directory'").run();
    js.forEach((j, i) => {
      const base = j.name.replace(/^(Village|City) of /, "").replace(/ Township$/, "");
      let p: string[] | undefined;
      let note: string | null = null;
      if (j.kind === "township")
        p = pop((r) => col(r, "STATE") === "39" && col(r, "COUNTY") === "103" && col(r, "SUMLEV") === "061" && col(r, "NAME") === `${base} township`);
      else {
        const suffix = j.kind === "city" ? "city" : "village";
        p = pop((r) => col(r, "STATE") === "39" && col(r, "SUMLEV") === "162" && col(r, "NAME").replace(/"/g, "") === `${base} ${suffix}`);
        if (base === "Gloria Glens") p = pop((r) => col(r, "STATE") === "39" && col(r, "SUMLEV") === "162" && col(r, "NAME") === "Gloria Glens Park village");
        if (base === "Rittman") {
          const part = pop((r) => col(r, "STATE") === "39" && col(r, "COUNTY") === "103" && col(r, "SUMLEV") === "071" && col(r, "NAME") === "Rittman city (pt.)");
          note = part ? "Total city population. Part of Rittman is in Medina County; most of the city is in Wayne County." : null;
        }
      }
      if (j.kind === "township") note = "Census township estimate. Includes unincorporated communities and any village that is part of the township.";
      if (base === "Liverpool") note = "Census township estimate. Includes the unincorporated community of Valley City.";
      insJ.run(j.name, j.kind, j.website ?? null, p ? Number(col(p, "POPESTIMATE2025")) : null, note, j.name.startsWith("Liverpool") ? -1 : i, p ? SUB_EST : null, p ? t : null);
      for (const o of j.people) { insO.run(j.name, j.kind === "township" ? "Board of Trustees" : "Village/City Council", o.name, o.role, COUNTY_DIRECTORY, t); n++; }
    });
  })();
  return n;
}

// ── Elections (Medina County Board of Elections) ────────────────────
const BOE = "https://boe.ohio.gov/medina/";
async function elections(): Promise<number> {
  const html = await get(BOE);
  if (/Website Maintenance|Just a moment/i.test(html)) throw new Error("Board of Elections site blocked automated access");
  // Parsing is intentionally not attempted until the page can be fetched reliably.
  throw new Error("Board of Elections page fetched but no parser is configured yet");
}

const JOBS: Record<string, Job[]> = {
  census: [
    { key: "census-county", name: "U.S. Census Bureau population estimates (Medina County)", url: CENSUS_COUNTY, run: censusCounty },
    { key: "census-acs", name: "U.S. Census Bureau American Community Survey 5-year estimates, 2020 to 2024", url: ACS_URL, run: censusAcs },
    { key: "census-cities", name: "U.S. Census Bureau population estimates (cities)", url: CENSUS_CITIES, run: censusCities },
  ],
  councils: [
    { key: "medina-council", name: "City of Medina, City Council", url: MEDINA_COUNCIL, run: medinaCouncil },
    { key: "brunswick-council", name: "City of Brunswick, City Council", url: BRUNSWICK_COUNCIL, run: brunswickCouncil },
    { key: "wadsworth-council", name: "City of Wadsworth, City Council", url: WADSWORTH_COUNCIL, run: wadsworthCouncil },
  ],
  agendas: [
    { key: "wadsworth-agendas", name: "City of Wadsworth, Agenda Center", url: WADSWORTH_AGENDAS, run: wadsworthAgendas },
    { key: "medina-agendas", name: "City of Medina, Finance Committee agendas", url: medinaAgendaUrl(), run: medinaAgendas },
  ],
  directory: [{ key: "county-directory", name: "Medina County Public Officials Directory, 2026", url: COUNTY_DIRECTORY, run: countyDirectory }],
  elections: [{ key: "boe-medina", name: "Medina County Board of Elections", url: BOE, run: elections }],
};

export async function scrapeLocal(groups = Object.keys(JOBS)) {
  let failures = 0;
  for (const g of groups) {
    for (const job of JOBS[g] ?? []) {
      try {
        const n = await job.run();
        record(job.key, job.name, job.url, true, n);
        console.log(`[local] ${job.key}: ok, ${n} records`);
      } catch (e) {
        failures++;
        const msg = e instanceof Error ? e.message : String(e);
        record(job.key, job.name, job.url, false, 0, msg);
        console.error(`[local] ${job.key}: FAILED ${msg}`);
      }
    }
  }
  return failures;
}

if (process.argv[1]?.includes("scrape-local")) {
  const groups = process.argv.slice(2);
  scrapeLocal(groups.length ? groups : undefined).then((f) => {
    console.log(`[local] done at ${now()} with ${f} failure(s)`);
    process.exit(0);
  });
}
