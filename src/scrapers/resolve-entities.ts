/**
 * CLI script: resolve unlinked raw names across all source tables.
 *
 * Scans salaries, docket_line_items, donations, and meeting_mentions
 * for rows with NULL personId, runs entity resolution, and updates
 * the foreign key.
 *
 * Usage: tsx src/scrapers/resolve-entities.ts
 */

import { db } from "@/db/index";
import {
  salaries,
  docketLineItems,
  donations,
  meetingMentions,
} from "@/db/schema";
import { isNull, eq } from "drizzle-orm";
import { resolveEntity, type ResolveResult } from "@/lib/entity-resolution";
import { startRun, completeRun, failRun } from "./lib/scraper-log";
import { rebuildSearchIndex } from "@/db/queries/search";

interface Stats {
  processed: number;
  matched: number;
  created: number;
  skipped: number;
  byConfidence: Record<string, number>;
}

function newStats(): Stats {
  return {
    processed: 0,
    matched: 0,
    created: 0,
    skipped: 0,
    byConfidence: {},
  };
}

function recordResult(stats: Stats, result: ResolveResult): void {
  stats.processed++;
  if (result.personId === null) {
    stats.skipped++;
  } else if (result.isNew) {
    stats.created++;
  } else {
    stats.matched++;
  }
  const key = String(result.confidence);
  stats.byConfidence[key] = (stats.byConfidence[key] ?? 0) + 1;
}

function printStats(label: string, stats: Stats): void {
  console.log(`\n  ${label}:`);
  console.log(`    Processed: ${stats.processed}`);
  console.log(`    Matched:   ${stats.matched} (existing person)`);
  console.log(`    Created:   ${stats.created} (new person)`);
  console.log(`    Skipped:   ${stats.skipped} (empty/unparseable)`);
  if (Object.keys(stats.byConfidence).length > 0) {
    console.log(`    By confidence:`);
    for (const [conf, count] of Object.entries(stats.byConfidence).sort()) {
      console.log(`      ${conf}: ${count}`);
    }
  }
}

// ---------------------------------------------------------------------------

async function main() {
  const runId = await startRun("entity-resolution");

  try {
    console.log("Entity Resolution - Medina County Accountability Tracker");
    console.log("=========================================================\n");

    const totalStats = newStats();

    // --- Salaries ---
    console.log("Resolving salaries...");
    const salaryStats = newStats();
    const unresolvedSalaries = db
      .select({
        id: salaries.id,
        rawName: salaries.rawName,
        department: salaries.department,
      })
      .from(salaries)
      .where(isNull(salaries.personId))
      .all();

    for (const row of unresolvedSalaries) {
      const result = resolveEntity(row.rawName, "salary", row.department ?? undefined);
      recordResult(salaryStats, result);
      if (result.personId !== null) {
        db.update(salaries)
          .set({ personId: result.personId })
          .where(eq(salaries.id, row.id))
          .run();
      }
    }
    printStats("Salaries", salaryStats);

    // --- Docket Line Items ---
    console.log("\nResolving docket line items...");
    const docketStats = newStats();
    const unresolvedDocket = db
      .select({
        id: docketLineItems.id,
        rawVendorName: docketLineItems.rawVendorName,
        department: docketLineItems.department,
      })
      .from(docketLineItems)
      .where(isNull(docketLineItems.personId))
      .all();

    for (const row of unresolvedDocket) {
      const result = resolveEntity(
        row.rawVendorName,
        "docket",
        row.department ?? undefined
      );
      recordResult(docketStats, result);
      if (result.personId !== null) {
        db.update(docketLineItems)
          .set({ personId: result.personId })
          .where(eq(docketLineItems.id, row.id))
          .run();
      }
    }
    printStats("Docket Line Items", docketStats);

    // --- Donations ---
    console.log("\nResolving donations...");
    const donationStats = newStats();
    const unresolvedDonations = db
      .select({
        id: donations.id,
        rawDonorName: donations.rawDonorName,
      })
      .from(donations)
      .where(isNull(donations.donorPersonId))
      .all();

    for (const row of unresolvedDonations) {
      const result = resolveEntity(row.rawDonorName, "donation");
      recordResult(donationStats, result);
      if (result.personId !== null) {
        db.update(donations)
          .set({ donorPersonId: result.personId })
          .where(eq(donations.id, row.id))
          .run();
      }
    }
    printStats("Donations", donationStats);

    // --- Meeting Mentions ---
    console.log("\nResolving meeting mentions...");
    const mentionStats = newStats();
    const unresolvedMentions = db
      .select({
        id: meetingMentions.id,
        rawName: meetingMentions.rawName,
      })
      .from(meetingMentions)
      .where(isNull(meetingMentions.personId))
      .all();

    for (const row of unresolvedMentions) {
      const result = resolveEntity(row.rawName, "meeting");
      recordResult(mentionStats, result);
      if (result.personId !== null) {
        db.update(meetingMentions)
          .set({ personId: result.personId })
          .where(eq(meetingMentions.id, row.id))
          .run();
      }
    }
    printStats("Meeting Mentions", mentionStats);

    // --- Summary ---
    const allStats = [salaryStats, docketStats, donationStats, mentionStats];
    for (const s of allStats) {
      totalStats.processed += s.processed;
      totalStats.matched += s.matched;
      totalStats.created += s.created;
      totalStats.skipped += s.skipped;
      for (const [conf, count] of Object.entries(s.byConfidence)) {
        totalStats.byConfidence[conf] = (totalStats.byConfidence[conf] ?? 0) + count;
      }
    }

    console.log("\n=========================================================");
    printStats("TOTAL", totalStats);

    // Rebuild FTS5 search index after resolution
    console.log("\nRebuilding search index...");
    rebuildSearchIndex();
    console.log("Search index rebuilt.");

    await completeRun(runId, {
      processed: totalStats.processed,
      created: totalStats.created,
      updated: totalStats.matched,
    });

    console.log("\nDone.");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await failRun(runId, message);
    throw err;
  }
}

main().catch((err) => {
  console.error("Entity resolution failed:", err);
  process.exit(1);
});
