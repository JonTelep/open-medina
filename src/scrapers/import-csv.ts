/**
 * Generic CSV import CLI.
 *
 * Routes CSV imports to the appropriate scraper/importer based on type.
 *
 * Usage:
 *   tsx src/scrapers/import-csv.ts --type salary --file path/to/salaries.csv
 *   tsx src/scrapers/import-csv.ts --type docket --file path/to/docket.csv
 *   tsx src/scrapers/import-csv.ts --type donation --file path/to/donations.csv
 */

import { existsSync } from "fs";
import { resolve } from "path";
import { scrapeSalaries } from "./scrape-salaries";
import { scrapeDocket } from "./scrape-docket";
import { scrapeMeetings } from "./scrape-meetings";
import { scrapeDonations } from "./scrape-donations";

type ImportType = "salary" | "docket" | "meeting" | "donation";

interface CliArgs {
  type: ImportType;
  file: string;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  let type: string | undefined;
  let file: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]!;

    if ((arg === "--type" || arg === "-t") && args[i + 1]) {
      type = args[i + 1]!;
      i++;
    } else if ((arg === "--file" || arg === "-f") && args[i + 1]) {
      file = args[i + 1]!;
      i++;
    } else if (!type && !arg.startsWith("-")) {
      // Positional: first non-flag is type, second is file
      type = arg;
    } else if (type && !file && !arg.startsWith("-")) {
      file = arg;
    }
  }

  if (!type) {
    printUsage();
    console.error("Error: --type is required (salary, docket, meeting, or donation)");
    process.exit(1);
  }

  if (!["salary", "docket", "meeting", "donation"].includes(type)) {
    printUsage();
    console.error(
      `Error: invalid type "${type}". Must be one of: salary, docket, meeting, donation`
    );
    process.exit(1);
  }

  if (!file) {
    printUsage();
    console.error("Error: --file is required");
    process.exit(1);
  }

  const resolvedFile = resolve(file);
  if (!existsSync(resolvedFile)) {
    console.error(`Error: file not found: ${resolvedFile}`);
    process.exit(1);
  }

  return { type: type as ImportType, file: resolvedFile };
}

function printUsage() {
  console.log("Usage: tsx src/scrapers/import-csv.ts --type <type> --file <path>");
  console.log("");
  console.log("Types:");
  console.log("  salary    Import employee salary records");
  console.log("  docket    Import docket/vendor payment records");
  console.log("  meeting   Import meeting minutes records");
  console.log("  donation  Import campaign donation records");
  console.log("");
  console.log("Options:");
  console.log("  --type, -t   Import type (required)");
  console.log("  --file, -f   Path to CSV file (required)");
}

async function main() {
  const { type, file } = parseArgs();

  console.log(`\nImporting ${type} data from: ${file}\n`);

  switch (type) {
    case "salary":
      await scrapeSalaries({ csvPath: file });
      break;

    case "docket":
      await scrapeDocket({ csvPath: file });
      break;

    case "meeting":
      await scrapeMeetings({ csvPath: file });
      break;

    case "donation":
      await scrapeDonations({ csvPath: file });
      break;
  }
}

main().catch((err) => {
  console.error("CSV import failed:", err);
  process.exit(1);
});
