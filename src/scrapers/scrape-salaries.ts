/**
 * Salary scraper for Medina County.
 *
 * Modes:
 *   1. Web scrape: fetches salary data from openpayrolls.com for Medina County
 *   2. CSV import: pass a CSV file path as the first CLI argument
 *
 * Usage:
 *   tsx src/scrapers/scrape-salaries.ts                     # scrape web (2024)
 *   tsx src/scrapers/scrape-salaries.ts --year 2023         # scrape specific year
 *   tsx src/scrapers/scrape-salaries.ts path/to/salaries.csv  # import from CSV
 */

import { db } from "@/db/index";
import { salaries } from "@/db/schema";
import { sql } from "drizzle-orm";
import { fetchHtml } from "./lib/http";
import { parseCsvFile } from "./lib/csv";
import { startRun, completeRun, failRun } from "./lib/scraper-log";

const SCRAPER_NAME = "salaries";
const BASE_URL = "https://openpayrolls.com/county/medina-county-oh";

interface SalaryRecord {
  rawName: string;
  department: string;
  title: string;
  salary: number;
  year: number;
  source: string;
}

// ─── Web Scraping ──────────────────────────────────────────────────────

async function scrapeYear(year: number): Promise<SalaryRecord[]> {
  const url = `${BASE_URL}/${year}`;
  console.log(`Fetching ${url}...`);

  const records: SalaryRecord[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const pageUrl = page === 1 ? url : `${url}?page=${page}`;
    console.log(`  Page ${page}...`);

    let $;
    try {
      $ = await fetchHtml(pageUrl);
    } catch (err) {
      if (page === 1) throw err;
      // No more pages
      break;
    }

    const rows = $("table tbody tr");
    if (rows.length === 0) {
      hasMore = false;
      break;
    }

    rows.each((_i, row) => {
      const cells = $(row).find("td");
      if (cells.length < 3) return;

      const name = $(cells[0]).text().trim();
      const titleOrDept = $(cells[1]).text().trim();
      const salaryText = $(cells[2]).text().trim();

      if (!name || !salaryText) return;

      // Parse salary: remove $, commas
      const salaryNum = parseFloat(salaryText.replace(/[$,]/g, ""));
      if (isNaN(salaryNum)) return;

      // openpayrolls sometimes puts title in column 2, department in column 3
      // Adjust based on actual column count
      let title = "";
      let department = "";

      if (cells.length >= 4) {
        title = $(cells[1]).text().trim();
        department = $(cells[2]).text().trim();
        // salary would be in column 3 or beyond; re-parse
        const salaryCell = $(cells[3]).text().trim();
        const reParsed = parseFloat(salaryCell.replace(/[$,]/g, ""));
        if (!isNaN(reParsed)) {
          records.push({
            rawName: name,
            title,
            department,
            salary: reParsed,
            year,
            source: pageUrl,
          });
          return;
        }
      }

      records.push({
        rawName: name,
        title: titleOrDept,
        department: "",
        salary: salaryNum,
        year,
        source: pageUrl,
      });
    });

    // Check for next page link
    const nextLink = $("a:contains('Next'), a:contains('next'), a.next, a[rel='next']");
    if (nextLink.length === 0 || rows.length < 20) {
      hasMore = false;
    } else {
      page++;
    }

    // Be polite to the server
    await new Promise((r) => setTimeout(r, 1000));
  }

  return records;
}

// ─── CSV Import ────────────────────────────────────────────────────────

function importFromCsv(filePath: string): SalaryRecord[] {
  console.log(`Importing salaries from CSV: ${filePath}`);
  const rows = parseCsvFile(filePath);
  const records: SalaryRecord[] = [];

  for (const row of rows) {
    // Try various common header names
    const name =
      row["name"] || row["Name"] || row["employee_name"] || row["Employee Name"] || row["Employee"] || "";
    const dept =
      row["department"] || row["Department"] || row["dept"] || row["Dept"] || "";
    const titleVal =
      row["title"] || row["Title"] || row["job_title"] || row["Job Title"] || row["Position"] || "";
    const salaryStr =
      row["salary"] || row["Salary"] || row["pay"] || row["Pay"] || row["Total Pay"] || row["total_pay"] || "0";
    const yearStr =
      row["year"] || row["Year"] || "";

    const salary = parseFloat(salaryStr.replace(/[$,]/g, ""));
    if (!name || isNaN(salary)) continue;

    const year = yearStr ? parseInt(yearStr, 10) : new Date().getFullYear();

    records.push({
      rawName: name,
      department: dept,
      title: titleVal,
      salary,
      year,
      source: `csv:${filePath}`,
    });
  }

  return records;
}

// ─── Database Insert ───────────────────────────────────────────────────

interface InsertStats {
  processed: number;
  created: number;
  updated: number;
}

function insertRecords(records: SalaryRecord[]): InsertStats {
  let created = 0;
  let updated = 0;

  const insertStmt = db
    .insert(salaries)
    .values({
      rawName: sql.placeholder("rawName"),
      department: sql.placeholder("department"),
      title: sql.placeholder("title"),
      salary: sql.placeholder("salary"),
      year: sql.placeholder("year"),
      source: sql.placeholder("source"),
    })
    .onConflictDoUpdate({
      target: [salaries.rawName, salaries.year, salaries.department],
      set: {
        title: sql`excluded.title`,
        salary: sql`excluded.salary`,
        source: sql`excluded.source`,
      },
    })
    .prepare();

  for (const record of records) {
    try {
      insertStmt.run({
        rawName: record.rawName,
        department: record.department || null,
        title: record.title || null,
        salary: record.salary,
        year: record.year,
        source: record.source,
      });

      // SQLite: changes = 1 for both insert and update via ON CONFLICT.
      // For simplicity, count all as created (the ON CONFLICT handles dedup).
      created++;
    } catch (err) {
      console.warn(
        `  Warning: failed to insert "${record.rawName}" (${record.year}): ${err}`
      );
    }
  }

  return { processed: records.length, created, updated };
}

// ─── Main ──────────────────────────────────────────────────────────────

export async function scrapeSalaries(options?: {
  csvPath?: string;
  year?: number;
}): Promise<void> {
  const runId = await startRun(SCRAPER_NAME);

  try {
    let records: SalaryRecord[];

    if (options?.csvPath) {
      records = importFromCsv(options.csvPath);
    } else {
      const year = options?.year ?? 2024;
      records = await scrapeYear(year);
    }

    console.log(`Found ${records.length} salary records.`);

    if (records.length === 0) {
      await completeRun(runId, { processed: 0, created: 0, updated: 0 });
      return;
    }

    const stats = insertRecords(records);
    await completeRun(runId, stats);

    console.log("\n--- Salary Scraper Summary ---");
    console.log(`  Records processed: ${stats.processed}`);
    console.log(`  Records created:   ${stats.created}`);
    console.log(`  Records updated:   ${stats.updated}`);
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
  let year: number | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]!;
    if (arg === "--year" && args[i + 1]) {
      year = parseInt(args[i + 1]!, 10);
      i++;
    } else if (arg.endsWith(".csv")) {
      csvPath = arg;
    }
  }

  await scrapeSalaries({ csvPath, year });
}

// Only run CLI when this file is executed directly
const isDirectRun =
  process.argv[1]?.includes("scrape-salaries") ?? false;
if (isDirectRun) {
  main().catch((err) => {
    console.error("Salary scraper failed:", err);
    process.exit(1);
  });
}
