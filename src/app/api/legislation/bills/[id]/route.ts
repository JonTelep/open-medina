import { NextRequest, NextResponse } from "next/server";
import { getBillWithDetails } from "@/db/queries/legislation";
import { errorResponse } from "@/lib/api-utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const billId = parseInt(id, 10);
    if (isNaN(billId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const data = getBillWithDetails(billId);
    if (!data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (err) {
    return errorResponse(err);
  }
}
