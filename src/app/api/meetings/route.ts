import { NextRequest, NextResponse } from "next/server";
import { getMeetings, countMeetings } from "@/db/queries/meetings";
import { clampInt, errorResponse } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search")?.slice(0, 500) || undefined;
    const startDate = searchParams.get("startDate")?.slice(0, 10) || undefined;
    const endDate = searchParams.get("endDate")?.slice(0, 10) || undefined;
    const limit = clampInt(searchParams.get("limit"), 50, 1, 500);
    const offset = clampInt(searchParams.get("offset"), 0, 0, 100000);

    const items = getMeetings({ limit, offset, search, startDate, endDate });
    const total = countMeetings();

    return NextResponse.json({ items, total });
  } catch (err) {
    return errorResponse(err);
  }
}
