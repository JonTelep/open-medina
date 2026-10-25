import { NextResponse } from "next/server";
import { unsubscribe } from "@/lib/newsletter";

export const dynamic = "force-dynamic";

// GET from the email link shows a confirmation page; POST is RFC 8058 one-click.
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token") ?? "";
  const ok = !!unsubscribe(token);
  return NextResponse.redirect(new URL(`/unsubscribe?status=${ok ? "done" : "unknown"}`, "https://openmedina.org"), 303);
}

export async function POST(req: Request) {
  const token = new URL(req.url).searchParams.get("token") ?? "";
  const ok = !!unsubscribe(token);
  return NextResponse.json({ ok }, { status: ok ? 200 : 404 });
}
