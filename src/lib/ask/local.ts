// Local-first answers for Ask Medina: searches OpenMedina's own verified data.
// Works with zero Firecrawl credits. Every result links to an on-site page and its official source.
// Snippets are plain words only; figures stay on the linked pages behind <Sourced>.
import { sqlite } from "@/db";
import { BALLOT, explain, type Issue } from "@/lib/ballot";
import { COUNTY_BUDGET, pageUrl } from "@/lib/county-budget";

export interface LocalResult {
  title: string;
  /** On-site page */
  href: string;
  snippet: string;
  kind: "ballot" | "community" | "official" | "bill" | "budget";
  /** Official source the on-site page is built from */
  sourceUrl?: string;
  sourceLabel?: string;
}

const STOP = new Set(
  "a an and are as at be by can do does for from get how i in is it me my of on or the to what when where which who why will with you your about there this that ohio medina county oh near tell".split(" ")
);

function tokens(q: string) {
  return q
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP.has(t));
}

// Communities, in the same order and names the site uses.
const COMMUNITY_NAMES = [
  "City of Brunswick", "City of Medina", "City of Rittman", "City of Wadsworth",
  "Village of Chippewa Lake", "Village of Gloria Glens Park", "Village of Lodi", "Village of Seville",
  "Village of Spencer", "Village of Westfield Center",
  "Brunswick Hills Township", "Chatham Township", "Granger Township", "Guilford Township", "Harrisville Township",
  "Hinckley Township", "Homer Township", "Lafayette Township", "Litchfield Township", "Liverpool Township",
  "Medina Township", "Montville Township", "Sharon Township", "Spencer Township", "Wadsworth Township",
  "Westfield Township", "York Township",
];

/** Communities the question names, most specific first. */
export function namedCommunities(q: string): string[] {
  const s = q.toLowerCase();
  const out: string[] = [];
  if (/\bvalley city\b/.test(s)) out.push("Liverpool Township");
  for (const name of COMMUNITY_NAMES) {
    const base = name.replace(/^(City|Village) of /, "").replace(/ Township$/, "").toLowerCase();
    const re = name.endsWith("Township")
      ? new RegExp(`\\b${base} (township|twp)\\b`)
      : new RegExp(`\\b${base}\\b`);
    if (re.test(s)) out.push(name);
  }
  // Bare "Liverpool", "Hinckley", etc. with no city/village of that name: treat as the township.
  for (const name of COMMUNITY_NAMES) {
    if (!name.endsWith("Township")) continue;
    const base = name.replace(/ Township$/, "").toLowerCase();
    const hasOther = COMMUNITY_NAMES.some((n) => n !== name && n.replace(/^(City|Village) of /, "").toLowerCase() === base);
    if (!hasOther && new RegExp(`\\b${base}\\b`).test(s)) out.push(name);
  }
  // "Medina" alone means the city, but not when only "Medina County" is named.
  const unique = [...new Set(out)];
  if (unique.includes("City of Medina") && !/\bmedina (city|council|mayor)\b|\bcity of medina\b/.test(s) && !/\bmedina\b(?! county| township| twp)/.test(s)) {
    return unique.filter((n) => n !== "City of Medina");
  }
  return unique;
}

// ── Ballot issues ───────────────────────────────────────────────────
interface BallotIssue { issue: Issue; communities: string[]; text: string; pdf: string }
let issueCache: BallotIssue[] | null = null;
function ballotIssues(): BallotIssue[] {
  if (issueCache) return issueCache;
  const map = new Map<string, BallotIssue>();
  for (const p of BALLOT.precincts) {
    for (const c of p.contests) {
      if (c.kind !== "issue") continue;
      const key = c.heading.slice(0, 3).join("|");
      const e = map.get(key) ?? { issue: c, communities: [], text: (c.heading.join(" ") + " " + c.text.join(" ")).toLowerCase(), pdf: p.pdf };
      if (p.jurisdiction && !e.communities.includes(p.jurisdiction)) e.communities.push(p.jurisdiction);
      map.set(key, e);
    }
  }
  issueCache = [...map.values()];
  return issueCache;
}

const SYN: Record<string, string[]> = {
  levy: ["levy", "tax"], levies: ["levy", "tax"], tax: ["tax", "levy"], taxes: ["tax", "levy"],
  property: ["tax", "levy"], fire: ["fire"], police: ["police"], road: ["road"], roads: ["road"],
  school: ["school"], schools: ["school"], bond: ["bond"], id: ["identification"], photo: ["identification"],
};

