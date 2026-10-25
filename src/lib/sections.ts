import { sqlite } from "@/db/index";

// Data driven section registry. A section with `tables` is shown only when at
// least one of those tables has rows; otherwise it is hidden from navigation and
// its route returns 404. A section marked sourced: false also stays hidden until its numbers link
// to exact official sources. When real data loads, it reappears automatically.
export type Section = {
  href: string;
  label: string;
  footerLabel?: string;
  title?: string;
  body?: string;
  tables?: string[];
  /** false until every number the section shows renders through <Sourced>. Unsourced sections stay hidden. */
  sourced?: boolean;
};

export const SECTIONS: Section[] = [
  { href: "/search", label: "Ask Medina" },
  { href: "/ballot", label: "Ballot", footerLabel: "What's on my ballot" },
  { href: "/local", label: "Local", footerLabel: "Local Government", title: "Local Government", body: "Every city, village and township in the county, starting with Liverpool Township, plus councils and agendas.", tables: ["local_population", "local_officials", "local_jurisdictions"] },
  { href: "/people", label: "People", title: "People Directory", body: "Browse employees, officials, and vendors. See salary history, payment records, and connections.", tables: ["people"], sourced: false },
  { href: "/money", label: "Money", title: "Money Flow", body: "Explore spending by department, top vendors, and payment timelines with interactive charts.", tables: ["docket_line_items"], sourced: false },
  { href: "/docket", label: "Docket", title: "Weekly Docket", body: "Browse weekly payment batches approved by commissioners. Filter by vendor, department, or amount.", tables: ["dockets"], sourced: false },
  { href: "/meetings", label: "Meetings", title: "Meeting Minutes", body: "Search commissioner meeting minutes. See who was mentioned and what was discussed.", tables: ["meetings"], sourced: false },
  { href: "/donations", label: "Donations", title: "Campaign Finance", body: "Explore campaign contributions by candidate or donor. See who funds local elections.", tables: ["donations"], sourced: false },
  { href: "/legislation", label: "Legislation", title: "State Legislation", body: "Track Ohio bills and see how Medina County's representatives vote. Browse county resolutions.", tables: ["bills"] },
  { href: "/about", label: "About" },
];

function hasRows(table: string): boolean {
  if (!/^[a-z_]+$/.test(table)) return false;
  try {
    return !!sqlite.prepare(`SELECT 1 FROM ${table} LIMIT 1`).get();
  } catch {
    return false; // missing table counts as empty
  }
}

export function sectionHasData(s: Section): boolean {
  if (s.sourced === false) return false;
  return !s.tables || s.tables.some(hasRows);
}

export function liveSections(): Section[] {
  return SECTIONS.filter(sectionHasData);
}

// Subsections that are not in the nav but still hide themselves when empty.
const SUBSECTIONS: Section[] = [{ href: "/legislation/resolutions", label: "County resolutions", tables: ["county_resolutions"] }];

export function isSectionLive(href: string): boolean {
  const s = [...SECTIONS, ...SUBSECTIONS].find((x) => x.href === href);
  return !s || sectionHasData(s);
}
