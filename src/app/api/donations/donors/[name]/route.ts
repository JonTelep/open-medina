import { NextRequest, NextResponse } from "next/server";
import { getDonorSummary } from "@/db/queries/donations";
import { errorResponse } from "@/lib/api-utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;
    const donorName = decodeURIComponent(name).slice(0, 500);

    const donationsList = getDonorSummary(donorName);

    if (donationsList.length === 0) {
      return NextResponse.json({ error: "No donations found for this donor" }, { status: 404 });
    }

    const totalAmount = donationsList.reduce((sum, d) => sum + d.amount, 0);

    return NextResponse.json({
      donorName,
      donations: donationsList,
      totalAmount,
      donationCount: donationsList.length,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