function issueTitle(i: Issue) {
  const h = i.heading[0] ?? "Ballot issue";
  if (/^Issue \d+/i.test(h)) return `${h}: ${titleCase(i.heading[2] ?? i.heading[1] ?? "")}`.trim();
  return titleCase(h);
}
function titleCase(s: string) {
  const out = s.replace(/\b[A-Z][A-Z]+\b/g, (w) => w[0] + w.slice(1).toLowerCase());
  return out.replace(/(?!^)\b(Of|And|In|To|The|For)\b/g, (m) => m.toLowerCase());
}

function searchBallot(q: string, toks: string[], named: string[]): (LocalResult & { score: number })[] {
  const ballotWords = /\b(ballot|issue|issues|levy|levies|tax|taxes|bond|vote|voting|election|amendment|renewal|millage|mills)\b/i.test(q);
  const out: (LocalResult & { score: number })[] = [];
  for (const b of ballotIssues()) {
    let score = 0;
    for (const t of toks) for (const w of SYN[t] ?? [t]) if (b.text.includes(w)) { score += 1; break; }
    const local = named.length > 0 && b.communities.some((c) => named.includes(c));
    if (local) score += 3;
    if (named.length && !local && !/^Issue \d/i.test(b.issue.heading[0] ?? "")) score -= 2;
    if (!ballotWords && !local) score -= 1;
    if (!ballotWords && /^Issue \d/i.test(b.issue.heading[0] ?? "")) continue;
    if (score < 2) continue;
    const ex = explain(b.issue);
    const where = b.communities.slice(0, 3).join(", ") + (b.communities.length > 3 ? " and more" : "");
    const community = local ? b.communities.find((c) => named.includes(c))! : b.communities[0];
    out.push({
      score,
      kind: "ballot",
      title: issueTitle(b.issue),
      href: `/ballot${community ? `?community=${encodeURIComponent(community)}` : ""}`,
      snippet: [ex.newOrRenewal, `On the November 3 ballot in ${where}.`].filter(Boolean).join(" "),
      sourceUrl: b.pdf,
      sourceLabel: "Official sample ballot, Medina County Board of Elections",
    });
  }
  return out;
}

// ── Communities and officials ───────────────────────────────────────
function safeAll<T>(sql: string, ...args: unknown[]): T[] {
  try {
    return sqlite.prepare(sql).all(...args) as T[];
  } catch {
    return [];
  }
}

function searchCommunities(q: string, toks: string[], named: string[]): (LocalResult & { score: number })[] {
  const out: (LocalResult & { score: number })[] = [];
  const wantsPeople = /\b(trustee|trustees|council|mayor|fiscal officer|official|officials|who|elected|meet|meeting|meetings|clerk|representative)\b/i.test(q);
  for (const name of named) {
    const j = safeAll<{ name: string; kind: string; website: string | null; source_url: string | null }>(
      "SELECT name, kind, website, source_url FROM local_jurisdictions WHERE name = ?", name
    )[0];
    const people = safeAll<{ name: string; role: string }>(
      "SELECT name, role FROM local_officials WHERE jurisdiction = ? ORDER BY sort LIMIT 6", name
    );
    const list = people.slice(0, 4).map((p) => `${p.name} (${p.role})`).join(", ");
    out.push({
      score: wantsPeople ? 6 : 4,
      kind: "community",
      title: `${name}${name === "Liverpool Township" ? " (Valley City)" : ""}: officials and links`,
      href: "/local#communities",
      snippet: list ? `Elected officials include ${list}.` : `Elected officials, contacts and the official website for ${name}.`,
      sourceUrl: j?.source_url ?? undefined,
      sourceLabel: "Medina County Public Officials Directory",
    });
  }
  // Officials by name
  const nameToks = toks.filter((t) => t.length > 3 && !/^(bill|bills|ward|city|council|township|village|trustee|trustees|mayor|school|levy|budget)$/.test(t));
  if (nameToks.length) {
    const rows = safeAll<{ jurisdiction: string; body: string; name: string; role: string; source_url: string | null }>(
      "SELECT jurisdiction, body, name, role, source_url FROM local_officials"
    );
    const seen = new Set<string>();
    for (const r of rows) {
      const parts = r.name.toLowerCase().replace(/[^a-z\s]/g, " ").split(/\s+/).filter((x) => x.length > 2);
      const hits = nameToks.filter((t) => parts.includes(t)).length;
      if (!hits || seen.has(r.name)) continue;
      seen.add(r.name);
      out.push({
        score: 3 + hits * 2,
        kind: "official",
        title: `${r.name}, ${r.role}`,
        href: "/local#communities",
        snippet: `${r.body}, ${r.jurisdiction}.`,
        sourceUrl: r.source_url ?? undefined,
        sourceLabel: "Official directory",
      });
      if (seen.size >= 3) break;
    }
  }
  return out;
}

