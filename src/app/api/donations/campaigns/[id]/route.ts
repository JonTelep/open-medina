import { NextRequest, NextResponse } from "next/server";
import {
  getCampaignById,
  getCampaignDonations,
  getCampaignDonorBreakdown,
} from "@/db/queries/donations";
import { errorResponse } from "@/lib/api-utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const campaignId = parseInt(id, 10);
    if (isNaN(campaignId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const campaign = getCampaignById(campaignId);
    if (!campaign) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const donationsList = getCampaignDonations(campaignId);
    const donorBreakdown = getCampaignDonorBreakdown(campaignId);

    return NextResponse.json({
      campaign,
      donations: donationsList,
      donorBreakdown,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
