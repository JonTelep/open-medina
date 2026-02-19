import { NextRequest, NextResponse } from "next/server";
import { getMeetingById, getMeetingMentions } from "@/db/queries/meetings";
import { errorResponse } from "@/lib/api-utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const meetingId = parseInt(id, 10);
    if (isNaN(meetingId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const meeting = getMeetingById(meetingId);
    if (!meeting) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const mentions = getMeetingMentions(meetingId);
    return NextResponse.json({ meeting, mentions });
  } catch (err) {
    return errorResponse(err);
  }
}
