import { NextRequest, NextResponse } from "next/server";
import { getVendorPayments } from "@/db/queries/money";
import { errorResponse } from "@/lib/api-utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;
    const vendorName = decodeURIComponent(name).slice(0, 500);
    const payments = getVendorPayments(vendorName);

    const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);

    return NextResponse.json({ vendorName, payments, totalAmount });
  } catch (err) {
    return errorResponse(err);
  }
}
