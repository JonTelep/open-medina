import { NextRequest, NextResponse } from "next/server";
import { searchAll } from "@/db/queries/search";
import { clampInt, errorResponse } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const q = (searchParams.get("q") ?? "").slice(0, 500);
    const type = searchParams.get("type") ?? undefined;
    const limit = clampInt(searchParams.get("limit"), 50, 1, 200);

    if (!q.trim()) {
      return NextResponse.json([]);
    }

    const results = searchAll(q, { limit, type });
    return NextResponse.json(results);
  } catch (err) {
    return errorResponse(err);
  }
}
