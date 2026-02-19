import { NextRequest, NextResponse } from "next/server";
import {
  getLegislatorById,
  getLegislatorVotingStats,
  getLegislatorVotingRecord,
  getLegislatorSponsoredBills,
} from "@/db/queries/legislation";
import { errorResponse } from "@/lib/api-utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const legislatorId = parseInt(id, 10);
    if (isNaN(legislatorId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const legislator = getLegislatorById(legislatorId);
    if (!legislator) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const votingStats = getLegislatorVotingStats(legislatorId);
    const recentVotes = getLegislatorVotingRecord(legislatorId, { limit: 50 });
    const sponsoredBills = getLegislatorSponsoredBills(legislatorId);

    return NextResponse.json({
      legislator,
      votingStats,
      recentVotes,
      sponsoredBills,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
