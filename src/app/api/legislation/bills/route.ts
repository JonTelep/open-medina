import { NextRequest, NextResponse } from "next/server";
import { getBills, countBills } from "@/db/queries/legislation";
import { errorResponse, clampInt } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const search = sp.get("search") || undefined;
    const chamber = sp.get("chamber") || undefined;
    const statusParam = sp.get("status");
    const status =
      statusParam !== null && statusParam !== ""
        ? parseInt(statusParam, 10)
        : undefined;
    const page = clampInt(sp.get("page"), 1, 1, 1000);
    const limit = clampInt(sp.get("limit"), 20, 1, 100);
    const offset = (page - 1) * limit;

    const filterOpts = { search, chamber, status };
    const billsList = getBills({ ...filterOpts, limit, offset });
    const total = countBills(filterOpts);

    return NextResponse.json({
      bills: billsList,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    return errorResponse(err);
  }
}
