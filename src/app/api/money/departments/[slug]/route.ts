import { NextRequest, NextResponse } from "next/server";
import { getDepartmentSpending, getDepartmentEmployees } from "@/db/queries/money";
import { errorResponse } from "@/lib/api-utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const department = decodeURIComponent(slug).slice(0, 500);

    const spending = getDepartmentSpending(department);
    const employees = getDepartmentEmployees(department);

    return NextResponse.json({ department, spending, employees });
  } catch (err) {
    return errorResponse(err);
  }
}
