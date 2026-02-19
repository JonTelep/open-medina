import { NextRequest, NextResponse } from "next/server";
import {
  getSpendingByDepartment,
  getTopVendors,
  getSpendingTimeline,
  getTotalSpending,
  getSpendingDepartments,
} from "@/db/queries/money";
import { errorResponse } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const yearStr = searchParams.get("year");
    const year = yearStr ? parseInt(yearStr, 10) : undefined;
    if (year !== undefined && (isNaN(year) || year < 2000 || year > 2100)) {
      return NextResponse.json({ error: "Invalid year" }, { status: 400 });
    }

    const byDepartment = getSpendingByDepartment({ year });
    const topVendors = getTopVendors({ limit: 20, year });
    const timeline = getSpendingTimeline();
    const totalSpending = getTotalSpending();
    const departments = getSpendingDepartments();

    return NextResponse.json({
      byDepartment,
      topVendors,
      timeline,
      totalSpending,
      departments,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
