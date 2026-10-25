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
import { sqlite } from "@/db";
import {
  getCurrentSession,
  getSessionPeople,
  getSponsoredBillIds,
  searchSessionBillIds,
  type LegiScanSessionPerson,
  hasApiKey,
  getMasterList,
  getBill,
  getRollCall,
  statusLabel,
  normalizeVoteText,
  normalizeChamber,
} from "@/lib/legiscan";

const SCRAPER_NAME = "legislation";

// Districts that include Medina County. Verified with the U.S. Census Geocoder for the
// Medina, Brunswick and Wadsworth city halls (2024 districts), and member pages at
// ohiohouse.gov and ohiosenate.gov.
const AREA_DISTRICTS: Record<string, { chamber: string; district: string; official: string }> = {
  "HD-066": { chamber: "House", district: "66", official: "https://ohiohouse.gov/members/sean-hutson" },
  "HD-067": { chamber: "House", district: "67", official: "https://ohiohouse.gov/members/melanie-miller" },
  "SD-022": { chamber: "Senate", district: "22", official: "https://ohiosenate.gov/members/mark-romanchuk" },
};

sqlite.exec(`CREATE TABLE IF NOT EXISTS legislation_focus (
  bill_id INTEGER NOT NULL,
  reason TEXT NOT NULL,
  PRIMARY KEY (bill_id, reason)
)`);

/** Ensure the area legislators from LegiScan session people exist, keyed by people_id. */
function ensureLegislators(people: LegiScanSessionPerson[]): Map<number, number> {
  const map = new Map<number, number>();
  for (const p of people) {
    const d = AREA_DISTRICTS[p.district]!;
    const party = p.party === "R" ? "Republican" : p.party === "D" ? "Democratic" : p.party;
    const existing = db
      .select({ id: legislators.id })
      .from(legislators)
      .where(eq(legislators.legiscanPeopleId, p.people_id))
      .get() ?? db.select({ id: legislators.id }).from(legislators).where(eq(legislators.name, p.name)).get();
    const values = {
      legiscanPeopleId: p.people_id,
      name: p.name,
      firstName: p.first_name,
      lastName: p.last_name,
      party,
      chamber: d.chamber,
      district: d.district,
      bioUrl: d.official,
      source: "legiscan",
    };
    if (existing) {
      db.update(legislators).set(values).where(eq(legislators.id, existing.id)).run();
      map.set(p.people_id, existing.id);
    } else {
      map.set(p.people_id, db.insert(legislators).values(values).returning({ id: legislators.id }).get().id);
    }
  }
  return map;
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

export async function scrapeLegislation(): Promise<void> {
  if (!hasApiKey()) {
    console.log("LEGISCAN_API_KEY not set, skipping legislation scraper.");
    console.log("Set the key in .env to enable LegiScan integration.");
    return;
  }

  const runId = await startRun(SCRAPER_NAME);
  let processed = 0;
  let created = 0;
  let updated = 0;

  try {
    const session = await getCurrentSession();
    console.log(`Session: ${session.session_name} (${session.session_id})`);
    const people = (await getSessionPeople(session.session_id)).filter((p) => AREA_DISTRICTS[p.district]);
    const peopleToId = ensureLegislators(people);
    console.log(`Area legislators: ${people.map((p) => `${p.name} ${p.district}`).join(", ")}`);

    // Priority set: bills sponsored by area legislators, plus bills that mention Medina County.
    const reasons = new Map<number, Set<string>>();
    const add = (id: number, r: string) => (reasons.get(id) ?? reasons.set(id, new Set()).get(id)!).add(r);
    for (const p of people) for (const id of await getSponsoredBillIds(p.people_id, session.session_id)) add(id, `sponsor:${p.people_id}`);
    for (const id of await searchSessionBillIds('"Medina County"')) add(id, "mentions-medina");

    const masterList = await getMasterList(session.session_id);
    const billEntries = Object.values(masterList).filter((b) => reasons.has(b.bill_id));
    console.log(`Priority bills: ${billEntries.length} of ${Object.keys(masterList).length} in session.`);

    // Get existing hashes for change detection
    const existingHashes = getExistingHashes();

    for (const entry of billEntries) {
      processed++;

      // Check if bill has changed
      const existingHash = existingHashes.get(entry.bill_id);
      if (existingHash === entry.change_hash) {
        const row = db.select({ id: bills.id }).from(bills).where(eq(bills.legiscanBillId, entry.bill_id)).get();
        if (row) for (const r of reasons.get(entry.bill_id)!) sqlite.prepare("INSERT OR IGNORE INTO legislation_focus VALUES (?, ?)").run(row.id, r);
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

      sqlite.prepare("DELETE FROM legislation_focus WHERE bill_id = ?").run(billId);
      for (const r of reasons.get(entry.bill_id)!) sqlite.prepare("INSERT OR IGNORE INTO legislation_focus VALUES (?, ?)").run(billId, r);

      // Sync sponsors: clear and re-insert
      db.delete(billSponsors).where(eq(billSponsors.billId, billId)).run();
      for (const sponsor of billDetail.sponsors) {
        const legislatorId = peopleToId.get((sponsor as { people_id: number }).people_id) ?? null;
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
        if (existingRc) continue; // individual votes already stored
        const rcDetail = await getRollCall(vote.roll_call_id);

        // Only record votes from our Medina legislators
        for (const individualVote of rcDetail.votes) {
          // We'd need to match people_id to our legislators
          // For now, check all legislators by their LegiScan people_id
          const allLegislators = db.select().from(legislators).all().filter((l) => l.legiscanPeopleId);
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
