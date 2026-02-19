import { db } from "@/db/index";
import { campaigns, donations, people } from "@/db/schema";
import { eq, sql, desc, asc } from "drizzle-orm";

export function getCampaigns() {
  return db
    .select({
      id: campaigns.id,
      personId: campaigns.personId,
      candidateName: campaigns.candidateName,
      committeeName: campaigns.committeeName,
      office: campaigns.office,
      party: campaigns.party,
      year: campaigns.year,
      totalRaised: sql<number>`coalesce(sum(${donations.amount}), 0)`,
      donorCount: sql<number>`count(DISTINCT ${donations.rawDonorName})`,
    })
    .from(campaigns)
    .leftJoin(donations, eq(donations.campaignId, campaigns.id))
    .groupBy(campaigns.id)
    .orderBy(desc(campaigns.year), asc(campaigns.candidateName))
    .all();
}

export function getCampaignById(id: number) {
  return db.select().from(campaigns).where(eq(campaigns.id, id)).get();
}

export function getCampaignDonations(campaignId: number) {
  return db
    .select()
    .from(donations)
    .where(eq(donations.campaignId, campaignId))
    .orderBy(desc(donations.amount))
    .all();
}

export function getTopDonors(opts?: { limit?: number }) {
  const { limit = 20 } = opts ?? {};

  return db
    .select({
      donorName: donations.rawDonorName,
      totalAmount: sql<number>`sum(${donations.amount})`,
      donationCount: sql<number>`count(*)`,
      campaignCount: sql<number>`count(DISTINCT ${donations.campaignId})`,
    })
    .from(donations)
    .groupBy(donations.rawDonorName)
    .orderBy(desc(sql`sum(${donations.amount})`))
    .limit(limit)
    .all();
}

export function getDonorSummary(donorName: string) {
  return db
    .select({
      id: donations.id,
      campaignId: donations.campaignId,
      candidateName: campaigns.candidateName,
      office: campaigns.office,
      year: campaigns.year,
      amount: donations.amount,
      date: donations.date,
      type: donations.type,
      donorAddress: donations.donorAddress,
      donorCity: donations.donorCity,
      donorState: donations.donorState,
      donorEmployer: donations.donorEmployer,
      donorOccupation: donations.donorOccupation,
    })
    .from(donations)
    .innerJoin(campaigns, eq(donations.campaignId, campaigns.id))
    .where(eq(donations.rawDonorName, donorName))
    .orderBy(desc(donations.date))
    .all();
}

export function getDonationTimeline() {
  return db
    .select({
      month: sql<string>`substr(${donations.date}, 1, 7)`,
      totalAmount: sql<number>`sum(${donations.amount})`,
      donationCount: sql<number>`count(*)`,
    })
    .from(donations)
    .groupBy(sql`substr(${donations.date}, 1, 7)`)
    .orderBy(asc(sql`substr(${donations.date}, 1, 7)`))
    .all();
}

export function getCampaignDonorBreakdown(campaignId: number) {
  return db
    .select({
      donorName: donations.rawDonorName,
      totalAmount: sql<number>`sum(${donations.amount})`,
      donationCount: sql<number>`count(*)`,
    })
    .from(donations)
    .where(eq(donations.campaignId, campaignId))
    .groupBy(donations.rawDonorName)
    .orderBy(desc(sql`sum(${donations.amount})`))
    .all();
}

export function countCampaigns() {
  const result = db
    .select({ count: sql<number>`count(*)` })
    .from(campaigns)
    .get();
  return result?.count ?? 0;
}

export function countDonations() {
  const result = db
    .select({ count: sql<number>`count(*)` })
    .from(donations)
    .get();
  return result?.count ?? 0;
}

export function getTotalDonationAmount() {
  const result = db
    .select({ total: sql<number>`coalesce(sum(${donations.amount}), 0)` })
    .from(donations)
    .get();
  return result?.total ?? 0;
}
