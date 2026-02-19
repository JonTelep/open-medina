import { db } from "@/db/index";
import { people, nameAliases, salaries, docketLineItems, donations, meetingMentions, campaigns, meetings } from "@/db/schema";
import { eq, like, sql, desc, asc } from "drizzle-orm";

export function getPeople(opts?: { limit?: number; offset?: number; search?: string; department?: string }) {
  const { limit = 50, offset = 0, search, department } = opts ?? {};

  let query = db
    .select({
      id: people.id,
      displayName: people.displayName,
      type: people.type,
      department: people.department,
      title: people.title,
    })
    .from(people);

  const conditions: ReturnType<typeof eq>[] = [];
  if (search) {
    conditions.push(like(people.displayName, `%${search}%`));
  }
  if (department) {
    conditions.push(eq(people.department, department));
  }

  if (conditions.length === 1) {
    query = query.where(conditions[0]!) as typeof query;
  } else if (conditions.length > 1) {
    query = query.where(sql`${conditions.map((c, i) => i === 0 ? c : sql` AND ${c}`)}`) as typeof query;
  }

  return query.orderBy(asc(people.displayName)).limit(limit).offset(offset).all();
}

export function getPersonById(id: number) {
  return db.select().from(people).where(eq(people.id, id)).get();
}

export function getPersonAliases(personId: number) {
  return db
    .select()
    .from(nameAliases)
    .where(eq(nameAliases.personId, personId))
    .all();
}

export function getPersonSalaries(personId: number) {
  return db
    .select()
    .from(salaries)
    .where(eq(salaries.personId, personId))
    .orderBy(desc(salaries.year))
    .all();
}

export function getPersonPayments(personId: number) {
  return db
    .select({
      id: docketLineItems.id,
      vendorName: docketLineItems.rawVendorName,
      department: docketLineItems.department,
      description: docketLineItems.description,
      amount: docketLineItems.amount,
      checkNumber: docketLineItems.checkNumber,
      fund: docketLineItems.fund,
    })
    .from(docketLineItems)
    .where(eq(docketLineItems.personId, personId))
    .orderBy(desc(docketLineItems.amount))
    .all();
}

export function getPersonDonations(personId: number) {
  return db
    .select({
      id: donations.id,
      donorName: donations.rawDonorName,
      amount: donations.amount,
      date: donations.date,
      type: donations.type,
      campaignId: donations.campaignId,
      candidateName: campaigns.candidateName,
    })
    .from(donations)
    .leftJoin(campaigns, eq(donations.campaignId, campaigns.id))
    .where(eq(donations.donorPersonId, personId))
    .orderBy(desc(donations.date))
    .all();
}

export function getPersonCampaigns(personId: number) {
  return db
    .select()
    .from(campaigns)
    .where(eq(campaigns.personId, personId))
    .all();
}

export function getPersonMentions(personId: number) {
  return db
    .select({
      id: meetingMentions.id,
      meetingId: meetingMentions.meetingId,
      rawName: meetingMentions.rawName,
      context: meetingMentions.context,
      meetingDate: meetings.date,
      meetingTitle: meetings.title,
    })
    .from(meetingMentions)
    .leftJoin(meetings, eq(meetingMentions.meetingId, meetings.id))
    .where(eq(meetingMentions.personId, personId))
    .orderBy(desc(meetings.date))
    .all();
}

export function countPeople(opts?: { search?: string; department?: string }) {
  const { search, department } = opts ?? {};

  const conditions: ReturnType<typeof eq>[] = [];
  if (search) {
    conditions.push(like(people.displayName, `%${search}%`));
  }
  if (department) {
    conditions.push(eq(people.department, department));
  }

  let query = db.select({ count: sql<number>`count(*)` }).from(people);

  if (conditions.length === 1) {
    query = query.where(conditions[0]!) as typeof query;
  } else if (conditions.length > 1) {
    query = query.where(sql`${conditions.map((c, i) => i === 0 ? c : sql` AND ${c}`)}`) as typeof query;
  }

  return query.get()?.count ?? 0;
}

export function getDepartments() {
  return db
    .selectDistinct({ department: people.department })
    .from(people)
    .where(sql`${people.department} IS NOT NULL`)
    .orderBy(asc(people.department))
    .all()
    .map((r) => r.department!)
    .filter(Boolean);
}
