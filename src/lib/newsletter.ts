import { randomBytes } from "node:crypto";
import { sqlite } from "@/db";

sqlite.exec(`CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  email TEXT PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  unsubscribed_at TEXT,
  source TEXT
)`);

export function subscribe(email: string, source = "site") {
  const e = email.trim().toLowerCase();
  const existing = sqlite.prepare("SELECT token FROM newsletter_subscribers WHERE email = ?").get(e) as
    | { token: string }
    | undefined;
  if (existing) {
    sqlite.prepare("UPDATE newsletter_subscribers SET unsubscribed_at = NULL WHERE email = ?").run(e);
    return existing.token;
  }
  const token = randomBytes(24).toString("base64url");
  sqlite
    .prepare("INSERT INTO newsletter_subscribers (email, token, created_at, source) VALUES (?, ?, ?, ?)")
    .run(e, token, new Date().toISOString(), source);
  return token;
}

export function unsubscribe(token: string): string | null {
  const r = sqlite.prepare("SELECT email FROM newsletter_subscribers WHERE token = ?").get(token) as
    | { email: string }
    | undefined;
  if (!r) return null;
  sqlite
    .prepare("UPDATE newsletter_subscribers SET unsubscribed_at = coalesce(unsubscribed_at, ?) WHERE token = ?")
    .run(new Date().toISOString(), token);
  return r.email;
}

export function unsubscribeUrl(token: string) {
  return `https://openmedina.org/api/unsubscribe?token=${encodeURIComponent(token)}`;
}
