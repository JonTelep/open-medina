// Firecrawl monthly usage alert. Internal only: emails Jon once per billing period
// when 75 percent of plan credits are used. State lives in SQLite (firecrawl_alerts).
import Database from "better-sqlite3";
import { sendMail } from "../lib/mail/resend";

const DATA = process.env.DATA_DIR ?? "/app/data";
const TO = "jon@telep.io"; // same destination as the contact form
const THRESHOLD = 0.75;

export async function checkFirecrawlCredits(log: (m: string) => void) {
  const key = process.env.FIRECRAWL_API_KEY;
  if (!key) return log("credit check: no FIRECRAWL_API_KEY");
  let d: { remainingCredits?: number; planCredits?: number; billingPeriodStart?: string; billingPeriodEnd?: string } | undefined;
  try {
    const res = await fetch("https://api.firecrawl.dev/v2/team/credit-usage", {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(15000),
    });
    const body = (await res.json()) as { success?: boolean; data?: typeof d };
    if (!res.ok || !body.success) return log(`credit check: HTTP ${res.status}`);
    d = body.data;
  } catch (e) {
    return log(`credit check failed: ${(e as Error).message}`);
  }
  const plan = Number(d?.planCredits);
  const left = Number(d?.remainingCredits);
  if (!plan || !Number.isFinite(left)) return log("credit check: missing numbers");
  const used = Math.max(0, plan - left) / plan;
  const period = d?.billingPeriodStart ?? "unknown";
  log(`credit check: ${left}/${plan} left, ${Math.round(used * 100)}% used, period ${period}`);
  if (used < THRESHOLD) return;

  const db = new Database(`${DATA}/accountability.db`);
  try {
    db.exec(`CREATE TABLE IF NOT EXISTS firecrawl_alerts (period TEXT PRIMARY KEY, sent_at TEXT NOT NULL, used_pct INTEGER NOT NULL)`);
    if (db.prepare("SELECT 1 FROM firecrawl_alerts WHERE period = ?").get(period)) return;
    const pct = Math.round(used * 100);
    const renews = d?.billingPeriodEnd ? new Date(d.billingPeriodEnd).toLocaleDateString("en-US", { timeZone: "America/New_York", month: "long", day: "numeric", year: "numeric" }) : "the next billing date";
    await sendMail({
      to: TO,
      subject: `OpenMedina: Firecrawl credits ${pct}% used`,
      text:
        `Ask Medina has used ${pct}% of this billing period's Firecrawl credits.\n\n` +
        `Remaining: ${left} of ${plan}\nPeriod: ${period.slice(0, 10)} to ${(d?.billingPeriodEnd ?? "").slice(0, 10)}\nRenews: ${renews}\n` +
        `Daily cap (FIRECRAWL_DAILY_CAP): ${process.env.FIRECRAWL_DAILY_CAP || "80"}\n\n` +
        `When credits run out, Ask Medina keeps answering from OpenMedina's own data and official links.\n` +
        `Usage: https://www.firecrawl.dev/app/usage\n\nThis is an internal alert. It is sent once per billing period.\n`,
    });
    db.prepare("INSERT INTO firecrawl_alerts (period, sent_at, used_pct) VALUES (?, ?, ?)").run(period, new Date().toISOString(), pct);
    log(`credit alert sent for period ${period}`);
  } catch (e) {
    log(`credit alert failed: ${(e as Error).message}`);
  } finally {
    db.close();
  }
}
