import { NextRequest, NextResponse } from "next/server";
import { getDocketList } from "@/db/queries/money";
import { clampInt, errorResponse } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const limit = clampInt(searchParams.get("limit"), 50, 1, 500);
    const offset = clampInt(searchParams.get("offset"), 0, 0, 100000);
    const startDate = searchParams.get("startDate")?.slice(0, 10) || undefined;
    const endDate = searchParams.get("endDate")?.slice(0, 10) || undefined;

    const dockets = getDocketList({ limit, offset, startDate, endDate });
    return NextResponse.json(dockets);
  } catch (err) {
    return errorResponse(err);
  }
}
