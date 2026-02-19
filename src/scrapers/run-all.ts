/**
 * Orchestrator: run all scrapers in sequence, then entity resolution.
 *
 * Usage:
 *   tsx src/scrapers/run-all.ts
 *   tsx src/scrapers/run-all.ts --salaries-csv path/to/salaries.csv
 *   tsx src/scrapers/run-all.ts --docket-csv path/to/docket.csv
 */

import { scrapeSalaries } from "./scrape-salaries";
import { scrapeDocket } from "./scrape-docket";
import { scrapeMeetings } from "./scrape-meetings";
import { scrapeDonations } from "./scrape-donations";
import { scrapeLegislation } from "./scrape-legislation";
import { scrapeResolutions } from "./scrape-resolutions";

interface OrchestratorArgs {
  salariesCsv?: string;
  salariesYear?: number;
  docketCsv?: string;
  meetingsCsv?: string;
  donationsCsv?: string;
}

function parseArgs(): OrchestratorArgs {
  const args = process.argv.slice(2);
  const result: OrchestratorArgs = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]!;

    if (arg === "--salaries-csv" && args[i + 1]) {
      result.salariesCsv = args[i + 1]!;
      i++;
    } else if (arg === "--salaries-year" && args[i + 1]) {
      result.salariesYear = parseInt(args[i + 1]!, 10);
      i++;
    } else if (arg === "--docket-csv" && args[i + 1]) {
      result.docketCsv = args[i + 1]!;
      i++;
    } else if (arg === "--meetings-csv" && args[i + 1]) {
      result.meetingsCsv = args[i + 1]!;
      i++;
    } else if (arg === "--donations-csv" && args[i + 1]) {
      result.donationsCsv = args[i + 1]!;
      i++;
    }
  }

  return result;
}

async function main() {
  const args = parseArgs();
  const startTime = Date.now();
  const results: { name: string; status: string; error?: string }[] = [];

  console.log("===========================================");
  console.log("  OpenMedina");
  console.log("  Running all scrapers");
  console.log("===========================================\n");

  // ─── 1. Salaries ───────────────────────────────────────────────────

  console.log("--- [1/7] Salary Scraper ---\n");
  try {
    await scrapeSalaries({
      csvPath: args.salariesCsv,
      year: args.salariesYear,
    });
    results.push({ name: "Salaries", status: "completed" });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Salary scraper failed: ${message}\n`);
    results.push({ name: "Salaries", status: "failed", error: message });
  }

  // ─── 2. Docket ─────────────────────────────────────────────────────

  console.log("\n--- [2/7] Docket Scraper ---\n");
  if (args.docketCsv) {
    try {
      await scrapeDocket({ csvPath: args.docketCsv });
      results.push({ name: "Docket", status: "completed" });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Docket scraper failed: ${message}\n`);
      results.push({ name: "Docket", status: "failed", error: message });
    }
  } else {
    console.log("  Skipped (no --docket-csv provided)");
    results.push({ name: "Docket", status: "skipped" });
  }

  // ─── 3. Meetings ──────────────────────────────────────────────────

  console.log("\n--- [3/7] Meetings Scraper ---\n");
  if (args.meetingsCsv) {
    try {
      await scrapeMeetings({ csvPath: args.meetingsCsv });
      results.push({ name: "Meetings", status: "completed" });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Meetings scraper failed: ${message}\n`);
      results.push({ name: "Meetings", status: "failed", error: message });
    }
  } else {
    console.log("  Skipped (no --meetings-csv provided)");
    results.push({ name: "Meetings", status: "skipped" });
  }

  // ─── 4. Donations ─────────────────────────────────────────────────

  console.log("\n--- [4/7] Donations Scraper ---\n");
  if (args.donationsCsv) {
    try {
      await scrapeDonations({ csvPath: args.donationsCsv });
      results.push({ name: "Donations", status: "completed" });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Donations scraper failed: ${message}\n`);
      results.push({ name: "Donations", status: "failed", error: message });
    }
  } else {
    console.log("  Skipped (no --donations-csv provided)");
    results.push({ name: "Donations", status: "skipped" });
  }

  // ─── 5. Legislation ──────────────────────────────────────────────

  console.log("\n--- [5/7] Legislation Scraper ---\n");
  try {
    await scrapeLegislation();
    results.push({ name: "Legislation", status: "completed" });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Legislation scraper failed: ${message}\n`);
    results.push({ name: "Legislation", status: "failed", error: message });
  }

  // ─── 6. Resolutions ────────────────────────────────────────────────

  console.log("\n--- [6/7] Resolutions Scraper ---\n");
  try {
    await scrapeResolutions();
    results.push({ name: "Resolutions", status: "completed" });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Resolutions scraper failed: ${message}\n`);
    results.push({ name: "Resolutions", status: "failed", error: message });
  }

  // ─── 7. Entity Resolution ─────────────────────────────────────────

  console.log("\n--- [7/7] Entity Resolution ---\n");
  try {
    // Import runs the script's top-level code which does entity resolution
    await import("./resolve-entities");
    results.push({ name: "Entity Resolution", status: "completed" });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Entity resolution failed: ${message}\n`);
    results.push({
      name: "Entity Resolution",
      status: "failed",
      error: message,
    });
  }

  // ─── Summary ───────────────────────────────────────────────────────

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log("\n===========================================");
  console.log("  Overall Summary");
  console.log("===========================================");
  console.log(`  Total time: ${elapsed}s\n`);

  for (const r of results) {
    const icon =
      r.status === "completed"
        ? "[OK]"
        : r.status === "skipped"
          ? "[SKIP]"
          : "[FAIL]";
    const errorSuffix = r.error ? ` — ${r.error}` : "";
    console.log(`  ${icon} ${r.name}${errorSuffix}`);
  }

  const failures = results.filter((r) => r.status === "failed");
  if (failures.length > 0) {
    console.log(`\n  ${failures.length} scraper(s) failed.`);
    process.exit(1);
  }

  console.log("\n  All scrapers completed successfully.");
}

main().catch((err) => {
  console.error("Orchestrator failed:", err);
  process.exit(1);
});
