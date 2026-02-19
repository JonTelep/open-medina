/**
 * Legislation scraper using LegiScan API.
 *
 * Fetches Ohio General Assembly bills and tracks how Medina County's
 * state representatives vote.
 *
 * Usage:
 *   npx tsx src/scrapers/scrape-legislation.ts
 *
 * Requires LEGISCAN_API_KEY in .env
 */

import { db } from "@/db/index";
import {
  legislators,
  bills,
  billSponsors,
  rollCallVotes,
  legislatorVotes,
} from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { startRun, completeRun, failRun } from "./lib/scraper-log";
import {
  hasApiKey,
  getMasterList,
  getBill,
  getRollCall,
  statusLabel,
  normalizeVoteText,
  normalizeChamber,
} from "@/lib/legiscan";

const SCRAPER_NAME = "legislation";

// Medina County's state representatives (LegiScan people_id values)
// These would need to be looked up via the API on first run
const MEDINA_LEGISLATORS = [
  {
    name: "Mark Romanchuk",
    firstName: "Mark",
    lastName: "Romanchuk",
    party: "Republican",
    chamber: "Senate",
    district: "22",
  },
  {
    name: "Sharon A. Ray",
    firstName: "Sharon",
    lastName: "Ray",
    party: "Republican",
    chamber: "House",
    district: "66",
  },
  {
    name: "Melanie Miller",
    firstName: "Melanie",
    lastName: "Miller",
    party: "Republican",
    chamber: "House",
    district: "67",
  },
];

/** Ensure all Medina legislators exist in the database. */
function ensureLegislators(): Map<string, number> {
  const nameToId = new Map<string, number>();

  for (const leg of MEDINA_LEGISLATORS) {
    // Check if already exists
    const existing = db
      .select({ id: legislators.id })
      .from(legislators)
      .where(eq(legislators.name, leg.name))
      .get();

    if (existing) {
      nameToId.set(leg.lastName.toLowerCase(), existing.id);
      continue;
    }

    const result = db
      .insert(legislators)
      .values({
        name: leg.name,
        firstName: leg.firstName,
        lastName: leg.lastName,
        party: leg.party,
        chamber: leg.chamber,
        district: leg.district,
        source: "legiscan",
      })
      .returning({ id: legislators.id })
      .get();

    nameToId.set(leg.lastName.toLowerCase(), result.id);
  }

  return nameToId;
}

/** Get existing bill change hashes for incremental sync. */
function getExistingHashes(): Map<number, string> {
  const rows = db
    .select({
      legiscanBillId: bills.legiscanBillId,
      changeHash: bills.changeHash,
    })
    .from(bills)
    .all();

  const map = new Map<number, string>();
  for (const row of rows) {
    if (row.legiscanBillId && row.changeHash) {
      map.set(row.legiscanBillId, row.changeHash);
    }
  }
  return map;
}

/** Find a legislator by last name match from sponsor data. */
function findLegislator(
  lastName: string,
  nameToId: Map<string, number>
): number | null {
  return nameToId.get(lastName.toLowerCase()) ?? null;
}

