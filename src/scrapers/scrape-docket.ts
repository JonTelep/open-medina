/**
 * Docket (vendor payment) scraper/importer for Medina County.
 *
 * Currently operates as a CSV import tool since the Medina County Auditor
 * website structure may vary. Accepts a CSV file with docket line items
 * and groups them by date into docket records.
 *
 * CSV expected columns: date, vendor_name, department, description, amount, check_number, fund
 *
 * Usage:
 *   tsx src/scrapers/scrape-docket.ts path/to/docket.csv
 *   tsx src/scrapers/scrape-docket.ts --file path/to/docket.csv
 */

import { db } from "@/db/index";
import { dockets, docketLineItems } from "@/db/schema";
import { sql } from "drizzle-orm";
import { parseCsvFile } from "./lib/csv";
import { startRun, completeRun, failRun } from "./lib/scraper-log";

const SCRAPER_NAME = "docket";

interface DocketLineRecord {
  date: string;
  vendorName: string;
  department: string;
  description: string;
  amount: number;
  checkNumber: string;
  fund: string;
}

// ─── CSV Import ────────────────────────────────────────────────────────

function importFromCsv(filePath: string): DocketLineRecord[] {
  console.log(`Importing docket data from CSV: ${filePath}`);
  const rows = parseCsvFile(filePath);
  const records: DocketLineRecord[] = [];

  for (const row of rows) {
    const date =
      row["date"] || row["Date"] || row["payment_date"] || row["Payment Date"] || "";
    const vendorName =
      row["vendor_name"] || row["Vendor Name"] || row["vendor"] || row["Vendor"] || row["name"] || row["Name"] || "";
    const department =
      row["department"] || row["Department"] || row["dept"] || row["Dept"] || "";
    const description =
      row["description"] || row["Description"] || row["memo"] || row["Memo"] || "";
    const amountStr =
      row["amount"] || row["Amount"] || row["total"] || row["Total"] || "0";
    const checkNumber =
      row["check_number"] || row["Check Number"] || row["check"] || row["Check"] || row["check_no"] || "";
    const fund =
      row["fund"] || row["Fund"] || row["fund_name"] || row["Fund Name"] || "";

    const amount = parseFloat(amountStr.replace(/[$,]/g, ""));
    if (!date || !vendorName || isNaN(amount)) {
      continue;
    }

    // Normalize date to ISO format (YYYY-MM-DD)
    const normalizedDate = normalizeDate(date);
    if (!normalizedDate) {
      console.warn(`  Skipping row with unparseable date: "${date}"`);
      continue;
    }

    records.push({
      date: normalizedDate,
      vendorName,
      department,
      description,
      amount,
      checkNumber,
      fund,
    });
  }

  return records;
}

/**
 * Attempt to normalize a date string to YYYY-MM-DD format.
 */
function normalizeDate(dateStr: string): string | null {
  // Already ISO format
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }

  // MM/DD/YYYY or M/D/YYYY
  const mdyMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdyMatch) {
    const [, month, day, year] = mdyMatch;
    return `${year}-${month!.padStart(2, "0")}-${day!.padStart(2, "0")}`;
  }

  // MM-DD-YYYY
  const mdyDash = dateStr.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (mdyDash) {
    const [, month, day, year] = mdyDash;
    return `${year}-${month!.padStart(2, "0")}-${day!.padStart(2, "0")}`;
  }

  // Try native Date parsing as fallback
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

function insertRecords(
  records: DocketLineRecord[],
  source: string
): InsertStats {
  let docketsCreated = 0;
  let lineItemsCreated = 0;

  // Group records by date
  const byDate = new Map<string, DocketLineRecord[]>();
  for (const record of records) {
    const existing = byDate.get(record.date);
    if (existing) {
      existing.push(record);
    } else {
      byDate.set(record.date, [record]);
    }
  }

  console.log(
    `  Grouped into ${byDate.size} docket(s) across ${records.length} line items.`
  );

  for (const [date, lineRecords] of byDate) {
    // Calculate total amount for this docket
    const totalAmount = lineRecords.reduce((sum, r) => sum + r.amount, 0);

    // Upsert the docket record
    const docketResult = db
      .insert(dockets)
      .values({
        date,
        title: `Docket ${date}`,
        totalAmount,
        source,
      })
      .onConflictDoUpdate({
        target: [dockets.date, dockets.source],
        set: {
          totalAmount: sql`excluded.total_amount`,
          title: sql`excluded.title`,
        },
      })
      .returning({ id: dockets.id })
      .get();

    const docketId = docketResult.id;
    docketsCreated++;

    // Insert line items for this docket
    for (const line of lineRecords) {
      try {
        db.insert(docketLineItems)
          .values({
            docketId,
            rawVendorName: line.vendorName,
            department: line.department || null,
            description: line.description || null,
            amount: line.amount,
            checkNumber: line.checkNumber || null,
            fund: line.fund || null,
          })
          .run();

        lineItemsCreated++;
      } catch (err) {
        console.warn(
          `  Warning: failed to insert line item "${line.vendorName}" (${date}): ${err}`
        );
      }
    }
  }

  return {
    processed: records.length,
    created: lineItemsCreated,
    updated: docketsCreated, // report docket upserts as "updated"
  };
}

// ─── Main ──────────────────────────────────────────────────────────────

export async function scrapeDocket(options?: {
  csvPath?: string;
}): Promise<void> {
  const runId = await startRun(SCRAPER_NAME);

  try {
    if (!options?.csvPath) {
      console.log(
        "No CSV file provided. The docket scraper currently requires a CSV file."
      );
      console.log(
        "Usage: tsx src/scrapers/scrape-docket.ts path/to/docket.csv"
      );
      await completeRun(runId, { processed: 0, created: 0, updated: 0 });
      return;
    }

    const records = importFromCsv(options.csvPath);
    console.log(`Found ${records.length} docket line items.`);

    if (records.length === 0) {
      await completeRun(runId, { processed: 0, created: 0, updated: 0 });
      return;
    }

    const source = `csv:${options.csvPath}`;
    const stats = insertRecords(records, source);
    await completeRun(runId, stats);

    console.log("\n--- Docket Scraper Summary ---");
    console.log(`  Line items processed: ${stats.processed}`);
    console.log(`  Line items created:   ${stats.created}`);
    console.log(`  Dockets upserted:     ${stats.updated}`);
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

  await scrapeDocket({ csvPath });
}

// Only run CLI when this file is executed directly
const isDirectRun =
  process.argv[1]?.includes("scrape-docket") ?? false;
if (isDirectRun) {
  main().catch((err) => {
    console.error("Docket scraper failed:", err);
    process.exit(1);
  });
}
