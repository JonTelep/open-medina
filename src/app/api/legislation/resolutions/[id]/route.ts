import { NextRequest, NextResponse } from "next/server";
import { getResolutionById } from "@/db/queries/legislation";
import { errorResponse } from "@/lib/api-utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const resolutionId = parseInt(id, 10);
    if (isNaN(resolutionId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const resolution = getResolutionById(resolutionId);
    if (!resolution) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(resolution);
  } catch (err) {
    return errorResponse(err);
  }
}
