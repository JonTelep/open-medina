import { promises as dns } from "node:dns";

// Common disposable email domains. Not exhaustive.
const DISPOSABLE = new Set(
  "mailinator.com guerrillamail.com guerrillamail.net 10minutemail.com tempmail.com temp-mail.org yopmail.com trashmail.com getnada.com sharklasers.com dispostable.com maildrop.cc throwawaymail.com fakeinbox.com mintemail.com mohmal.com emailondeck.com tempmailo.com tempr.email discard.email spamgourmet.com mailnesia.com mytemp.email burnermail.io moakt.com tmail.ws 33mail.com inboxkitten.com mailpoof.com"
    .split(" "),
);

export function isEmailShape(e: string) {
  return /^[^\s@]{1,64}@[^\s@]+\.[a-z]{2,}$/i.test(e) && e.length <= 254;
}

export async function checkEmail(email: string): Promise<string | null> {
  if (!isEmailShape(email)) return "Please enter a valid email address.";
  const domain = email.split("@")[1]!.toLowerCase();
  if (DISPOSABLE.has(domain)) return "Please use a permanent email address.";
  try {
    const mx = await dns.resolveMx(domain);
    if (!mx.length) return "That email domain cannot receive mail.";
  } catch {
    return "That email domain cannot receive mail.";
  }
  return null;
}
