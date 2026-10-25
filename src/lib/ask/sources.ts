// Ask Medina source configuration. Scope: Medina County, Ohio.
// Every domain below was confirmed as the real official site before use.

export type Jurisdiction = "city" | "village" | "township" | "county" | "state" | "federal" | "other";

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
  { match: "liverpooltwp.org", domain: "liverpooltwp.org", label: "Liverpool Township", jurisdiction: "township", weight: 10 },
  { match: "chippewalake.net", domain: "chippewalake.net", label: "Village of Chippewa Lake", jurisdiction: "village", weight: 10 },
  { match: "gloriaglens.org", domain: "gloriaglens.org", label: "Village of Gloria Glens Park", jurisdiction: "village", weight: 10 },
  { match: "villageoflodi.com", domain: "villageoflodi.com", label: "Village of Lodi", jurisdiction: "village", weight: 10 },
  { match: "villageofseville.org", domain: "villageofseville.org", label: "Village of Seville", jurisdiction: "village", weight: 10 },
  { match: "spencervillageohio.com", domain: "spencervillageohio.com", label: "Village of Spencer", jurisdiction: "village", weight: 10 },
  { match: "westfieldcenter.org", domain: "westfieldcenter.org", label: "Village of Westfield Center", jurisdiction: "village", weight: 10 },
  { match: "brunswickhillstwp.org", domain: "brunswickhillstwp.org", label: "Brunswick Hills Township", jurisdiction: "township", weight: 10 },
  { match: "chathamtwp.com", domain: "chathamtwp.com", label: "Chatham Township", jurisdiction: "township", weight: 10 },
  { match: "grangertwp.org", domain: "grangertwp.org", label: "Granger Township", jurisdiction: "township", weight: 10 },
  { match: "guilfordtownship.us", domain: "guilfordtownship.us", label: "Guilford Township", jurisdiction: "township", weight: 10 },
  { match: "harrisvilletwpohio.org", domain: "harrisvilletwpohio.org", label: "Harrisville Township", jurisdiction: "township", weight: 10 },
  { match: "hinckleytwp.org", domain: "hinckleytwp.org", label: "Hinckley Township", jurisdiction: "township", weight: 10 },
  { match: "homertwpohio.gov", domain: "homertwpohio.gov", label: "Homer Township", jurisdiction: "township", weight: 10 },
  { match: "lafayettetownshipoh.gov", domain: "lafayettetownshipoh.gov", label: "Lafayette Township", jurisdiction: "township", weight: 10 },
  { match: "litchfieldtownship.com", domain: "litchfieldtownship.com", label: "Litchfield Township", jurisdiction: "township", weight: 10 },
  { match: "medinatownship.com", domain: "medinatownship.com", label: "Medina Township", jurisdiction: "township", weight: 10 },
  { match: "montvilletwp.net", domain: "montvilletwp.net", label: "Montville Township", jurisdiction: "township", weight: 10 },
  { match: "sharontwp.org", domain: "sharontwp.org", label: "Sharon Township", jurisdiction: "township", weight: 10 },
  { match: "spencertownshipmedinacountyohio.com", domain: "spencertownshipmedinacountyohio.com", label: "Spencer Township", jurisdiction: "township", weight: 10 },
  { match: "wadsworthtownship.org", domain: "wadsworthtownship.org", label: "Wadsworth Township", jurisdiction: "township", weight: 10 },
  { match: "westfieldtownship.org", domain: "westfieldtownship.org", label: "Westfield Township", jurisdiction: "township", weight: 10 },
  { match: "yorktwp.org", domain: "yorktwp.org", label: "York Township", jurisdiction: "township", weight: 10 },
  { match: "rittman.com", domain: "rittman.com", label: "City of Rittman", jurisdiction: "city", weight: 10 },
  { match: "medinacounty.gov", domain: "medinacounty.gov", label: "Medina County", jurisdiction: "county", weight: 9 },
  { match: "boe.ohio.gov/medina", domain: "boe.ohio.gov", label: "Medina County Board of Elections", jurisdiction: "county", weight: 9 },
  { match: "ohiosos.gov", domain: "ohiosos.gov", label: "Ohio Secretary of State", jurisdiction: "state", weight: 7 },
];

export const SUGGESTED_QUESTIONS = [
  "When do the Liverpool Township trustees meet in Valley City?",
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
  if (/\bvalley city\b/.test(s)) return by("liverpooltwp.org");
  for (const b of BOOSTED_SOURCES) {
    if (b.jurisdiction !== "township" && b.jurisdiction !== "village") continue;
    const base = b.label.replace(/^Village of /, "").replace(/ Township$/, "").toLowerCase();
    const isTwp = b.jurisdiction === "township";
    if (isTwp ? new RegExp(`\\b${base} (township|twp)\\b`).test(s) : new RegExp(`\\b${base}\\b`).test(s)) return b;
  }
  if (/\brittman\b/.test(s)) return by("rittman.com");
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
