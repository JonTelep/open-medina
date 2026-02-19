import { NextRequest, NextResponse } from "next/server";
import { getPeople, countPeople, getDepartments } from "@/db/queries/people";
import { clampInt, errorResponse } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search")?.slice(0, 500) || undefined;
    const department = searchParams.get("department")?.slice(0, 200) || undefined;
    const limit = clampInt(searchParams.get("limit"), 50, 1, 500);
    const offset = clampInt(searchParams.get("offset"), 0, 0, 100000);

    const people = getPeople({ limit, offset, search, department });
    const total = countPeople({ search, department });
    const departments = getDepartments();

    return NextResponse.json({ people, total, departments });
  } catch (err) {
    return errorResponse(err);
  }
}
