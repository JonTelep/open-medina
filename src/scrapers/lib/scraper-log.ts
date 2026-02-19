/**
 * Scraper run logging.
 * Tracks each scraper run with status, timing, and record counts.
 */

import { db } from "@/db/index";
import { scraperRuns } from "@/db/schema";
import { eq } from "drizzle-orm";

export interface RunStats {
  processed: number;
  created: number;
  updated: number;
}

/**
 * Insert a new scraper_runs row with status "running".
 * Returns the auto-generated run ID.
 */
export async function startRun(scraperName: string): Promise<number> {
  const result = db
    .insert(scraperRuns)
    .values({
      scraperName,
      status: "running",
    })
    .returning({ id: scraperRuns.id })
    .get();

  console.log(
    `[${scraperName}] Run #${result.id} started at ${new Date().toISOString()}`
  );
  return result.id;
}

/**
 * Mark a run as completed with final record counts.
 */
export async function completeRun(
  runId: number,
  stats: RunStats
): Promise<void> {
  db.update(scraperRuns)
    .set({
      status: "completed",
      recordsProcessed: stats.processed,
      recordsCreated: stats.created,
      recordsUpdated: stats.updated,
      completedAt: new Date().toISOString(),
    })
    .where(eq(scraperRuns.id, runId))
    .run();

  console.log(
    `[Run #${runId}] Completed — processed: ${stats.processed}, created: ${stats.created}, updated: ${stats.updated}`
  );
}

/**
 * Mark a run as failed with an error message.
 */
export async function failRun(runId: number, error: string): Promise<void> {
  db.update(scraperRuns)
    .set({
      status: "failed",
      error,
      completedAt: new Date().toISOString(),
    })
    .where(eq(scraperRuns.id, runId))
    .run();

  console.error(`[Run #${runId}] Failed — ${error}`);
}
