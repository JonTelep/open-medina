import { NextRequest, NextResponse } from "next/server";
import { getResolutions, countResolutions } from "@/db/queries/legislation";
import { errorResponse, clampInt } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const search = sp.get("search") || undefined;
    const dateFrom = sp.get("dateFrom") || undefined;
    const dateTo = sp.get("dateTo") || undefined;
    const page = clampInt(sp.get("page"), 1, 1, 1000);
    const limit = clampInt(sp.get("limit"), 20, 1, 100);
    const offset = (page - 1) * limit;

    const filterOpts = { search, dateFrom, dateTo };
    const resolutionsList = getResolutions({ ...filterOpts, limit, offset });
    const total = countResolutions(filterOpts);

    return NextResponse.json({
      resolutions: resolutionsList,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    return errorResponse(err);
  }
}
