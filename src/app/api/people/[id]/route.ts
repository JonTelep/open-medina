import { NextRequest, NextResponse } from "next/server";
import {
  getPersonById,
  getPersonAliases,
  getPersonSalaries,
  getPersonPayments,
  getPersonDonations,
  getPersonCampaigns,
  getPersonMentions,
} from "@/db/queries/people";
import { errorResponse } from "@/lib/api-utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const personId = parseInt(id, 10);
    if (isNaN(personId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const person = getPersonById(personId);
    if (!person) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const aliases = getPersonAliases(personId);
    const salaries = getPersonSalaries(personId);
    const payments = getPersonPayments(personId);
    const donations = getPersonDonations(personId);
    const campaigns = getPersonCampaigns(personId);
    const mentions = getPersonMentions(personId);

    return NextResponse.json({
      person,
      aliases,
      salaries,
      payments,
      donations,
      campaigns,
      mentions,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
