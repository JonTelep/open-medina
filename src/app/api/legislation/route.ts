import { NextResponse } from "next/server";
import {
  getLegislationDashboardStats,
  getLegislators,
  getRecentBills,
  getRecentResolutions,
  getBillStatusBreakdown,
  getLegislatorVotingStats,
} from "@/db/queries/legislation";
import { errorResponse } from "@/lib/api-utils";

export async function GET() {
  try {
    const stats = getLegislationDashboardStats();
    const legislatorsList = getLegislators();
    const recentBills = getRecentBills(10);
    const recentResolutions = getRecentResolutions(10);
    const statusBreakdown = getBillStatusBreakdown();

    // Attach voting stats to each legislator
    const legislatorsWithStats = legislatorsList.map((leg) => ({
      ...leg,
      votingStats: getLegislatorVotingStats(leg.id),
    }));

    return NextResponse.json({
      stats,
      legislators: legislatorsWithStats,
      recentBills,
      recentResolutions,
      statusBreakdown,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
