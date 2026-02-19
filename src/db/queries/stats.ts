import { db } from "@/db/index";
import { people, salaries, dockets, docketLineItems, meetings, donations, campaigns, bills, countyResolutions, legislators } from "@/db/schema";
import { sql } from "drizzle-orm";

export function getDashboardStats() {
  const totalPeople =
    db.select({ count: sql<number>`count(*)` }).from(people).get()?.count ?? 0;
  const totalSalaryRecords =
    db.select({ count: sql<number>`count(*)` }).from(salaries).get()?.count ?? 0;
  const totalDockets =
    db.select({ count: sql<number>`count(*)` }).from(dockets).get()?.count ?? 0;
  const totalDocketItems =
    db.select({ count: sql<number>`count(*)` }).from(docketLineItems).get()?.count ?? 0;
  const totalSpending =
    db.select({ total: sql<number>`coalesce(sum(${docketLineItems.amount}), 0)` }).from(docketLineItems).get()?.total ?? 0;
  const totalMeetings =
    db.select({ count: sql<number>`count(*)` }).from(meetings).get()?.count ?? 0;
  const totalDonations =
    db.select({ count: sql<number>`count(*)` }).from(donations).get()?.count ?? 0;
  const totalDonationAmount =
    db.select({ total: sql<number>`coalesce(sum(${donations.amount}), 0)` }).from(donations).get()?.total ?? 0;
  const totalCampaigns =
    db.select({ count: sql<number>`count(*)` }).from(campaigns).get()?.count ?? 0;

  // Salary years range
  const salaryYears = db
    .select({
      minYear: sql<number>`min(${salaries.year})`,
      maxYear: sql<number>`max(${salaries.year})`,
    })
    .from(salaries)
    .get();

  const totalBills =
    db.select({ count: sql<number>`count(*)` }).from(bills).get()?.count ?? 0;
  const totalResolutions =
    db.select({ count: sql<number>`count(*)` }).from(countyResolutions).get()?.count ?? 0;
  const totalLegislators =
    db.select({ count: sql<number>`count(*)` }).from(legislators).get()?.count ?? 0;

  return {
    totalPeople,
    totalSalaryRecords,
    totalDockets,
    totalDocketItems,
    totalSpending,
    totalMeetings,
    totalDonations,
    totalDonationAmount,
    totalCampaigns,
    totalBills,
    totalResolutions,
    totalLegislators,
    salaryYearMin: salaryYears?.minYear ?? null,
    salaryYearMax: salaryYears?.maxYear ?? null,
  };
}
