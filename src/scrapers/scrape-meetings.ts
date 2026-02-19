/**
 * Meeting minutes scraper/importer for Medina County.
 *
 * Modes:
 *   1. CSV import: date, title, body columns
 *   2. PDF import: extracts text from PDF files
 *
 * Usage:
 *   tsx src/scrapers/scrape-meetings.ts path/to/meetings.csv
 *   tsx src/scrapers/scrape-meetings.ts --pdf path/to/minutes.pdf --date 2024-01-09 --title "Regular Session"
 */

import { db } from "@/db/index";
import { meetings, meetingMentions } from "@/db/schema";
import { sql } from "drizzle-orm";
import { parseCsvFile } from "./lib/csv";
import { startRun, completeRun, failRun } from "./lib/scraper-log";
import { extractNamesFromText } from "@/lib/extract-names";

const SCRAPER_NAME = "meetings";

interface MeetingRecord {
  date: string;
  title: string;
  body: string;
  source: string;
}

// ─── CSV Import ────────────────────────────────────────────────────────

function importFromCsv(filePath: string): MeetingRecord[] {
  console.log(`Importing meetings from CSV: ${filePath}`);
  const rows = parseCsvFile(filePath);
  const records: MeetingRecord[] = [];

  for (const row of rows) {
    const date =
      row["date"] || row["Date"] || row["meeting_date"] || row["Meeting Date"] || "";
    const title =
      row["title"] || row["Title"] || row["subject"] || row["Subject"] || "";
    const body =
      row["body"] || row["Body"] || row["text"] || row["Text"] ||
      row["minutes"] || row["Minutes"] || row["content"] || row["Content"] || "";

    if (!date || !body) continue;

    const normalizedDate = normalizeDate(date);
    if (!normalizedDate) {
      console.warn(`  Skipping row with unparseable date: "${date}"`);
      continue;
    }

    records.push({
      date: normalizedDate,
      title: title || `Meeting ${normalizedDate}`,
      body,
      source: `csv:${filePath}`,
    });
  }

  return records;
}

// ─── PDF Import ────────────────────────────────────────────────────────

async function importFromPdf(
  filePath: string,
  date: string,
  title?: string
): Promise<MeetingRecord[]> {
  console.log(`Importing meeting from PDF: ${filePath}`);

  const { extractPdfText } = await import("./lib/pdf");
  const body = await extractPdfText(filePath);

  if (!body || body.trim().length === 0) {
    console.warn("  PDF extraction returned empty text.");
    return [];
  }

  return [
    {
      date,
      title: title || `Meeting ${date}`,
      body,
      source: `pdf:${filePath}`,
    },
  ];
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

function insertRecords(records: MeetingRecord[]): InsertStats {
  let created = 0;
  let mentionsCreated = 0;

  for (const record of records) {
    try {
      const meetingResult = db
        .insert(meetings)
        .values({
          date: record.date,
          title: record.title,
          body: record.body,
          source: record.source,
        })
        .onConflictDoUpdate({
          target: [meetings.date, meetings.source],
          set: {
            title: sql`excluded.title`,
            body: sql`excluded.body`,
          },
        })
        .returning({ id: meetings.id })
        .get();

      const meetingId = meetingResult.id;
      created++;

      // Extract names and create mentions
      if (record.body) {
        const names = extractNamesFromText(record.body);
        for (const { name, context } of names) {
          try {
            db.insert(meetingMentions)
              .values({
                meetingId,
                rawName: name,
                context,
              })
              .run();
            mentionsCreated++;
          } catch {
            // Duplicate or other insert error — skip
          }
        }
        console.log(
          `  Meeting ${record.date}: extracted ${names.length} name mentions`
        );
      }
    } catch (err) {
      console.warn(
        `  Warning: failed to insert meeting "${record.date}": ${err}`
      );
    }
  }

  return { processed: records.length, created, updated: mentionsCreated };
}

// ─── Main ──────────────────────────────────────────────────────────────

export async function scrapeMeetings(options?: {
  csvPath?: string;
  pdfPath?: string;
  date?: string;
  title?: string;
}): Promise<void> {
  const runId = await startRun(SCRAPER_NAME);

  try {
    let records: MeetingRecord[];

    if (options?.csvPath) {
      records = importFromCsv(options.csvPath);
    } else if (options?.pdfPath && options?.date) {
      records = await importFromPdf(
        options.pdfPath,
        options.date,
        options.title
      );
    } else {
      console.log("No input provided. Usage:");
      console.log("  tsx src/scrapers/scrape-meetings.ts path/to/meetings.csv");
      console.log(
        '  tsx src/scrapers/scrape-meetings.ts --pdf path/to/minutes.pdf --date 2024-01-09 --title "Regular Session"'
      );
      await completeRun(runId, { processed: 0, created: 0, updated: 0 });
      return;
    }

    console.log(`Found ${records.length} meeting records.`);

    if (records.length === 0) {
      await completeRun(runId, { processed: 0, created: 0, updated: 0 });
      return;
    }

    const stats = insertRecords(records);
    await completeRun(runId, stats);

    console.log("\n--- Meeting Scraper Summary ---");
    console.log(`  Meetings processed: ${stats.processed}`);
    console.log(`  Meetings created:   ${stats.created}`);
    console.log(`  Mentions created:   ${stats.updated}`);
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
  let pdfPath: string | undefined;
  let date: string | undefined;
  let title: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]!;
    if (arg === "--pdf" && args[i + 1]) {
      pdfPath = args[i + 1]!;
      i++;
    } else if (arg === "--date" && args[i + 1]) {
      date = args[i + 1]!;
      i++;
    } else if (arg === "--title" && args[i + 1]) {
      title = args[i + 1]!;
      i++;
    } else if (arg.endsWith(".csv")) {
      csvPath = arg;
    }
  }

  await scrapeMeetings({ csvPath, pdfPath, date, title });
}

const isDirectRun =
  process.argv[1]?.includes("scrape-meetings") ?? false;
if (isDirectRun) {
  main().catch((err) => {
    console.error("Meeting scraper failed:", err);
    process.exit(1);
  });
}
