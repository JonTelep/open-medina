import { sqlite } from "@/db/index";
import { db } from "@/db/index";
import { people, salaries, docketLineItems, meetings, donations, campaigns, bills, countyResolutions } from "@/db/schema";
import { like, sql, or, eq } from "drizzle-orm";

export interface SearchResult {
  entityType: string;
  entityId: number;
  title: string;
  snippet: string;
  department: string | null;
  year: string | null;
}

export function searchAll(query: string, opts?: { limit?: number; type?: string }) {
  const { limit = 50, type } = opts ?? {};

  // Try FTS5 first
  const ftsResults = searchFts(query, limit, type);
  if (ftsResults.length > 0) return ftsResults;

  // Fall back to LIKE search across tables
  return searchLike(query, limit, type);
}

function searchFts(query: string, limit: number, type?: string): SearchResult[] {
  try {
    const ftsQuery = type
      ? `SELECT entity_type, entity_id, title, snippet(search_index, 3, '<mark>', '</mark>', '...', 32) as snippet, department, year FROM search_index WHERE search_index MATCH ? AND entity_type = ? ORDER BY rank LIMIT ?`
      : `SELECT entity_type, entity_id, title, snippet(search_index, 3, '<mark>', '</mark>', '...', 32) as snippet, department, year FROM search_index WHERE search_index MATCH ? ORDER BY rank LIMIT ?`;

    const params = type ? [query, type, limit] : [query, limit];
    const stmt = sqlite.prepare(ftsQuery);
    const rows = stmt.all(...params) as Array<{
      entity_type: string;
      entity_id: number;
      title: string;
      snippet: string;
      department: string | null;
      year: string | null;
    }>;

    return rows.map((r) => ({
      entityType: r.entity_type,
      entityId: r.entity_id,
      title: r.title,
      snippet: r.snippet,
      department: r.department,
      year: r.year,
    }));
  } catch {
    return [];
  }
}

function searchLike(query: string, limit: number, type?: string): SearchResult[] {
  const results: SearchResult[] = [];
  const pattern = `%${query}%`;

  if (!type || type === "person") {
    const peopleResults = db
      .select({
        id: people.id,
        displayName: people.displayName,
        department: people.department,
        title: people.title,
      })
      .from(people)
      .where(like(people.displayName, pattern))
      .limit(limit)
      .all();

    for (const p of peopleResults) {
      results.push({
        entityType: "person",
        entityId: p.id,
        title: p.displayName,
        snippet: [p.title, p.department].filter(Boolean).join(" · "),
        department: p.department,
        year: null,
      });
    }
  }

  if (!type || type === "salary") {
    const salaryResults = db
      .select({
        id: salaries.id,
        rawName: salaries.rawName,
        department: salaries.department,
        title: salaries.title,
        salary: salaries.salary,
        year: salaries.year,
      })
      .from(salaries)
      .where(
        or(
          like(salaries.rawName, pattern),
          like(salaries.department, pattern),
          like(salaries.title, pattern)
        )
      )
      .limit(limit)
      .all();

    for (const s of salaryResults) {
      results.push({
        entityType: "salary",
        entityId: s.id,
        title: s.rawName,
        snippet: `${s.title ?? ""} · ${s.department ?? ""} · $${s.salary.toLocaleString()}`,
        department: s.department,
        year: String(s.year),
      });
    }
  }

  if (!type || type === "vendor") {
    const vendorResults = db
      .select({
        id: docketLineItems.id,
        vendorName: docketLineItems.rawVendorName,
        department: docketLineItems.department,
        description: docketLineItems.description,
        amount: docketLineItems.amount,
      })
      .from(docketLineItems)
      .where(
        or(
          like(docketLineItems.rawVendorName, pattern),
          like(docketLineItems.description, pattern)
        )
      )
      .limit(limit)
      .all();

    for (const v of vendorResults) {
      results.push({
        entityType: "vendor",
        entityId: v.id,
        title: v.vendorName,
        snippet: `${v.description ?? ""} · ${v.department ?? ""} · $${v.amount.toLocaleString()}`,
        department: v.department,
        year: null,
      });
    }
  }

  if (!type || type === "meeting") {
    const meetingResults = db
      .select({
        id: meetings.id,
        date: meetings.date,
        title: meetings.title,
        body: meetings.body,
      })
      .from(meetings)
      .where(
        or(
          like(meetings.title, pattern),
          like(meetings.body, pattern)
        )
      )
      .limit(limit)
      .all();

    for (const m of meetingResults) {
      const bodySnippet = m.body
        ? m.body.substring(0, 150) + "..."
        : "";
      results.push({
        entityType: "meeting",
        entityId: m.id,
        title: m.title ?? `Meeting ${m.date}`,
        snippet: bodySnippet,
        department: null,
        year: m.date?.substring(0, 4) ?? null,
      });
    }
  }

  if (!type || type === "donation") {
    const donationResults = db
      .select({
        id: donations.id,
        donorName: donations.rawDonorName,
        amount: donations.amount,
        date: donations.date,
        campaignId: donations.campaignId,
      })
      .from(donations)
      .where(
        or(
          like(donations.rawDonorName, pattern),
          like(donations.donorEmployer, pattern)
        )
      )
      .limit(limit)
      .all();

    for (const d of donationResults) {
      results.push({
        entityType: "donation",
        entityId: d.id,
        title: d.donorName,
        snippet: `$${d.amount.toLocaleString()} on ${d.date}`,
        department: null,
        year: d.date?.substring(0, 4) ?? null,
      });
    }
  }

  if (!type || type === "campaign") {
    const campaignResults = db
      .select({
        id: campaigns.id,
        candidateName: campaigns.candidateName,
        committeeName: campaigns.committeeName,
        office: campaigns.office,
        party: campaigns.party,
        year: campaigns.year,
      })
      .from(campaigns)
      .where(
        or(
          like(campaigns.candidateName, pattern),
          like(campaigns.committeeName, pattern),
          like(campaigns.office, pattern)
        )
      )
      .limit(limit)
      .all();

    for (const c of campaignResults) {
      results.push({
        entityType: "campaign",
        entityId: c.id,
        title: c.candidateName,
        snippet: [c.committeeName, c.office, c.party, c.year ? String(c.year) : null].filter(Boolean).join(" · "),
        department: null,
        year: c.year ? String(c.year) : null,
      });
    }
  }

  if (!type || type === "bill") {
    const billResults = db
      .select({
        id: bills.id,
        billNumber: bills.billNumber,
        title: bills.title,
        description: bills.description,
        chamber: bills.chamber,
        statusLabel: bills.statusLabel,
        lastActionDate: bills.lastActionDate,
      })
      .from(bills)
      .where(
        or(
          like(bills.title, pattern),
          like(bills.billNumber, pattern),
          like(bills.description, pattern)
        )
      )
      .limit(limit)
      .all();

    for (const b of billResults) {
      results.push({
        entityType: "bill",
        entityId: b.id,
        title: `${b.billNumber ?? ""} · ${b.title}`,
        snippet: [b.statusLabel, b.chamber, b.description?.substring(0, 100)].filter(Boolean).join(" · "),
        department: b.chamber,
        year: b.lastActionDate?.substring(0, 4) ?? null,
      });
    }
  }

  if (!type || type === "resolution") {
    const resResults = db
      .select({
        id: countyResolutions.id,
        resolutionNumber: countyResolutions.resolutionNumber,
        title: countyResolutions.title,
        description: countyResolutions.description,
        date: countyResolutions.date,
      })
      .from(countyResolutions)
      .where(
        or(
          like(countyResolutions.title, pattern),
          like(countyResolutions.resolutionNumber, pattern),
          like(countyResolutions.description, pattern)
        )
      )
      .limit(limit)
      .all();

    for (const r of resResults) {
      results.push({
        entityType: "resolution",
        entityId: r.id,
        title: `${r.resolutionNumber ?? ""} · ${r.title}`,
        snippet: r.description?.substring(0, 150) ?? "",
        department: null,
        year: r.date?.substring(0, 4) ?? null,
      });
    }
  }

  return results.slice(0, limit);
}

