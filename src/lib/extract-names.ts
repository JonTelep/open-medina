/**
 * Regex-based name extraction from meeting/document text.
 * Returns an array of { name, context } where context is a ~80 char snippet.
 */

import { HONORIFICS } from "./constants";

interface ExtractedName {
  name: string;
  context: string;
}

// Words that look like names but aren't (place names, months, common words)
const STOPLIST = new Set([
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
  "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
  "medina", "brunswick", "wadsworth", "seville", "lodi", "hinckley",
  "granger", "montville", "litchfield", "chatham", "homer", "spencer",
  "harrisville", "guilford", "westfield", "sharon", "york", "lafayette",
  "liverpool", "congress",
  "ohio", "county", "state", "city", "township", "village",
  "court", "office", "department", "board", "commission",
  "resolution", "motion", "second", "vote", "meeting",
  "public", "general", "special", "regular",
]);

// Build honorific pattern
const honorificPattern = HONORIFICS.map((h) => h.replace(".", "\\.")).join("|");

// Name pattern: optional honorific + capitalized first name + capitalized last name (+ optional middle/suffix)
const NAME_REGEX = new RegExp(
  `(?:(?:${honorificPattern})\\.?\\s+)?` +          // optional honorific
  `([A-Z][a-z]{1,20})` +                             // first name
  `(?:\\s+[A-Z]\\.?)?` +                              // optional middle initial
  `\\s+` +
  `([A-Z][a-z]{1,20}(?:-[A-Z][a-z]{1,20})?)` +       // last name (possibly hyphenated)
  `(?:\\s+(?:Jr|Sr|II|III|IV)\\.?)?`,                  // optional suffix
  "g"
);

function extractContext(text: string, matchIndex: number, matchLength: number): string {
  const contextRadius = 40;
  const start = Math.max(0, matchIndex - contextRadius);
  const end = Math.min(text.length, matchIndex + matchLength + contextRadius);
  let snippet = text.slice(start, end).replace(/\s+/g, " ").trim();
  if (start > 0) snippet = "..." + snippet;
  if (end < text.length) snippet = snippet + "...";
  return snippet;
}

export function extractNamesFromText(text: string): ExtractedName[] {
  const seen = new Set<string>();
  const results: ExtractedName[] = [];

  let match: RegExpExecArray | null;
  NAME_REGEX.lastIndex = 0;

  while ((match = NAME_REGEX.exec(text)) !== null) {
    const firstName = match[1]!;
    const lastName = match[2]!;

    // Skip stoplist words
    if (
      STOPLIST.has(firstName.toLowerCase()) ||
      STOPLIST.has(lastName.toLowerCase())
    ) {
      continue;
    }

    // Skip very short names (likely false positives)
    if (firstName.length < 2 || lastName.length < 2) continue;

    // Build the full matched name (strip honorific for storage)
    const fullName = match[0]
      .replace(new RegExp(`^(?:${honorificPattern})\\.?\\s+`, "i"), "")
      .trim();

    // Deduplicate by normalized key
    const key = `${firstName.toLowerCase()}|${lastName.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const context = extractContext(text, match.index, match[0].length);
    results.push({ name: fullName, context });
  }

  return results;
}
