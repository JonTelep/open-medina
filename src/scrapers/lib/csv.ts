/**
 * Simple CSV parsing utilities.
 * Handles quoted fields, commas within quotes, and escaped quotes.
 * No external CSV library required.
 */

import { readFileSync } from "fs";

/**
 * Parse a single CSV line into an array of field values.
 * Handles quoted fields with commas and escaped double-quotes ("").
 */
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const ch = line[i]!;

    if (inQuotes) {
      if (ch === '"') {
        // Check for escaped quote ("")
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i += 2;
          continue;
        }
        // End of quoted field
        inQuotes = false;
        i++;
        continue;
      }
      current += ch;
      i++;
    } else {
      if (ch === '"') {
        inQuotes = true;
        i++;
        continue;
      }
      if (ch === ",") {
        fields.push(current.trim());
        current = "";
        i++;
        continue;
      }
      current += ch;
      i++;
    }
  }

  fields.push(current.trim());
  return fields;
}

/**
 * Parse a CSV string into an array of objects keyed by header names.
 * The first row is treated as the header row.
 */
export function parseCsvString(csv: string): Record<string, string>[] {
  // Normalize line endings and split
  const lines = csv.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");

  // Filter out empty lines
  const nonEmpty = lines.filter((line) => line.trim().length > 0);
  if (nonEmpty.length < 2) {
    return [];
  }

  const headers = parseCsvLine(nonEmpty[0]!);
  const records: Record<string, string>[] = [];

  for (let i = 1; i < nonEmpty.length; i++) {
    const values = parseCsvLine(nonEmpty[i]!);
    const record: Record<string, string> = {};

    for (let j = 0; j < headers.length; j++) {
      const header = headers[j]!;
      record[header] = values[j] ?? "";
    }

    records.push(record);
  }

  return records;
}

/**
 * Read and parse a CSV file from disk, returning an array of objects.
 */
export function parseCsvFile(filePath: string): Record<string, string>[] {
  const content = readFileSync(filePath, "utf-8");
  return parseCsvString(content);
}
