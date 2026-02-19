import { HONORIFICS, SUFFIXES } from "./constants";

export interface ParsedName {
  first: string;
  middle: string;
  last: string;
  suffix: string;
}

const HONORIFIC_SET = new Set(HONORIFICS.map((h) => h.toLowerCase()));
const SUFFIX_SET = new Set(SUFFIXES.map((s) => s.toLowerCase()));

/**
 * Strip periods and normalize whitespace from a raw name string.
 */
function clean(raw: string): string {
  return raw
    .replace(/\./g, "") // remove periods ("SMITH, JOHN A." -> "SMITH, JOHN A")
    .replace(/\s+/g, " ") // collapse whitespace
    .trim();
}

/**
 * Check if a token (lowercased, no periods) is a name suffix.
 * Handles "Jr", "III", "Esq", etc.
 */
function isSuffix(token: string): boolean {
  return SUFFIX_SET.has(token.toLowerCase());
}

/**
 * Check if a token (lowercased, no periods) is an honorific.
 */
function isHonorific(token: string): boolean {
  return HONORIFIC_SET.has(token.toLowerCase());
}

/**
 * Strip leading honorifics from a list of tokens.
 * Returns remaining tokens.
 */
function stripHonorifics(tokens: string[]): string[] {
  let i = 0;
  while (i < tokens.length && isHonorific(tokens[i]!)) {
    i++;
  }
  return tokens.slice(i);
}

/**
 * Extract suffix tokens from the end of a list of tokens.
 * Returns [remainingTokens, suffix].
 */
function extractSuffix(tokens: string[]): [string[], string] {
  const suffixes: string[] = [];
  let i = tokens.length - 1;
  while (i >= 0 && isSuffix(tokens[i]!)) {
    suffixes.unshift(tokens[i]!);
    i--;
  }
  return [tokens.slice(0, i + 1), suffixes.join(" ")];
}

/**
 * Detect "Last, First Middle" vs "First Middle Last" format,
 * extract suffix, strip honorifics, and return parsed components.
 *
 * Handles:
 * - "Smith, John A."
 * - "SMITH, JOHN A"
 * - "John A. Smith"
 * - "John Smith Jr"
 * - "Dr. John A. Smith III"
 * - "Commissioner Smith, John"
 */
export function parseName(raw: string): ParsedName {
  const cleaned = clean(raw);

  if (!cleaned) {
    return { first: "", middle: "", last: "", suffix: "" };
  }

  const hasComma = cleaned.includes(",");

  if (hasComma) {
    // "Last, First Middle Suffix" or "Last Suffix, First Middle"
    const [beforeComma, afterComma] = cleaned.split(",", 2).map((s) => s!.trim());

    if (!afterComma || !beforeComma) {
      // Degenerate case: just treat the whole thing as last name
      const tokens = stripHonorifics(cleaned.replace(",", "").split(" "));
      const [remaining, suffix] = extractSuffix(tokens);
      return {
        first: "",
        middle: "",
        last: remaining.join(" ").toLowerCase(),
        suffix: suffix.toLowerCase(),
      };
    }

    // Before comma: last name, possibly with suffix
    const beforeTokens = stripHonorifics(beforeComma.split(" "));
    const [lastTokens, suffixFromBefore] = extractSuffix(beforeTokens);

    // After comma: first, middle, possibly suffix
    const afterTokens = stripHonorifics(afterComma.split(" "));
    const [nameTokens, suffixFromAfter] = extractSuffix(afterTokens);

    const suffix = suffixFromBefore || suffixFromAfter;
    const last = lastTokens.join(" ").toLowerCase();
    const first = (nameTokens[0] ?? "").toLowerCase();
    const middle = nameTokens.slice(1).join(" ").toLowerCase();

    return { first, middle, last, suffix: suffix.toLowerCase() };
  } else {
    // "First Middle Last Suffix" or "Honorific First Last"
    let tokens = stripHonorifics(cleaned.split(" "));
    const [remaining, suffix] = extractSuffix(tokens);
    tokens = remaining;

    if (tokens.length === 0) {
      return { first: "", middle: "", last: "", suffix: suffix.toLowerCase() };
    }

    if (tokens.length === 1) {
      // Single name -- treat as last name
      return {
        first: "",
        middle: "",
        last: tokens[0]!.toLowerCase(),
        suffix: suffix.toLowerCase(),
      };
    }

    // Last token is the last name; first token is first; everything in between is middle
    const first = tokens[0]!.toLowerCase();
    const last = tokens[tokens.length - 1]!.toLowerCase();
    const middle = tokens
      .slice(1, -1)
      .join(" ")
      .toLowerCase();

    return { first, middle, last, suffix: suffix.toLowerCase() };
  }
}

/**
 * Produce a normalized key from parsed name components.
 * Format: "last|first|middle_initial"
 * All lowercase, trimmed. Middle is reduced to initial only.
 */
export function normalizeKey(parsed: ParsedName): string {
  const last = parsed.last.trim();
  const first = parsed.first.trim();
  const middleInitial = parsed.middle.trim() ? parsed.middle.trim()[0]! : "";

  return `${last}|${first}|${middleInitial}`;
}

/**
 * Convenience: parse a raw name string and return its normalized key.
 */
export function normalizeName(raw: string): string {
  return normalizeKey(parseName(raw));
}
