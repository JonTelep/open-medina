/**
 * County resolution scraper for Medina County.
 *
 * Scrapes commissioner resolutions from medinaco.org/resolutions/
 * using Cheerio for HTML parsing.
 *
 * Usage:
 *   npx tsx src/scrapers/scrape-resolutions.ts
 */

import { db } from "@/db/index";
import { countyResolutions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { startRun, completeRun, failRun } from "./lib/scraper-log";
import { fetchHtml } from "./lib/http";

const SCRAPER_NAME = "resolutions";
const BASE_URL = "https://medinaco.org/resolutions/";
const POLITE_DELAY_MS = 2000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface ResolutionRecord {
  resolutionNumber: string;
  date: string;
  title: string;
  pdfUrl: string | null;
}

async function scrapeResolutionPage(url: string): Promise<{
  records: ResolutionRecord[];
  nextPageUrl: string | null;
}> {
  console.log(`  Fetching ${url}...`);
  const $ = await fetchHtml(url);
  const records: ResolutionRecord[] = [];

  // WordPress typical patterns for resolution listings
  // Try common selectors for article/entry content
  $("article, .entry, .post, .resolution-item, tr").each((_, el) => {
    const $el = $(el);
    const text = $el.text().trim();

    // Try to extract resolution number (e.g., "2024-123" or "Resolution 2024-123")
    const numMatch = text.match(/(?:Resolution\s+)?(\d{4}-\d{2,4})/i);
    if (!numMatch) return;

    const resolutionNumber = numMatch[1]!;

    // Extract date
    const dateMatch = text.match(
      /(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}|(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4})/i
    );
    let date = "";
    if (dateMatch) {
      const raw = dateMatch[1]!;
      // Try to normalize to ISO format
      if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
        date = raw;
      } else {
        const parsed = new Date(raw);
        if (!isNaN(parsed.getTime())) {
          date = parsed.toISOString().slice(0, 10);
        }
      }
    }

    // Extract title (often the main heading or link text within the entry)
    const titleEl = $el.find("h2, h3, h4, .entry-title, a").first();
    const title = titleEl.text().trim() || text.substring(0, 200);

    // Look for PDF link
    const pdfLink = $el.find('a[href$=".pdf"]').first();
    const pdfUrl = pdfLink.attr("href") || null;

    records.push({
      resolutionNumber,
      date,
      title: title.replace(/\s+/g, " ").substring(0, 500),
      pdfUrl,
    });
  });

  // Look for next page link (WordPress pagination)
  const nextLink =
    $('a.next, a.page-numbers.next, .nav-next a, a[rel="next"]').attr(
      "href"
    ) || null;

  return { records, nextPageUrl: nextLink };
}

export async function scrapeResolutions(): Promise<void> {
  const runId = await startRun(SCRAPER_NAME);
  let processed = 0;
  let created = 0;
  let updated = 0;

  try {
    let currentUrl: string | null = BASE_URL;
    let pageNum = 1;

    while (currentUrl) {
      console.log(`\nPage ${pageNum}:`);
      const { records, nextPageUrl } = await scrapeResolutionPage(currentUrl);

      console.log(`  Found ${records.length} resolutions on page ${pageNum}`);

      for (const record of records) {
        processed++;

        // Upsert by resolution number
        const existing = db
          .select({ id: countyResolutions.id })
          .from(countyResolutions)
          .where(eq(countyResolutions.resolutionNumber, record.resolutionNumber))
          .get();

        if (existing) {
          db.update(countyResolutions)
            .set({
              date: record.date || undefined,
              title: record.title,
              pdfUrl: record.pdfUrl,
            })
            .where(eq(countyResolutions.id, existing.id))
            .run();
          updated++;
        } else {
          db.insert(countyResolutions)
            .values({
              resolutionNumber: record.resolutionNumber,
              date: record.date,
              title: record.title,
              description: `Resolution ${record.resolutionNumber}: ${record.title}`,
              pdfUrl: record.pdfUrl,
              source: "medinaco.org",
            })
            .run();
          created++;
        }
      }

      currentUrl = nextPageUrl;
      pageNum++;

      // Polite delay between pages
      if (currentUrl) {
        await sleep(POLITE_DELAY_MS);
      }

      // Safety limit: don't paginate endlessly
      if (pageNum > 50) {
        console.log("  Reached page limit (50), stopping.");
        break;
      }
    }

    await completeRun(runId, { processed, created, updated });

    console.log("\n--- Resolution Scraper Summary ---");
    console.log(`  Resolutions processed: ${processed}`);
    console.log(`  Resolutions created:   ${created}`);
    console.log(`  Resolutions updated:   ${updated}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await failRun(runId, message);
    throw err;
  }
}

// ─── CLI Entry Point ────────────────────────────────────────────────

const isDirectRun =
  process.argv[1]?.includes("scrape-resolutions") ?? false;
if (isDirectRun) {
  scrapeResolutions().catch((err) => {
    console.error("Resolution scraper failed:", err);
    process.exit(1);
  });
}
