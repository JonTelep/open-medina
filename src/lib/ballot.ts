// Sample ballots for the November 3, 2026 general election, copied from the Medina County Board of
// Elections ballot display (lookup.boe.ohio.gov). See docs/data-verification.md for how this was checked.
import data from "@/data/ballot-2026-11-03.json";

export type Race = { kind: "race"; office: string; voteFor: string | null; candidates: { name: string; party: string | null }[]; writeIn: boolean };
export type Issue = { kind: "issue"; heading: string[]; text: string[]; choices: string[] };
export type Contest = Race | Issue;
export type Precinct = { precinct: string; code: string; jurisdiction: string | null; source: string; pdf: string; contests: Contest[] };

export const BALLOT = data as { election: string; retrieved: string; precincts: Precinct[] };

export type Explainer = { what: string; cost: string | null; newOrRenewal: string | null; yesNo: string };

const money = (s: string) => s.replace(/\.00$/, "");

/** Plain language summary built only from the official ballot wording. Nothing here is estimated by us. */
export function explain(issue: Issue): Explainer {
  const title = issue.heading[0] ?? "";
  const body = issue.text.join(" ");
  const yes = issue.choices[0] ?? "YES";
  const no = issue.choices[1] ?? "NO";
  const tax = /TAX LEVY/i.test(title);
  const income = /INCOME TAX/i.test(title);
  const kind = title.match(/\(([^)]+)\)/)?.[1]?.toLowerCase() ?? null;
  const name = title.replace(/^PROPOSED (TAX LEVY\s*\([^)]*\)|INCOME TAX|BOND ISSUE|ORDINANCE AMENDMENT|CHARTER AMENDMENT)\s*/i, "").trim();
  const who = /^(City|Village|Wadsworth City School|Westfield Joint)/.test(name) ? `the ${name}` : name;
  const purpose = body.match(/for the purpose of (.+?)(?:,? that the county auditor|, for \d+ years|\?)/i)?.[1];
  const years = body.match(/for (\d+) years/i)?.[1];
  const mills = body.match(/at a rate not exceeding ([\d.]+ mills?)/i)?.[1];
  const per100k = body.match(/amounts to (\$[\d,]+) for each \$100,000/i)?.[1];
  const annual = body.match(/estimates will collect (\$[\d,.]+) annually/i)?.[1];

  if (/BOND ISSUE/i.test(title)) {
    const principal = body.match(/principal amount of (\$[\d,]+)/i)?.[1];
    const bondYears = body.match(/maximum period of (\d+) years/i)?.[1];
    const bondPurpose = body.match(/for the purpose of (.+?) in the principal amount/i)?.[1];
    const avg = body.match(/average over the repayment period of the bond issue ([\d.]+ mills?)/i)?.[1];
    return {
      what: `Asks voters whether ${who} may borrow ${principal ?? "the stated amount"} by issuing bonds${bondPurpose ? ` for ${bondPurpose}` : ""}${bondYears ? `, repaid over up to ${bondYears} years` : ""}, with a property tax to repay them.`,
      cost: per100k ? `The county auditor estimates the tax will average ${avg ? `${avg}, or ` : ""}${per100k} a year for each $100,000 of the auditor's market value over the repayment period.` : null,
      newOrRenewal: "New. This would be a new property tax to repay the bonds.",
      yesNo: `"${yes}" approves the bonds and the tax to repay them. "${no}" rejects them.`,
    };
  }
  if (income) {
    const rate = body.match(/income tax of ([^(]+?)\s*\(/i)?.[1];
    return {
      what: `Asks voters in ${who} to approve an income tax of ${rate ?? "the stated rate"} on residents' earned income${years ? ` for ${years} years` : ""}${purpose ? `, for ${purpose}` : ""}.`,
      cost: null,
      newOrRenewal: "The ballot lists this as an income tax. The official issues list calls it additional, so it would be a new tax.",
      yesNo: `"${yes}" approves the tax as worded on the ballot. "${no}" rejects it.`,
    };
  }
  if (tax) {
    const nr =
      kind === "renewal" ? "Renewal. This continues an existing tax; it is not a new tax."
      : kind === "additional" ? "Additional. This would be a new tax."
      : kind === "renewal and increase" ? "Renewal and increase. This continues an existing tax and adds to it."
      : kind === "renewal and decrease" ? "Renewal and decrease. This continues part of an existing tax at a lower rate."
      : null;
    const cost = per100k
      ? `${mills ? `Up to ${mills}. ` : ""}The county auditor estimates ${per100k} a year for each $100,000 of the auditor's market value${annual ? `, and ${money(annual)} a year in total collections` : ""}.`
      : null;
    return {
      what: `Asks voters to approve a property tax for ${who}${purpose ? ` for ${purpose}` : ""}${years ? `, for ${years} years` : ""}.`,
      cost,
      newOrRenewal: nr,
      yesNo: `"${yes}" approves the tax as worded on the ballot. "${no}" rejects it.`,
    };
  }
  const own = issue.text.filter((t) => /^A .?(YES|NO).? vote means/i.test(t));
  const heads = issue.heading.filter((h) => !/^A majority/i.test(h));
  const question = issue.text.length === 1 && issue.text[0]!.length < 600 ? issue.text[0] : null;
  return {
    what: question
      ? `Asks voters in ${who} this question: "${question}"`
      : /Constitutional Amendment/i.test(heads[1] ?? "")
        ? `${heads[0]} is a proposed amendment to the Ohio Constitution, ${(heads[3] ?? "").toLowerCase()}, ${(heads[2] ?? "").toLowerCase()}. The full official wording is below.`
        : `${heads.slice(0, 3).join(". ")}. The full official wording is below.`,
    cost: null,
    newOrRenewal: null,
    yesNo: own.length ? own.join(" ") : `"${yes}" approves the proposal as worded on the ballot. "${no}" rejects it.`,
  };
}
