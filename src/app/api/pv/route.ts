import { NextResponse } from "next/server";
import { recordView } from "@/lib/analytics";

export const dynamic = "force-dynamic";

// Internal only: called by src/proxy.ts over loopback with a shared key.
export async function POST(req: Request) {
  const key = process.env.STATS_PASSWORD;
  if (!key || req.headers.get("x-pv-key") !== key) return new NextResponse(null, { status: 404 });
  const b = (await req.json().catch(() => null)) as Record<string, string> | null;
  if (b?.path) {
    try {
      recordView(b as { path: string });
    } catch {}
  }
  return new NextResponse(null, { status: 204 });
}
