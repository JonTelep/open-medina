import { db } from "@/db/index";
import { people, nameAliases } from "@/db/schema";
import { eq, and, like } from "drizzle-orm";
import { parseName, normalizeKey, type ParsedName } from "./name-utils";

export interface ResolveResult {
  personId: number | null;
  confidence: number;
  isNew: boolean;
}

interface AliasRow {
  personId: number;
  normalizedKey: string;
}

/**
 * Resolve a raw name string to a person in the database using 3-tier matching.
 *
 * Tier 1 (confidence 1.0): exact normalized key match in name_aliases
 * Tier 2 (confidence 0.9): last + first match (ignore middle)
 * Tier 3 (confidence 0.7): last + first initial match
 *
 * If department is provided and multiple candidates exist, prefer the one
 * in the matching department.
 *
 * If no match is found, create a new person and alias.
 * Always adds the raw name as an alias for the matched/created person.
 */
export function resolveEntity(
  rawName: string,
  source: string,
  department?: string
): ResolveResult {
  const parsed = parseName(rawName);
  const key = normalizeKey(parsed);

  // Skip empty/unparseable names
  if (!parsed.last && !parsed.first) {
    return { personId: null, confidence: 0, isNew: false };
  }

  // Check if this exact raw name + source combo already has an alias
  const existingExact = db
    .select({ personId: nameAliases.personId })
    .from(nameAliases)
    .where(and(eq(nameAliases.rawName, rawName), eq(nameAliases.source, source)))
    .get();

  if (existingExact) {
    return { personId: existingExact.personId, confidence: 1.0, isNew: false };
  }

  // --- Tier 1: Exact normalized key match ---
  const tier1Matches = db
    .select({
      personId: nameAliases.personId,
      normalizedKey: nameAliases.normalizedKey,
    })
    .from(nameAliases)
    .where(eq(nameAliases.normalizedKey, key))
    .all();

  const tier1Winner = pickBestMatch(tier1Matches, department);
  if (tier1Winner) {
    addAlias(tier1Winner.personId, rawName, key, source);
    return { personId: tier1Winner.personId, confidence: 1.0, isNew: false };
  }

  // --- Tier 2: last + first match (ignore middle) ---
  if (parsed.first) {
    const tier2Matches = findByLike(`${parsed.last}|${parsed.first}|%`);
    const tier2Winner = pickBestMatch(tier2Matches, department);
    if (tier2Winner) {
      addAlias(tier2Winner.personId, rawName, key, source);
      return { personId: tier2Winner.personId, confidence: 0.9, isNew: false };
    }
  }

  // --- Tier 3: last + first initial match ---
  if (parsed.first) {
    const firstInitial = parsed.first[0]!;
    const tier3Matches = findByLike(`${parsed.last}|${firstInitial}%`);
    const tier3Winner = pickBestMatch(tier3Matches, department);
    if (tier3Winner) {
      addAlias(tier3Winner.personId, rawName, key, source);
      return { personId: tier3Winner.personId, confidence: 0.7, isNew: false };
    }
  }

  // --- No match: create new person ---
  const displayName = buildDisplayName(parsed);
  const newPerson = db
    .insert(people)
    .values({
      displayName,
      type: "person",
      department: department ?? null,
    })
    .returning({ id: people.id })
    .get();

  addAlias(newPerson.id, rawName, key, source);
  return { personId: newPerson.id, confidence: 1.0, isNew: true };
}

/**
 * Execute a LIKE query against normalized_key.
 */
function findByLike(pattern: string): AliasRow[] {
  return db
    .select({
      personId: nameAliases.personId,
      normalizedKey: nameAliases.normalizedKey,
    })
    .from(nameAliases)
    .where(like(nameAliases.normalizedKey, pattern))
    .all();
}

/**
 * Among a list of alias matches, pick the best person.
 * If department is given and multiple distinct people matched,
 * prefer the one in the matching department.
 * Returns null if no matches.
 */
function pickBestMatch(
  matches: AliasRow[],
  department?: string
): AliasRow | null {
  if (matches.length === 0) return null;

  // Deduplicate by personId
  const uniquePersonIds = [...new Set(matches.map((m) => m.personId))];

  if (uniquePersonIds.length === 1) {
    return matches[0]!;
  }

  // Multiple people share this name -- use department to disambiguate
  if (department) {
    for (const personId of uniquePersonIds) {
      const person = db
        .select({ id: people.id, department: people.department })
        .from(people)
        .where(eq(people.id, personId))
        .get();

      if (
        person?.department &&
        person.department.toLowerCase() === department.toLowerCase()
      ) {
        return matches.find((m) => m.personId === personId)!;
      }
    }
  }

  // No department match -- return the first one (oldest/most established)
  return matches[0]!;
}

/**
 * Insert a new name alias row for a person.
 */
function addAlias(
  personId: number,
  rawName: string,
  normalizedKey: string,
  source: string
): void {
  // Avoid duplicate alias entries
  const existing = db
    .select({ id: nameAliases.id })
    .from(nameAliases)
    .where(
      and(
        eq(nameAliases.personId, personId),
        eq(nameAliases.rawName, rawName),
        eq(nameAliases.source, source)
      )
    )
    .get();

  if (!existing) {
    db.insert(nameAliases)
      .values({ personId, rawName, normalizedKey, source })
      .run();
  }
}

/**
 * Build a human-readable display name from parsed components.
 * Capitalizes first letter of each part.
 */
function buildDisplayName(parsed: ParsedName): string {
  const capitalize = (s: string) =>
    s
      .split(" ")
      .map((w) => (w ? w[0]!.toUpperCase() + w.slice(1) : ""))
      .join(" ");

  const parts: string[] = [];
  if (parsed.first) parts.push(capitalize(parsed.first));
  if (parsed.middle) parts.push(capitalize(parsed.middle));
  if (parsed.last) parts.push(capitalize(parsed.last));
  if (parsed.suffix) parts.push(capitalize(parsed.suffix));

  return parts.join(" ");
}
