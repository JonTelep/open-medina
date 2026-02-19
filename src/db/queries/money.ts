import { db } from "@/db/index";
import { dockets, docketLineItems, salaries, people } from "@/db/schema";
import { eq, sql, desc, asc, like, and, gte, lte } from "drizzle-orm";

export function getSpendingByDepartment(opts?: { year?: number }) {
  const conditions = [];
  if (opts?.year) {
    // Filter dockets by year from the date field
    conditions.push(
      sql`substr(${dockets.date}, 1, 4) = ${String(opts.year)}`
    );
  }

  const query = db
    .select({
      department: docketLineItems.department,
      totalAmount: sql<number>`sum(${docketLineItems.amount})`,
      itemCount: sql<number>`count(*)`,
    })
    .from(docketLineItems)
    .innerJoin(dockets, eq(docketLineItems.docketId, dockets.id));

  if (conditions.length > 0) {
    return query
      .where(conditions[0]!)
      .groupBy(docketLineItems.department)
      .orderBy(desc(sql`sum(${docketLineItems.amount})`))
      .all();
  }

  return query
    .groupBy(docketLineItems.department)
    .orderBy(desc(sql`sum(${docketLineItems.amount})`))
    .all();
}

export function getTopVendors(opts?: { limit?: number; year?: number }) {
  const { limit = 20, year } = opts ?? {};

  const baseQuery = db
    .select({
      vendorName: docketLineItems.rawVendorName,
      personId: docketLineItems.personId,
      totalAmount: sql<number>`sum(${docketLineItems.amount})`,
      paymentCount: sql<number>`count(*)`,
    })
    .from(docketLineItems);

  if (year) {
    return baseQuery
      .innerJoin(dockets, eq(docketLineItems.docketId, dockets.id))
      .where(sql`substr(${dockets.date}, 1, 4) = ${String(year)}`)
      .groupBy(docketLineItems.rawVendorName)
      .orderBy(desc(sql`sum(${docketLineItems.amount})`))
      .limit(limit)
      .all();
  }

  return baseQuery
    .groupBy(docketLineItems.rawVendorName)
    .orderBy(desc(sql`sum(${docketLineItems.amount})`))
    .limit(limit)
    .all();
}

export function getSpendingTimeline() {
  return db
    .select({
      month: sql<string>`substr(${dockets.date}, 1, 7)`,
      totalAmount: sql<number>`sum(${docketLineItems.amount})`,
      itemCount: sql<number>`count(*)`,
    })
    .from(docketLineItems)
    .innerJoin(dockets, eq(docketLineItems.docketId, dockets.id))
    .groupBy(sql`substr(${dockets.date}, 1, 7)`)
    .orderBy(asc(sql`substr(${dockets.date}, 1, 7)`))
    .all();
}

export function getDocketList(opts?: {
  limit?: number;
  offset?: number;
  startDate?: string;
  endDate?: string;
}) {
  const { limit = 50, offset = 0, startDate, endDate } = opts ?? {};

  const conditions = [];
  if (startDate) conditions.push(gte(dockets.date, startDate));
  if (endDate) conditions.push(lte(dockets.date, endDate));

  let query = db.select().from(dockets);

  if (conditions.length === 1) {
    query = query.where(conditions[0]!) as typeof query;
  } else if (conditions.length === 2) {
    query = query.where(and(conditions[0]!, conditions[1]!)) as typeof query;
  }

  return query.orderBy(desc(dockets.date)).limit(limit).offset(offset).all();
}

export function getDocketById(id: number) {
  return db.select().from(dockets).where(eq(dockets.id, id)).get();
}

export function getDocketItems(docketId: number) {
  return db
    .select()
    .from(docketLineItems)
    .where(eq(docketLineItems.docketId, docketId))
    .orderBy(desc(docketLineItems.amount))
    .all();
}

export function getVendorPayments(vendorName: string) {
  return db
    .select({
      id: docketLineItems.id,
      amount: docketLineItems.amount,
      department: docketLineItems.department,
      description: docketLineItems.description,
      checkNumber: docketLineItems.checkNumber,
      fund: docketLineItems.fund,
      docketDate: dockets.date,
    })
    .from(docketLineItems)
    .innerJoin(dockets, eq(docketLineItems.docketId, dockets.id))
    .where(eq(docketLineItems.rawVendorName, vendorName))
    .orderBy(desc(dockets.date))
    .all();
}

export function getDepartmentSpending(department: string) {
  return db
    .select({
      vendorName: docketLineItems.rawVendorName,
      totalAmount: sql<number>`sum(${docketLineItems.amount})`,
      paymentCount: sql<number>`count(*)`,
    })
    .from(docketLineItems)
    .where(eq(docketLineItems.department, department))
    .groupBy(docketLineItems.rawVendorName)
    .orderBy(desc(sql`sum(${docketLineItems.amount})`))
    .all();
}

export function getDepartmentEmployees(department: string) {
  return db
    .select()
    .from(salaries)
    .where(eq(salaries.department, department))
    .orderBy(desc(salaries.year), desc(salaries.salary))
    .all();
}

export function getTotalSpending() {
  const result = db
    .select({ total: sql<number>`sum(${docketLineItems.amount})` })
    .from(docketLineItems)
    .get();
  return result?.total ?? 0;
}

export function getTotalSalarySpending() {
  // Only sum the most recent salary year per person to avoid double-counting
  const result = db
    .select({ total: sql<number>`sum(salary)` })
    .from(
      db
        .select({
          salary: salaries.salary,
          rn: sql<number>`row_number() over (partition by ${salaries.personId} order by ${salaries.year} desc)`.as("rn"),
        })
        .from(salaries)
        .where(sql`${salaries.personId} IS NOT NULL`)
        .as("latest")
    )
    .where(sql`rn = 1`)
    .get();
  return result?.total ?? 0;
}

export function getSpendingDepartments() {
  return db
    .selectDistinct({ department: docketLineItems.department })
    .from(docketLineItems)
    .where(sql`${docketLineItems.department} IS NOT NULL`)
    .orderBy(asc(docketLineItems.department))
    .all()
    .map((r) => r.department!)
    .filter(Boolean);
}
