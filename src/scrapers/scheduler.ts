// In-container scheduler for official-source refreshes.
// Daily full refresh at 04:00 America/New_York. Election check every 6 hours until Nov 3, 2026 ends.
import { spawn } from "node:child_process";
import { appendFileSync, mkdirSync } from "node:fs";
import Database from "better-sqlite3";
import { checkFirecrawlCredits } from "./credit-alert";

const DATA = process.env.DATA_DIR ?? "/app/data";
const LOG = `${DATA}/logs/scrape.log`;
const ELECTION_END = Date.parse("2026-11-04T05:00:00Z"); // midnight ET after Nov 3
mkdirSync(`${DATA}/logs`, { recursive: true });

function log(msg: string) {
  appendFileSync(LOG, `${new Date().toISOString()} ${msg}\n`);
}

function etParts(d = new Date()) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
      .formatToParts(d)
      .map((x) => [x.type, x.value]),
  );
  return { day: `${p.year}-${p.month}-${p.day}`, hour: Number(p.hour), minute: Number(p.minute) };
}

let running = false;
function run(groups: string[], then?: () => void) {
  if (running) return log(`skip ${groups.join(",")}: previous run still going`);
  running = true;
  log(`start ${groups.join(",")}`);
  const script = groups[0] === "legislation" ? "src/scrapers/scrape-legislation.ts" : "src/scrapers/scrape-local.ts";
  const args = groups[0] === "legislation" ? [] : groups;
  const child = spawn("npx", ["tsx", script, ...args], { cwd: "/app", env: process.env });
  const out = (b: Buffer) => b.toString().split("\n").filter(Boolean).forEach((l) => log(`  ${l}`));
  child.stdout.on("data", out);
  child.stderr.on("data", out);
  child.on("exit", (code) => {
    running = false;
    log(`end ${groups.join(",")} exit=${code}${code ? " FAILED" : ""}`);
    then?.();
  });
}

let lastDaily = "";
let lastElection = 0;

function tick() {
  const now = Date.now();
  const et = etParts();
  if (et.hour === 4 && lastDaily !== et.day) {
    lastDaily = et.day;
    lastElection = now;
    return run(["census", "councils", "agendas", "elections", "directory"], () => run(["legislation"]));
  }
  if (now < ELECTION_END && now - lastElection >= 6 * 3600_000) {
    lastElection = now;
    run(["elections"]);
  }
}

function count(sql: string) {
  try {
    const db = new Database(`${DATA}/accountability.db`, { readonly: true });
    const r = db.prepare(sql).get() as { c: number };
    db.close();
    return r.c;
  } catch {
    return 0;
  }
}

function isEmpty() {
  try {
    const db = new Database(`${DATA}/accountability.db`, { readonly: true });
    const r = db.prepare("SELECT count(*) c FROM local_sources WHERE last_success IS NOT NULL").get() as { c: number };
    db.close();
    return r.c === 0;
  } catch {
    return true;
  }
}

log("scheduler started");
const needAcs = count("SELECT count(*) c FROM local_acs") === 0;
const needBills = count("SELECT count(*) c FROM bills") === 0;
let needDir = false;
try { needDir = count("SELECT count(*) c FROM local_jurisdictions") === 0; } catch { needDir = true; }
if (isEmpty() || needAcs || needBills || needDir) {
  lastElection = Date.now();
  run(["census", "councils", "agendas", "elections", "directory"], needBills ? () => run(["legislation"]) : undefined);
} else {
  lastElection = Date.now() - 6 * 3600_000 + 60_000; // first election check about a minute after start
}
setInterval(tick, 60_000);

// Firecrawl credit usage alert: shortly after start, then every 6 hours.
const creditCheck = () => checkFirecrawlCredits(log).catch((e) => log(`credit check error: ${e}`));
setTimeout(creditCheck, 2 * 60_000);
setInterval(creditCheck, 6 * 3600_000);