// ── Ohio legislation ────────────────────────────────────────────────
function searchBills(q: string, toks: string[]): (LocalResult & { score: number })[] {
  const out: (LocalResult & { score: number })[] = [];
  const m = q.match(/\b(h\.?\s?b|s\.?\s?b|house bill|senate bill|hjr|sjr)\.?\s*(\d{1,4})\b/i);
  type Row = { id: number; bill_number: string | null; title: string; status_label: string | null; url: string | null };
  if (m) {
    const pre = /^s|senate/i.test(m[1]!) ? (/jr/i.test(m[1]!) ? "SJR" : "SB") : /jr/i.test(m[1]!) ? "HJR" : "HB";
    for (const r of safeAll<Row>("SELECT id, bill_number, title, status_label, url FROM bills WHERE bill_number = ? LIMIT 1", `${pre}${m[2]}`)) {
      out.push(billResult(r, 10));
    }
  }
  const billWords = /\b(bill|bills|legislation|legislature|statehouse|general assembly|law|laws|lawmakers)\b/i.test(q);
  const words = toks.filter((t) => !/^(bill|bills|legislation|legislature|ohio|state|law|laws|house|senate|lawmakers)$/.test(t));
  if (!words.length || (!billWords && !m)) return out;
  const rows = safeAll<Row & { description: string | null }>("SELECT id, bill_number, title, status_label, url, description FROM bills");
  const scored = rows
    .map((r) => {
      const text = `${r.title} ${r.description ?? ""}`.toLowerCase();
      return { r, s: words.filter((w) => text.includes(w)).length };
    })
    .filter((x) => x.s > 0 && !out.some((o) => o.href.endsWith(`/${x.r.id}`)))
    .sort((a, b) => b.s - a.s);
  const top = scored[0]?.s ?? 0;
  const best = scored.filter((x) => x.s >= Math.max(top, words.length > 2 ? 2 : 1)).slice(0, 3);
  for (const x of best) out.push(billResult(x.r, 2 + x.s * 2));
  if (!out.length && billWords) {
    out.push({ score: 3, kind: "bill", title: "Ohio bills we track", href: "/legislation", snippet: "Bills in the Ohio General Assembly, with status and sponsors, from LegiScan.", sourceUrl: "https://legiscan.com/OH", sourceLabel: "LegiScan" });
  }
  return out;
}
function billResult(r: { id: number; bill_number: string | null; title: string; status_label: string | null; url: string | null }, score: number) {
  return {
    score,
    kind: "bill" as const,
    title: `${r.bill_number ? r.bill_number.replace(/^([A-Z]+)(\d+)$/, "$1 $2") + ": " : ""}${r.title}`,
    href: `/legislation/bills/${r.id}`,
    snippet: r.status_label ? `Status: ${r.status_label}. Ohio General Assembly.` : "Ohio General Assembly.",
    sourceUrl: r.url ?? undefined,
    sourceLabel: "LegiScan",
  };
}

// ── County budget ───────────────────────────────────────────────────
function searchBudget(q: string): (LocalResult & { score: number })[] {
  if (!/\b(budget|budgets|spending|spend|general fund|revenue|revenues|expenses|appropriation|appropriations|county money|audit|audited)\b/i.test(q)) return [];
  return [{
    score: 5,
    kind: "budget",
    title: "Medina County budget by year",
    href: "/budget",
    snippet: "General Fund final budget versus actual spending and expected versus actual revenue, from audited county financial reports.",
    sourceUrl: COUNTY_BUDGET[0] ? pageUrl(COUNTY_BUDGET[0]) : undefined,
    sourceLabel: "Audited county financial report, Ohio Auditor of State",
  }];
}

export function searchLocal(rawQuery: string, limit = 5): LocalResult[] {
  const q = rawQuery.slice(0, 200);
  const toks = tokens(q);
  const named = namedCommunities(q);
  const all = [...searchCommunities(q, toks, named), ...searchBallot(q, toks, named), ...searchBills(q, toks), ...searchBudget(q)];
  if (!all.some((r) => r.kind === "ballot") && /\b(ballot|election|vote|voting|levy|levies|issue|issues|candidate|candidates)\b/i.test(q)) {
    all.push({ score: 3, kind: "ballot", title: "What's on my ballot, November 3, 2026", href: named[0] ? `/ballot?community=${encodeURIComponent(named[0])}` : "/ballot", snippet: "Races and issues for every community, from the official sample ballots.", sourceUrl: "https://lookup.boe.ohio.gov/vtrapp/medina/vtrlookup.aspx", sourceLabel: "Medina County Board of Elections" });
  }
  return all
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ score: _s, ...r }) => r);
}
