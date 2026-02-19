import { NextResponse } from "next/server";
import {
  getCampaigns,
  getTopDonors,
  getDonationTimeline,
  getTotalDonationAmount,
  countCampaigns,
  countDonations,
} from "@/db/queries/donations";
import { errorResponse } from "@/lib/api-utils";

export async function GET() {
  try {
    const campaignsList = getCampaigns();
    const topDonors = getTopDonors({ limit: 20 });
    const timeline = getDonationTimeline();
    const totalAmount = getTotalDonationAmount();
    const totalCampaigns = countCampaigns();
    const totalDonations = countDonations();

    return NextResponse.json({
      campaigns: campaignsList,
      topDonors,
      timeline,
      totalAmount,
      totalCampaigns,
      totalDonations,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
