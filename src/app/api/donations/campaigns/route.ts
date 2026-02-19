import { NextResponse } from "next/server";
import { getCampaigns } from "@/db/queries/donations";
import { errorResponse } from "@/lib/api-utils";

export async function GET() {
  try {
    const campaignsList = getCampaigns();
    return NextResponse.json(campaignsList);
  } catch (err) {
    return errorResponse(err);
  }
}
