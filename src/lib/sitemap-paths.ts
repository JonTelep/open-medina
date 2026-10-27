// Every indexable URL. Detail rows are included only for sections the site
// actually serves (empty or hidden sections 404, so they stay out of the sitemap).

export type SitemapQuery = (sql: string) => string[];

const DETAILS: { section: string; sql: string; path: (value: string) => string }[] = [
  { section: "/legislation", sql: "SELECT id AS v FROM bills ORDER BY id", path: (id) => `/legislation/bills/${id}` },
  { section: "/legislation", sql: "SELECT id AS v FROM legislators ORDER BY id", path: (id) => `/legislation/legislators/${id}` },
  { section: "/people", sql: "SELECT id AS v FROM people ORDER BY id", path: (id) => `/people/${id}` },
  { section: "/meetings", sql: "SELECT id AS v FROM meetings ORDER BY id", path: (id) => `/meetings/${id}` },
  { section: "/docket", sql: "SELECT id AS v FROM dockets ORDER BY id", path: (id) => `/docket/${id}` },
  { section: "/donations", sql: "SELECT id AS v FROM campaigns ORDER BY id", path: (id) => `/donations/campaigns/${id}` },
  {
    section: "/donations",
    sql: "SELECT DISTINCT raw_donor_name AS v FROM donations WHERE raw_donor_name != '' ORDER BY raw_donor_name",
    path: (name) => `/donations/donors/${encodeURIComponent(name)}`,
  },
  {
    section: "/money",
    sql: "SELECT DISTINCT department AS v FROM docket_line_items WHERE department IS NOT NULL AND department != '' ORDER BY department",
    path: (dept) => `/money/departments/${encodeURIComponent(dept)}`,
  },
  {
    section: "/money",
    sql: "SELECT DISTINCT department AS v FROM salaries WHERE department IS NOT NULL AND department != '' ORDER BY department",
    path: (dept) => `/money/departments/${encodeURIComponent(dept)}`,
  },
  {
    section: "/money",
    sql: "SELECT DISTINCT raw_vendor_name AS v FROM docket_line_items WHERE raw_vendor_name != '' ORDER BY raw_vendor_name",
    path: (name) => `/money/vendors/${encodeURIComponent(name)}`,
  },
];

export function collectSitemapPaths(liveHrefs: string[], sectionLive: (href: string) => boolean, query: SitemapQuery): string[] {
  const paths = ["/", ...liveHrefs, "/contact"];
  if (sectionLive("/legislation/resolutions")) paths.push("/legislation/resolutions");
  for (const spec of DETAILS) {
    if (!sectionLive(spec.section)) continue;
    for (const value of query(spec.sql)) paths.push(spec.path(value));
  }
  return [...new Set(paths)];
}
