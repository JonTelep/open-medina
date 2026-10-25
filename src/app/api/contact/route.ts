import { NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/ask/rate-limit";
import { isEmailShape } from "@/lib/mail/validate";
import { sendMail } from "@/lib/mail/resend";

export const dynamic = "force-dynamic";
const sent = new Map<string, number[]>();

export async function POST(req: Request) {
  const ip = clientIp(req.headers);
  const now = Date.now();
  const recent = (sent.get(ip) ?? []).filter((t) => now - t < 3_600_000);
  if (!rateLimit(ip).ok || recent.length >= 5)
    return NextResponse.json({ error: "Too many messages. Please try again later." }, { status: 429 });

  const b = (await req.json().catch(() => ({}))) as Record<string, string>;
  if (b.website) return NextResponse.json({ ok: true }); // honeypot
  const name = String(b.name ?? "").trim().slice(0, 120);
  const email = String(b.email ?? "").trim().slice(0, 254);
  const item = String(b.item ?? "").trim().slice(0, 300);
  const message = String(b.message ?? "").trim().slice(0, 5000);
  if (!name || !isEmailShape(email) || message.length < 5)
    return NextResponse.json({ error: "Please add your name, a valid email, and a message." }, { status: 400 });

  try {
    await sendMail({
      to: "jon@telep.io",
      replyTo: email,
      subject: `OpenMedina report: ${item || "general"}`.slice(0, 150),
      text: `From: ${name} <${email}>\nPage or item: ${item || "(not given)"}\n\n${message}\n`,
    });
  } catch {
    return NextResponse.json({ error: "Sorry, your message could not be sent. Please try again later." }, { status: 502 });
  }
  recent.push(now);
  sent.set(ip, recent);
  return NextResponse.json({ ok: true });
}
