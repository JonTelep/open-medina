import { createHash } from "crypto";
import { sqlite } from "@/db";
import {
  BOOSTED_SOURCES,
  isElectionQuery,
  isFederalQuery,
  jurisdictionFor,
  matchSource,
  targetedSource,
  type Jurisdiction,
} from "./sources";

const ENDPOINT = "https://api.firecrawl.dev/v2/search/gov";
const COUNTY_CONTEXT = "Medina County Ohio";
const DAY_MS = 24 * 60 * 60 * 1000;

export interface AskResult {
  title: string;
  url: string;
  domain: string;
  snippet: string;
  jurisdiction: Jurisdiction;
  sourceLabel: string;
  boosted: boolean;
}

export interface AskResponse {
  query: string;
  scope: "medina-county-oh" | "us-federal-fallback";
  results: AskResult[];
  cached: boolean;
  fetchedAt: string;
}

export class UpstreamError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

// ── SQLite cache ────────────────────────────────────────────────────
sqlite.exec(`CREATE TABLE IF NOT EXISTS ask_cache (
  key TEXT PRIMARY KEY,
  query TEXT NOT NULL,
  response TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
)`);

const getStmt = sqlite.prepare("SELECT response, created_at FROM ask_cache WHERE key = ? AND expires_at > ?");
const putStmt = sqlite.prepare(
  "INSERT OR REPLACE INTO ask_cache (key, query, response, created_at, expires_at) VALUES (?, ?, ?, ?, ?)"
);
const pruneStmt = sqlite.prepare("DELETE FROM ask_cache WHERE expires_at <= ?");

function normalize(q: string) {
  return q.toLowerCase().replace(/\s+/g, " ").trim();
}

// ── Firecrawl ───────────────────────────────────────────────────────
interface FirecrawlWeb {
  url: string;
  title?: string;
  description?: string;
}

async function firecrawl(params: Record<string, string>): Promise<FirecrawlWeb[]> {
  const url = `${ENDPOINT}?${new URLSearchParams(params).toString()}`;
  const headers: Record<string, string> = { Accept: "application/json" };
  const key = process.env.FIRECRAWL_API_KEY;
  if (key) headers.Authorization = `Bearer ${key}`;
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(15000), cache: "no-store" });
  let body: { success?: boolean; error?: string; data?: { web?: FirecrawlWeb[] } } = {};
  try {
    body = await res.json();
  } catch {
    /* ignore */
  }
  if (!res.ok || body.success === false) {
    const limited = res.status === 429 || /rate limit|credits/i.test(body.error ?? "");
    throw new UpstreamError(
      limited ? "The search service is busy right now. Please try again later." : "The search service returned an error.",
      limited ? 429 : 502
    );
  }
  return body.data?.web ?? [];
}

function toResult(w: FirecrawlWeb): AskResult | null {
  if (!w?.url) return null;
  let domain = "";
  try {
    domain = new URL(w.url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
  const j = jurisdictionFor(w.url);
  const boosted = matchSource(w.url);
  return {
    title: (w.title || domain).trim(),
    url: w.url,
    domain,
    snippet: (w.description || "").replace(/\s+/g, " ").trim().slice(0, 400),
    jurisdiction: j.jurisdiction,
    sourceLabel: j.label,
    boosted: !!boosted,
  };
}

/** Drop results from other Ohio counties' pages on shared hosts (e.g. boe.ohio.gov/hardin). */
function inScope(r: AskResult) {
  if (r.domain === "boe.ohio.gov") return /boe\.ohio\.gov\/medina/i.test(r.url);
  if (r.domain === "codelibrary.amlegal.com") return /\/codes\/medina\//i.test(r.url);
  return true;
}

const J_RANK: Record<Jurisdiction, number> = { city: 4, village: 4, township: 4, county: 4, state: 2, federal: 1, other: 0 };

function rank(results: AskResult[]) {
  const weight = (r: AskResult) => (matchSource(r.url)?.weight ?? 0) * 10 + J_RANK[r.jurisdiction];
  return results
    .map((r, i) => ({ r, i }))
    .sort((a, b) => weight(b.r) - weight(a.r) || a.i - b.i)
    .map((x) => x.r);
}

export async function askMedina(rawQuery: string): Promise<AskResponse> {
  const query = rawQuery.replace(/\s+/g, " ").trim().slice(0, 200);
  const federal = isFederalQuery(query);
  const key = createHash("sha256").update(normalize(query)).digest("hex");
  const now = Date.now();

  const hit = getStmt.get(key, now) as { response: string; created_at: number } | undefined;
  if (hit) {
    return { ...(JSON.parse(hit.response) as AskResponse), cached: true };
  }

  const k = "8";
  const contextual = /medina county/i.test(query) ? `${query} Ohio` : `${query} ${COUNTY_CONTEXT}`;
  const seen = new Set<string>();
  let results: AskResult[] = [];
  const add = (list: FirecrawlWeb[]) => {
    for (const w of list) {
      const r = toResult(w);
      if (!r || !inScope(r)) continue;
      const id = r.url.replace(/[#?].*$/, "").replace(/\/$/, "");
      if (seen.has(id)) continue;
      seen.add(id);
      results.push(r);
    }
  };

  // 1) Ohio search with Medina County context
  add(await firecrawl({ query: contextual, k, jurisdiction: "us-oh" }));

  // 2) If no boosted local source came back, ask the most relevant one directly
  if (!federal && !results.some((r) => r.boosted)) {
    const t = targetedSource(query);
    if (t) {
      try {
        add(await firecrawl({ query: contextual, k: "5", jurisdiction: "us-oh", domain: t.domain }));
      } catch (e) {
        if (!results.length) throw e;
      }
    }
  }

  // 3) Federal fallback: US-wide search for federal questions or when Ohio found nothing
  let scope: AskResponse["scope"] = "medina-county-oh";
  if (federal || results.length === 0) {
    try {
      const before = results.length;
      add(await firecrawl({ query, k: "6" }));
      if (results.length > before && (federal || before === 0)) scope = "us-federal-fallback";
    } catch (e) {
      if (!results.length) throw e;
    }
  }

  results = rank(results).slice(0, 12);
  const response: AskResponse = {
    query,
    scope,
    results,
    cached: false,
    fetchedAt: new Date(now).toISOString(),
  };

  if (results.length) {
    const ttl = isElectionQuery(query) ? DAY_MS : 7 * DAY_MS;
    putStmt.run(key, normalize(query), JSON.stringify(response), now, now + ttl);
    if (Math.random() < 0.05) pruneStmt.run(now);
  }
  return response;
}

export { BOOSTED_SOURCES };