export async function scrapeLegislation(): Promise<void> {
  if (!hasApiKey()) {
    console.log("LEGISCAN_API_KEY not set — skipping legislation scraper.");
    console.log("Set the key in .env to enable LegiScan integration.");
    return;
  }

  const runId = await startRun(SCRAPER_NAME);
  let processed = 0;
  let created = 0;
  let updated = 0;

  try {
    const nameToId = ensureLegislators();
    console.log(`Ensured ${nameToId.size} Medina County legislators in DB.`);

    // Fetch master bill list
    console.log("Fetching master bill list from LegiScan...");
    const masterList = await getMasterList();
    const billEntries = Object.values(masterList);
    console.log(`Found ${billEntries.length} bills in current session.`);

    // Get existing hashes for change detection
    const existingHashes = getExistingHashes();

    for (const entry of billEntries) {
      processed++;

      // Check if bill has changed
      const existingHash = existingHashes.get(entry.bill_id);
      if (existingHash === entry.change_hash) {
        continue; // No changes, skip
      }

      // Fetch full bill detail
      console.log(`  Fetching bill ${entry.number} (ID: ${entry.bill_id})...`);
      const billDetail = await getBill(entry.bill_id);

      const chamber = normalizeChamber(billDetail.body);
      const statusLbl = statusLabel(billDetail.status);

      // Upsert bill
      const existingBill = db
        .select({ id: bills.id })
        .from(bills)
        .where(eq(bills.legiscanBillId, billDetail.bill_id))
        .get();

      let billId: number;
      if (existingBill) {
        db.update(bills)
          .set({
            sessionId: billDetail.session_id,
            billNumber: billDetail.bill_number,
            title: billDetail.title,
            description: billDetail.description,
            chamber,
            status: billDetail.status,
            statusLabel: statusLbl,
            statusDate: billDetail.status_date,
            lastAction:
              billDetail.history[0]?.action ?? entry.last_action,
            lastActionDate:
              billDetail.history[0]?.date ?? entry.last_action_date,
            url: billDetail.url,
            changeHash: billDetail.change_hash,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(bills.id, existingBill.id))
          .run();
        billId = existingBill.id;
        updated++;
      } else {
        const result = db
          .insert(bills)
          .values({
            legiscanBillId: billDetail.bill_id,
            sessionId: billDetail.session_id,
            billNumber: billDetail.bill_number,
            title: billDetail.title,
            description: billDetail.description,
            chamber,
            status: billDetail.status,
            statusLabel: statusLbl,
            statusDate: billDetail.status_date,
            lastAction:
              billDetail.history[0]?.action ?? entry.last_action,
            lastActionDate:
              billDetail.history[0]?.date ?? entry.last_action_date,
            url: billDetail.url,
            changeHash: billDetail.change_hash,
            source: "legiscan",
          })
          .returning({ id: bills.id })
          .get();
        billId = result.id;
        created++;
      }

      // Sync sponsors — clear and re-insert
      db.delete(billSponsors).where(eq(billSponsors.billId, billId)).run();
      for (const sponsor of billDetail.sponsors) {
        const legislatorId = findLegislator(sponsor.last_name, nameToId);
        if (legislatorId) {
          db.insert(billSponsors)
            .values({
              billId,
              legislatorId,
              type:
                sponsor.sponsor_type_id === 1 ? "sponsor" : "cosponsor",
            })
            .onConflictDoNothing()
            .run();
        }
      }

      // Sync roll call votes
      for (const vote of billDetail.votes) {
        // Upsert roll call
        const existingRc = db
          .select({ id: rollCallVotes.id })
          .from(rollCallVotes)
          .where(
            eq(rollCallVotes.legiscanRollCallId, vote.roll_call_id)
          )
          .get();

        let rollCallId: number;
        if (existingRc) {
          rollCallId = existingRc.id;
        } else {
          const rcResult = db
            .insert(rollCallVotes)
            .values({
              billId,
              legiscanRollCallId: vote.roll_call_id,
              date: vote.date,
              chamber: normalizeChamber(vote.chamber),
              description: vote.desc,
              yea: vote.yea,
              nay: vote.nay,
              nv: vote.nv,
              absent: vote.absent,
              passed: vote.passed,
              source: "legiscan",
            })
            .returning({ id: rollCallVotes.id })
            .get();
          rollCallId = rcResult.id;
        }

        // Fetch individual votes for this roll call
        console.log(
          `    Fetching roll call ${vote.roll_call_id} votes...`
        );
        const rcDetail = await getRollCall(vote.roll_call_id);

        // Only record votes from our Medina legislators
        for (const individualVote of rcDetail.votes) {
          // We'd need to match people_id to our legislators
          // For now, check all legislators by their LegiScan people_id
          const allLegislators = db.select().from(legislators).all();
          for (const leg of allLegislators) {
            if (leg.legiscanPeopleId === individualVote.people_id) {
              db.insert(legislatorVotes)
                .values({
                  rollCallId,
                  legislatorId: leg.id,
                  vote: normalizeVoteText(individualVote.vote_text),
                })
                .onConflictDoNothing()
                .run();
            }
          }
        }
      }
    }

    await completeRun(runId, { processed, created, updated });

    console.log("\n--- Legislation Scraper Summary ---");
    console.log(`  Bills processed: ${processed}`);
    console.log(`  Bills created:   ${created}`);
    console.log(`  Bills updated:   ${updated}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await failRun(runId, message);
    throw err;
  }
}

// ─── CLI Entry Point ────────────────────────────────────────────────

const isDirectRun =
  process.argv[1]?.includes("scrape-legislation") ?? false;
if (isDirectRun) {
  scrapeLegislation().catch((err) => {
    console.error("Legislation scraper failed:", err);
    process.exit(1);
  });
}
