// Ask Medina source configuration. Scope: Medina County, Ohio.
// Every domain below was confirmed as the real official site before use.

export type Jurisdiction = "city" | "county" | "state" | "federal" | "other";

export interface BoostedSource {
  /** Host (and optional path prefix) that identifies the source */
  match: string;
  /** Domain passed to Firecrawl's `domain` param */
  domain: string;
  label: string;
  jurisdiction: Jurisdiction;
  /** Higher sorts first */
  weight: number;
}

export const BOOSTED_SOURCES: BoostedSource[] = [
  { match: "codelibrary.amlegal.com/codes/medina", domain: "codelibrary.amlegal.com", label: "Medina City Codified Ordinances", jurisdiction: "city", weight: 10 },
  { match: "medinaoh.org", domain: "medinaoh.org", label: "City of Medina", jurisdiction: "city", weight: 10 },
  { match: "brunswick.oh.us", domain: "brunswick.oh.us", label: "City of Brunswick", jurisdiction: "city", weight: 10 },
  { match: "wadsworthcity.com", domain: "wadsworthcity.com", label: "City of Wadsworth", jurisdiction: "city", weight: 10 },
  { match: "medinacounty.gov", domain: "medinacounty.gov", label: "Medina County", jurisdiction: "county", weight: 9 },
  { match: "boe.ohio.gov/medina", domain: "boe.ohio.gov", label: "Medina County Board of Elections", jurisdiction: "county", weight: 9 },
  { match: "ohiosos.gov", domain: "ohiosos.gov", label: "Ohio Secretary of State", jurisdiction: "state", weight: 7 },
];

export const SUGGESTED_QUESTIONS = [
  "How do I register to vote in Medina County?",
  "Do I need a permit to build a fence in the city of Medina?",
  "What property tax levies are on the ballot in Medina County?",
  "Where is the Medina County Board of Elections?",
  "How do I get a building permit in Brunswick?",
  "When is trash pickup in Wadsworth?",
];

const ELECTION_RE = /\b(vot(e|er|ers|ing)|ballot|ballots|election|elections|poll(s|ing)?|absentee|candidate|candidates|levy|levies|primary|early vote|precinct|registration|register to vote)\b/i;
const FEDERAL_RE = /\b(federal|irs|social security|medicare|medicaid|passport|fema|usps|post office|veterans affairs|\bva\b|congress|senator|u\.s\.|united states|immigration|uscis|fafsa|sba|snap)\b/i;

export function isElectionQuery(q: string) {
  return ELECTION_RE.test(q);
}

export function isFederalQuery(q: string) {
  return FEDERAL_RE.test(q);
}

/** Pick at most one targeted source to query directly, based on what the question mentions. */
export function targetedSource(q: string): BoostedSource | null {
  const s = q.toLowerCase();
  const by = (m: string) => BOOSTED_SOURCES.find((b) => b.match === m) ?? null;
  if (/\bbrunswick\b/.test(s)) return by("brunswick.oh.us");
  if (/\bwadsworth\b/.test(s)) return by("wadsworthcity.com");
  if (isElectionQuery(s)) return by("boe.ohio.gov/medina");
  if (/\b(ordinance|code|zoning|permit|fence|setback|noise|parking)\b/.test(s) && /\bcity\b|\bmedina\b/.test(s)) {
    return by("codelibrary.amlegal.com/codes/medina");
  }
  return by("medinacounty.gov");
}

export function matchSource(url: string): BoostedSource | null {
  let hostPath = "";
  try {
    const u = new URL(url);
    hostPath = (u.hostname.replace(/^www\./, "") + u.pathname).toLowerCase();
  } catch {
    return null;
  }
  for (const b of BOOSTED_SOURCES) {
    const [host = "", ...rest] = b.match.split("/");
    const path = rest.length ? "/" + rest.join("/") : "";
    const [h = "", ...p] = hostPath.split("/");
    const pth = "/" + p.join("/");
    if ((h === host || h.endsWith("." + host)) && (!path || pth.startsWith(path))) return b;
  }
  return null;
}

/** Best guess at a result's jurisdiction for the badge. */
export function jurisdictionFor(url: string): { jurisdiction: Jurisdiction; label: string } {
  const b = matchSource(url);
  if (b) return { jurisdiction: b.jurisdiction, label: b.label };
  let host = "";
  try {
    host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return { jurisdiction: "other", label: "Other" };
  }
  if (/(^|\.)ohio\.gov$/.test(host) || host.endsWith(".oh.us")) return { jurisdiction: "state", label: "State of Ohio" };
  if (host.endsWith(".gov") || host.endsWith(".mil") || host.endsWith(".fed.us")) return { jurisdiction: "federal", label: "Federal" };
  return { jurisdiction: "other", label: "Other" };
}
