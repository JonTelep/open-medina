/**
 * Campaign finance / donation scraper for Medina County.
 *
 * Modes:
 *   1. CSV import: donor + campaign columns
 *   2. Ohio SOS web scraping (best-effort via Cheerio)
 *
 * Usage:
 *   tsx src/scrapers/scrape-donations.ts path/to/donations.csv
 *   tsx src/scrapers/scrape-donations.ts --candidate "Stephen Hambley"
 */

import { db } from "@/db/index";
import { campaigns, donations } from "@/db/schema";
import { sql, eq } from "drizzle-orm";
import { parseCsvFile } from "./lib/csv";
import { startRun, completeRun, failRun } from "./lib/scraper-log";

const SCRAPER_NAME = "donations";

interface DonationRecord {
  candidateName: string;
  committeeName: string;
  office: string;
  party: string;
  year: number;
  donorName: string;
  donorAddress: string;
  donorCity: string;
  donorState: string;
  donorZip: string;
  donorEmployer: string;
  donorOccupation: string;
  amount: number;
  date: string;
  type: string;
  source: string;
}

// ─── CSV Import ────────────────────────────────────────────────────────

function importFromCsv(filePath: string): DonationRecord[] {
  console.log(`Importing donations from CSV: ${filePath}`);
  const rows = parseCsvFile(filePath);
  const records: DonationRecord[] = [];

  for (const row of rows) {
    const candidateName =
      row["candidate_name"] || row["Candidate Name"] || row["candidate"] || row["Candidate"] || "";
    const donorName =
      row["donor_name"] || row["Donor Name"] || row["donor"] || row["Donor"] ||
      row["contributor"] || row["Contributor"] || "";
    const amountStr =
      row["amount"] || row["Amount"] || row["contribution"] || row["Contribution"] || "0";
    const date =
      row["date"] || row["Date"] || row["contribution_date"] || row["Contribution Date"] || "";

    const amount = parseFloat(amountStr.replace(/[$,]/g, ""));
    if (!candidateName || !donorName || isNaN(amount) || !date) continue;

    const normalizedDate = normalizeDate(date);
    if (!normalizedDate) {
      console.warn(`  Skipping row with unparseable date: "${date}"`);
      continue;
    }

    records.push({
      candidateName,
      committeeName: row["committee_name"] || row["Committee Name"] || row["committee"] || "",
      office: row["office"] || row["Office"] || "",
      party: row["party"] || row["Party"] || "",
      year: parseInt(row["year"] || row["Year"] || normalizedDate.slice(0, 4), 10),
      donorName,
      donorAddress: row["donor_address"] || row["Donor Address"] || row["address"] || "",
      donorCity: row["donor_city"] || row["Donor City"] || row["city"] || "",
      donorState: row["donor_state"] || row["Donor State"] || row["state"] || "",
      donorZip: row["donor_zip"] || row["Donor Zip"] || row["zip"] || "",
      donorEmployer: row["donor_employer"] || row["Donor Employer"] || row["employer"] || "",
      donorOccupation: row["donor_occupation"] || row["Donor Occupation"] || row["occupation"] || "",
      amount,
      date: normalizedDate,
      type: row["type"] || row["Type"] || "monetary",
      source: `csv:${filePath}`,
    });
  }

  return records;
}

// ─── Date normalization ─────────────────────────────────────────────────

function normalizeDate(dateStr: string): string | null {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;

  const mdyMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdyMatch) {
    const [, month, day, year] = mdyMatch;
    return `${year}-${month!.padStart(2, "0")}-${day!.padStart(2, "0")}`;
  }

  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return null;
}

// ─── Database Insert ───────────────────────────────────────────────────

interface InsertStats {
  processed: number;
  created: number;
  updated: number;
}

function insertRecords(records: DonationRecord[]): InsertStats {
  let campaignsCreated = 0;
  let donationsCreated = 0;

  // Group by candidate to create/find campaigns
  const campaignMap = new Map<string, number>();

  for (const record of records) {
    const campaignKey = `${record.candidateName}|${record.year}`;

    let campaignId = campaignMap.get(campaignKey);
    if (campaignId === undefined) {
      // Try to find existing campaign
      const existing = db
        .select({ id: campaigns.id })
        .from(campaigns)
        .where(
          sql`${campaigns.candidateName} = ${record.candidateName} AND ${campaigns.year} = ${record.year}`
        )
        .get();

      if (existing) {
        campaignId = existing.id;
      } else {
        const result = db
          .insert(campaigns)
          .values({
            candidateName: record.candidateName,
            committeeName: record.committeeName || null,
            office: record.office || null,
            party: record.party || null,
            year: record.year,
            source: record.source,
          })
          .returning({ id: campaigns.id })
          .get();

        campaignId = result.id;
        campaignsCreated++;
      }
      campaignMap.set(campaignKey, campaignId);
    }

    // Insert donation
    try {
      db.insert(donations)
        .values({
          campaignId,
          rawDonorName: record.donorName,
          donorAddress: record.donorAddress || null,
          donorCity: record.donorCity || null,
          donorState: record.donorState || null,
          donorZip: record.donorZip || null,
          donorEmployer: record.donorEmployer || null,
          donorOccupation: record.donorOccupation || null,
          amount: record.amount,
          date: record.date,
          type: record.type || "monetary",
          source: record.source,
        })
        .run();

      donationsCreated++;
    } catch (err) {
      console.warn(
        `  Warning: failed to insert donation from "${record.donorName}": ${err}`
      );
    }
  }

  console.log(`  Created ${campaignsCreated} campaign(s), ${donationsCreated} donation(s).`);

  return {
    processed: records.length,
    created: donationsCreated,
    updated: campaignsCreated,
  };
}

// ─── Main ──────────────────────────────────────────────────────────────

export async function scrapeDonations(options?: {
  csvPath?: string;
}): Promise<void> {
  const runId = await startRun(SCRAPER_NAME);

  try {
    if (!options?.csvPath) {
      console.log("No CSV file provided. Usage:");
      console.log("  tsx src/scrapers/scrape-donations.ts path/to/donations.csv");
      await completeRun(runId, { processed: 0, created: 0, updated: 0 });
      return;
    }

    const records = importFromCsv(options.csvPath);
    console.log(`Found ${records.length} donation records.`);

    if (records.length === 0) {
      await completeRun(runId, { processed: 0, created: 0, updated: 0 });
      return;
    }

    const stats = insertRecords(records);
    await completeRun(runId, stats);

    console.log("\n--- Donation Scraper Summary ---");
    console.log(`  Donations processed:  ${stats.processed}`);
    console.log(`  Donations created:    ${stats.created}`);
    console.log(`  Campaigns upserted:   ${stats.updated}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await failRun(runId, message);
    throw err;
  }
}

// ─── CLI Entry Point ───────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  let csvPath: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]!;
    if ((arg === "--file" || arg === "-f") && args[i + 1]) {
      csvPath = args[i + 1]!;
      i++;
    } else if (arg.endsWith(".csv")) {
      csvPath = arg;
    }
  }

  await scrapeDonations({ csvPath });
}

const isDirectRun =
  process.argv[1]?.includes("scrape-donations") ?? false;
if (isDirectRun) {
  main().catch((err) => {
    console.error("Donation scraper failed:", err);
    process.exit(1);
  });
}
