import { db } from "@/db/index";
import { meetings, meetingMentions, people } from "@/db/schema";
import { eq, like, sql, desc, and, gte, lte, or } from "drizzle-orm";

export function getMeetings(opts?: {
  limit?: number;
  offset?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
}) {
  const { limit = 50, offset = 0, search, startDate, endDate } = opts ?? {};

  const conditions = [];
  if (search) {
    conditions.push(
      or(
        like(meetings.title, `%${search}%`),
        like(meetings.body, `%${search}%`)
      )
    );
  }
  if (startDate) conditions.push(gte(meetings.date, startDate));
  if (endDate) conditions.push(lte(meetings.date, endDate));

  let query = db
    .select({
      id: meetings.id,
      date: meetings.date,
      title: meetings.title,
      bodySnippet: sql<string>`substr(${meetings.body}, 1, 200)`,
      source: meetings.source,
    })
    .from(meetings);

  if (conditions.length === 1) {
    query = query.where(conditions[0]!) as typeof query;
  } else if (conditions.length > 1) {
    query = query.where(and(...conditions)) as typeof query;
  }

  return query.orderBy(desc(meetings.date)).limit(limit).offset(offset).all();
}

export function getMeetingById(id: number) {
  return db.select().from(meetings).where(eq(meetings.id, id)).get();
}

export function getMeetingMentions(meetingId: number) {
  return db
    .select({
      id: meetingMentions.id,
      meetingId: meetingMentions.meetingId,
      personId: meetingMentions.personId,
      rawName: meetingMentions.rawName,
      context: meetingMentions.context,
      personName: people.displayName,
    })
    .from(meetingMentions)
    .leftJoin(people, eq(meetingMentions.personId, people.id))
    .where(eq(meetingMentions.meetingId, meetingId))
    .all();
}

export function countMeetings() {
  const result = db
    .select({ count: sql<number>`count(*)` })
    .from(meetings)
    .get();
  return result?.count ?? 0;
}
