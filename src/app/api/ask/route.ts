import { NextRequest, NextResponse } from "next/server";
import { askMedina, UpstreamError } from "@/lib/ask/search";
import { clientIp, rateLimit } from "@/lib/ask/rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  if (q.length < 3) {
    return NextResponse.json({ error: "Please enter a question of at least 3 characters." }, { status: 400 });
  }
  if (q.length > 200) {
    return NextResponse.json({ error: "Please keep questions under 200 characters." }, { status: 400 });
  }

  const rl = rateLimit(clientIp(req.headers));
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many questions. Please wait a minute and try again." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  try {
    const data = await askMedina(q);
    return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    if (err instanceof UpstreamError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("Ask Medina error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
