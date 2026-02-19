import { NextRequest, NextResponse } from "next/server";
import { getDocketById, getDocketItems } from "@/db/queries/money";
import { errorResponse } from "@/lib/api-utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const docketId = parseInt(id, 10);
    if (isNaN(docketId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const docket = getDocketById(docketId);
    if (!docket) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const items = getDocketItems(docketId);
    return NextResponse.json({ docket, items });
  } catch (err) {
    return errorResponse(err);
  }
}
