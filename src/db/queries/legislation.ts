import { db } from "@/db/index";
import {
  legislators,
  bills,
  billSponsors,
  rollCallVotes,
  legislatorVotes,
  countyResolutions,
} from "@/db/schema";
import { eq, sql, desc, asc, like, and, gte, lte, or } from "drizzle-orm";

// ─── Status helpers ─────────────────────────────────────────────────

const STATUS_LABELS: Record<number, string> = {
  1: "Introduced",
  2: "Engrossed",
  3: "Enrolled",
  4: "Passed",
  5: "Vetoed",
  6: "Dead",
};

export function getStatusLabel(status: number | null): string {
  return STATUS_LABELS[status ?? 0] ?? "Unknown";
}

// ─── Bills ──────────────────────────────────────────────────────────

export function getBills(opts?: {
  search?: string;
  chamber?: string;
  status?: number;
  limit?: number;
  offset?: number;
}) {
  const { search, chamber, status, limit = 20, offset = 0 } = opts ?? {};
  const conditions = [];

  if (search) {
    const pattern = `%${search}%`;
    conditions.push(
      or(
        like(bills.title, pattern),
        like(bills.billNumber, pattern),
        like(bills.description, pattern)
      )
    );
  }
  if (chamber) {
    conditions.push(eq(bills.chamber, chamber));
  }
  if (status !== undefined && status !== null) {
    conditions.push(eq(bills.status, status));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  return db
    .select()
    .from(bills)
    .where(where)
    .orderBy(desc(bills.lastActionDate), desc(bills.id))
    .limit(limit)
    .offset(offset)
    .all();
}

export function countBills(opts?: {
  search?: string;
  chamber?: string;
  status?: number;
}) {
  const { search, chamber, status } = opts ?? {};
  const conditions = [];

  if (search) {
    const pattern = `%${search}%`;
    conditions.push(
      or(
        like(bills.title, pattern),
        like(bills.billNumber, pattern),
        like(bills.description, pattern)
      )
    );
  }
  if (chamber) {
    conditions.push(eq(bills.chamber, chamber));
  }
  if (status !== undefined && status !== null) {
    conditions.push(eq(bills.status, status));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  return (
    db
      .select({ count: sql<number>`count(*)` })
      .from(bills)
      .where(where)
      .get()?.count ?? 0
  );
}

export function getBillById(id: number) {
  return db.select().from(bills).where(eq(bills.id, id)).get();
}

export function getBillWithDetails(id: number) {
  const bill = getBillById(id);
  if (!bill) return null;

  const sponsors = db
    .select({
      id: billSponsors.id,
      legislatorId: billSponsors.legislatorId,
      type: billSponsors.type,
      legislatorName: legislators.name,
      party: legislators.party,
      chamber: legislators.chamber,
      district: legislators.district,
    })
    .from(billSponsors)
    .innerJoin(legislators, eq(billSponsors.legislatorId, legislators.id))
    .where(eq(billSponsors.billId, id))
    .all();

  const rollCalls = db
    .select()
    .from(rollCallVotes)
    .where(eq(rollCallVotes.billId, id))
    .orderBy(desc(rollCallVotes.date))
    .all();

  // Get Medina legislator votes for each roll call
  const rollCallsWithVotes = rollCalls.map((rc) => {
    const votes = db
      .select({
        legislatorId: legislatorVotes.legislatorId,
        vote: legislatorVotes.vote,
        legislatorName: legislators.name,
        party: legislators.party,
        chamber: legislators.chamber,
        district: legislators.district,
      })
      .from(legislatorVotes)
      .innerJoin(
        legislators,
        eq(legislatorVotes.legislatorId, legislators.id)
      )
      .where(eq(legislatorVotes.rollCallId, rc.id))
      .all();

    return { ...rc, legislatorVotes: votes };
  });

  return { bill, sponsors, rollCalls: rollCallsWithVotes };
}

// ─── Legislators ────────────────────────────────────────────────────

export function getLegislators() {
  return db.select().from(legislators).orderBy(asc(legislators.name)).all();
}

export function getLegislatorById(id: number) {
  return db.select().from(legislators).where(eq(legislators.id, id)).get();
}

export function getLegislatorVotingRecord(
  legislatorId: number,
  opts?: { limit?: number }
) {
  const { limit = 50 } = opts ?? {};

  return db
    .select({
      voteId: legislatorVotes.id,
      vote: legislatorVotes.vote,
      rollCallId: rollCallVotes.id,
      rollCallDate: rollCallVotes.date,
      rollCallDescription: rollCallVotes.description,
      rollCallChamber: rollCallVotes.chamber,
      passed: rollCallVotes.passed,
      billId: bills.id,
      billNumber: bills.billNumber,
      billTitle: bills.title,
    })
    .from(legislatorVotes)
    .innerJoin(
      rollCallVotes,
      eq(legislatorVotes.rollCallId, rollCallVotes.id)
    )
    .innerJoin(bills, eq(rollCallVotes.billId, bills.id))
    .where(eq(legislatorVotes.legislatorId, legislatorId))
    .orderBy(desc(rollCallVotes.date))
    .limit(limit)
    .all();
}

export function getLegislatorSponsoredBills(legislatorId: number) {
  return db
    .select({
      sponsorId: billSponsors.id,
      type: billSponsors.type,
      billId: bills.id,
      billNumber: bills.billNumber,
      title: bills.title,
      status: bills.status,
      statusLabel: bills.statusLabel,
      chamber: bills.chamber,
      lastActionDate: bills.lastActionDate,
    })
    .from(billSponsors)
    .innerJoin(bills, eq(billSponsors.billId, bills.id))
    .where(eq(billSponsors.legislatorId, legislatorId))
    .orderBy(desc(bills.lastActionDate))
    .all();
}

export function getLegislatorVotingStats(legislatorId: number) {
  const result = db
    .select({
      total: sql<number>`count(*)`,
      yea: sql<number>`sum(case when ${legislatorVotes.vote} = 'yea' then 1 else 0 end)`,
      nay: sql<number>`sum(case when ${legislatorVotes.vote} = 'nay' then 1 else 0 end)`,
      nv: sql<number>`sum(case when ${legislatorVotes.vote} = 'nv' then 1 else 0 end)`,
      absent: sql<number>`sum(case when ${legislatorVotes.vote} = 'absent' then 1 else 0 end)`,
    })
    .from(legislatorVotes)
    .where(eq(legislatorVotes.legislatorId, legislatorId))
    .get();

  return {
    total: result?.total ?? 0,
    yea: result?.yea ?? 0,
    nay: result?.nay ?? 0,
    nv: result?.nv ?? 0,
    absent: result?.absent ?? 0,
  };
}

// ─── Resolutions ────────────────────────────────────────────────────

export function getResolutions(opts?: {
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}) {
  const { search, dateFrom, dateTo, limit = 20, offset = 0 } = opts ?? {};
  const conditions = [];

  if (search) {
    const pattern = `%${search}%`;
    conditions.push(
      or(
        like(countyResolutions.title, pattern),
        like(countyResolutions.resolutionNumber, pattern),
        like(countyResolutions.description, pattern)
      )
    );
  }
  if (dateFrom) {
    conditions.push(gte(countyResolutions.date, dateFrom));
  }
  if (dateTo) {
    conditions.push(lte(countyResolutions.date, dateTo));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  return db
    .select()
    .from(countyResolutions)
    .where(where)
    .orderBy(desc(countyResolutions.date), desc(countyResolutions.id))
    .limit(limit)
    .offset(offset)
    .all();
}

export function countResolutions(opts?: {
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const { search, dateFrom, dateTo } = opts ?? {};
  const conditions = [];

  if (search) {
    const pattern = `%${search}%`;
    conditions.push(
      or(
        like(countyResolutions.title, pattern),
        like(countyResolutions.resolutionNumber, pattern),
        like(countyResolutions.description, pattern)
      )
    );
  }
  if (dateFrom) {
    conditions.push(gte(countyResolutions.date, dateFrom));
  }
  if (dateTo) {
    conditions.push(lte(countyResolutions.date, dateTo));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  return (
    db
      .select({ count: sql<number>`count(*)` })
      .from(countyResolutions)
      .where(where)
      .get()?.count ?? 0
  );
}

export function getResolutionById(id: number) {
  return db
    .select()
    .from(countyResolutions)
    .where(eq(countyResolutions.id, id))
    .get();
}

// ─── Dashboard Stats ────────────────────────────────────────────────

export function getLegislationDashboardStats() {
  const totalBills =
    db.select({ count: sql<number>`count(*)` }).from(bills).get()?.count ?? 0;
  const totalResolutions =
    db
      .select({ count: sql<number>`count(*)` })
      .from(countyResolutions)
      .get()?.count ?? 0;
  const totalLegislators =
    db.select({ count: sql<number>`count(*)` }).from(legislators).get()
      ?.count ?? 0;

  return { totalBills, totalResolutions, totalLegislators };
}

export function getRecentBills(limit = 10) {
  return db
    .select()
    .from(bills)
    .orderBy(desc(bills.lastActionDate), desc(bills.id))
    .limit(limit)
    .all();
}

export function getRecentResolutions(limit = 10) {
  return db
    .select()
    .from(countyResolutions)
    .orderBy(desc(countyResolutions.date), desc(countyResolutions.id))
    .limit(limit)
    .all();
}

export function getBillStatusBreakdown() {
  return db
    .select({
      status: bills.status,
      statusLabel: bills.statusLabel,
      count: sql<number>`count(*)`,
    })
    .from(bills)
    .groupBy(bills.status, bills.statusLabel)
    .orderBy(asc(bills.status))
    .all();
}