export function rebuildSearchIndex() {
  // Clear existing index
  sqlite.exec("DELETE FROM search_index");

  // Index people
  const peopleRows = db
    .select()
    .from(people)
    .all();

  const insertStmt = sqlite.prepare(
    "INSERT INTO search_index (entity_type, entity_id, title, body, department, year) VALUES (?, ?, ?, ?, ?, ?)"
  );

  for (const p of peopleRows) {
    insertStmt.run("person", p.id, p.displayName, p.notes ?? "", p.department ?? "", "");
  }

  // Index salaries
  const salaryRows = db.select().from(salaries).all();
  for (const s of salaryRows) {
    insertStmt.run(
      "salary",
      s.id,
      s.rawName,
      `${s.title ?? ""} ${s.department ?? ""} $${s.salary}`,
      s.department ?? "",
      String(s.year)
    );
  }

  // Index docket line items
  const docketRows = db.select().from(docketLineItems).all();
  for (const d of docketRows) {
    insertStmt.run(
      "vendor",
      d.id,
      d.rawVendorName,
      `${d.description ?? ""} ${d.department ?? ""} $${d.amount}`,
      d.department ?? "",
      ""
    );
  }

  // Index meetings
  const meetingRows = db.select().from(meetings).all();
  for (const m of meetingRows) {
    insertStmt.run(
      "meeting",
      m.id,
      m.title ?? `Meeting ${m.date}`,
      m.body ?? "",
      "",
      m.date?.substring(0, 4) ?? ""
    );
  }

  // Index donations
  const donationRows = db.select().from(donations).all();
  for (const d of donationRows) {
    insertStmt.run(
      "donation",
      d.id,
      d.rawDonorName,
      `${d.donorEmployer ?? ""} ${d.donorOccupation ?? ""} $${d.amount}`,
      "",
      d.date?.substring(0, 4) ?? ""
    );
  }

  // Index campaigns
  const campaignRows = db.select().from(campaigns).all();
  for (const c of campaignRows) {
    insertStmt.run(
      "campaign",
      c.id,
      c.candidateName,
      `${c.committeeName ?? ""} ${c.office ?? ""} ${c.party ?? ""}`,
      "",
      c.year ? String(c.year) : ""
    );
  }

  // Index bills
  const billRows = db.select().from(bills).all();
  for (const b of billRows) {
    insertStmt.run(
      "bill",
      b.id,
      `${b.billNumber ?? ""} ${b.title}`,
      `${b.description ?? ""} ${b.statusLabel ?? ""} ${b.chamber ?? ""}`,
      b.chamber ?? "",
      b.lastActionDate?.substring(0, 4) ?? ""
    );
  }

  // Index county resolutions
  const resolutionRows = db.select().from(countyResolutions).all();
  for (const r of resolutionRows) {
    insertStmt.run(
      "resolution",
      r.id,
      `${r.resolutionNumber ?? ""} ${r.title}`,
      `${r.description ?? ""} ${r.body ?? ""}`,
      "",
      r.date?.substring(0, 4) ?? ""
    );
  }
}
