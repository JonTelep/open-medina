import { NextResponse } from "next/server";
import { getDashboardStats } from "@/db/queries/stats";
import { errorResponse } from "@/lib/api-utils";

export async function GET() {
  try {
    const stats = getDashboardStats();
    return NextResponse.json(stats);
  } catch (err) {
    return errorResponse(err);
  }
}
