import { NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/ask/rate-limit";
import { checkEmail } from "@/lib/mail/validate";
import { subscribe } from "@/lib/newsletter";
import { recordSignup } from "@/lib/analytics";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!rateLimit(clientIp(req.headers)).ok)
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  const b = (await req.json().catch(() => ({}))) as Record<string, string>;
  if (b.website) return NextResponse.json({ ok: true }); // honeypot
  const email = String(b.email ?? "").trim().toLowerCase();
  const problem = await checkEmail(email);
  if (problem) return NextResponse.json({ error: problem }, { status: 400 });
  subscribe(email);
  try {
    recordSignup(b);
  } catch {}
  return NextResponse.json({ ok: true });
}
