import {
  sqliteTable,
  text,
  integer,
  real,
  index,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

// ─── People (hub table) ─────────────────────────────────────────────

export const people = sqliteTable(
  "people",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    displayName: text("display_name").notNull(),
    type: text("type", { enum: ["person", "organization"] })
      .notNull()
      .default("person"),
    department: text("department"),
    title: text("title"),
    notes: text("notes"),
    createdAt: text("created_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    updatedAt: text("updated_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (table) => [
    index("idx_people_display_name").on(table.displayName),
    index("idx_people_type").on(table.type),
    index("idx_people_department").on(table.department),
  ]
);

// ─── Name Aliases (powers entity resolution) ────────────────────────

export const nameAliases = sqliteTable(
  "name_aliases",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    personId: integer("person_id")
      .notNull()
      .references(() => people.id, { onDelete: "cascade" }),
    rawName: text("raw_name").notNull(),
    normalizedKey: text("normalized_key").notNull(),
    source: text("source").notNull(), // e.g. "salary", "docket", "donation"
  },
  (table) => [
    index("idx_aliases_person").on(table.personId),
    index("idx_aliases_normalized").on(table.normalizedKey),
    index("idx_aliases_raw").on(table.rawName),
  ]
);

// ─── Salaries ────────────────────────────────────────────────────────

export const salaries = sqliteTable(
  "salaries",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    personId: integer("person_id").references(() => people.id),
    rawName: text("raw_name").notNull(),
    department: text("department"),
    title: text("title"),
    salary: real("salary").notNull(),
    year: integer("year").notNull(),
    source: text("source").notNull(), // URL or file path
    sourceId: text("source_id"), // external unique ID if any
    createdAt: text("created_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (table) => [
    index("idx_salaries_person").on(table.personId),
    index("idx_salaries_year").on(table.year),
    index("idx_salaries_department").on(table.department),
    uniqueIndex("idx_salaries_unique").on(
      table.rawName,
      table.year,
      table.department
    ),
  ]
);

// ─── Dockets (weekly payment batches) ────────────────────────────────

export const dockets = sqliteTable(
  "dockets",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    date: text("date").notNull(), // ISO date string
    title: text("title"),
    totalAmount: real("total_amount"),
    source: text("source").notNull(),
    createdAt: text("created_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (table) => [
    index("idx_dockets_date").on(table.date),
    uniqueIndex("idx_dockets_unique").on(table.date, table.source),
  ]
);

// ─── Docket Line Items ───────────────────────────────────────────────

export const docketLineItems = sqliteTable(
  "docket_line_items",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    docketId: integer("docket_id")
      .notNull()
      .references(() => dockets.id, { onDelete: "cascade" }),
    personId: integer("person_id").references(() => people.id), // resolved vendor
    rawVendorName: text("raw_vendor_name").notNull(),
    department: text("department"),
    description: text("description"),
    amount: real("amount").notNull(),
    checkNumber: text("check_number"),
    fund: text("fund"),
  },
  (table) => [
    index("idx_docket_items_docket").on(table.docketId),
    index("idx_docket_items_person").on(table.personId),
    index("idx_docket_items_vendor").on(table.rawVendorName),
    index("idx_docket_items_department").on(table.department),
  ]
);

// ─── Meetings ────────────────────────────────────────────────────────

export const meetings = sqliteTable(
  "meetings",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    date: text("date").notNull(),
    title: text("title"),
    body: text("body"), // full extracted text of minutes
    source: text("source").notNull(),
    createdAt: text("created_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (table) => [
    index("idx_meetings_date").on(table.date),
    uniqueIndex("idx_meetings_unique").on(table.date, table.source),
  ]
);

// ─── Meeting Mentions ────────────────────────────────────────────────

export const meetingMentions = sqliteTable(
  "meeting_mentions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    meetingId: integer("meeting_id")
      .notNull()
      .references(() => meetings.id, { onDelete: "cascade" }),
    personId: integer("person_id").references(() => people.id),
    rawName: text("raw_name").notNull(),
    context: text("context"), // surrounding text snippet
  },
  (table) => [
    index("idx_mentions_meeting").on(table.meetingId),
    index("idx_mentions_person").on(table.personId),
  ]
);

// ─── Campaigns ───────────────────────────────────────────────────────

export const campaigns = sqliteTable(
  "campaigns",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    personId: integer("person_id").references(() => people.id),
    candidateName: text("candidate_name").notNull(),
    committeeName: text("committee_name"),
    office: text("office"),
    party: text("party"),
    year: integer("year"),
    source: text("source").notNull(),
  },
  (table) => [
    index("idx_campaigns_person").on(table.personId),
    index("idx_campaigns_candidate").on(table.candidateName),
  ]
);

// ─── Donations ───────────────────────────────────────────────────────

export const donations = sqliteTable(
  "donations",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    campaignId: integer("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    donorPersonId: integer("donor_person_id").references(() => people.id),
    rawDonorName: text("raw_donor_name").notNull(),
    donorAddress: text("donor_address"),
    donorCity: text("donor_city"),
    donorState: text("donor_state"),
    donorZip: text("donor_zip"),
    donorEmployer: text("donor_employer"),
    donorOccupation: text("donor_occupation"),
    amount: real("amount").notNull(),
    date: text("date").notNull(),
    type: text("type"), // e.g. "monetary", "in-kind"
    source: text("source").notNull(),
  },
  (table) => [
    index("idx_donations_campaign").on(table.campaignId),
    index("idx_donations_donor").on(table.donorPersonId),
    index("idx_donations_date").on(table.date),
    index("idx_donations_amount").on(table.amount),
  ]
);

// ─── Financial Reports ───────────────────────────────────────────────

export const financialReports = sqliteTable(
  "financial_reports",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    title: text("title").notNull(),
    type: text("type", { enum: ["acfr", "budget", "audit", "other"] }).notNull(),
    year: integer("year"),
    body: text("body"), // extracted PDF text
    filePath: text("file_path"),
    source: text("source").notNull(),
    createdAt: text("created_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (table) => [
    index("idx_reports_year").on(table.year),
    index("idx_reports_type").on(table.type),
  ]
);

// ─── Budget Line Items ───────────────────────────────────────────────

export const budgetLineItems = sqliteTable(
  "budget_line_items",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    reportId: integer("report_id")
      .notNull()
      .references(() => financialReports.id, { onDelete: "cascade" }),
    department: text("department"),
    category: text("category"),
    fund: text("fund"),
    description: text("description"),
    budgetedAmount: real("budgeted_amount"),
    actualAmount: real("actual_amount"),
    year: integer("year"),
  },
  (table) => [
    index("idx_budget_items_report").on(table.reportId),
    index("idx_budget_items_dept").on(table.department),
    index("idx_budget_items_year").on(table.year),
  ]
);

// ─── Legislators ────────────────────────────────────────────────────

export const legislators = sqliteTable(
  "legislators",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    legiscanPeopleId: integer("legiscan_people_id"),
    personId: integer("person_id").references(() => people.id),
    name: text("name").notNull(),
    firstName: text("first_name"),
    lastName: text("last_name"),
    party: text("party"),
    chamber: text("chamber"), // "House" or "Senate"
    district: text("district"),
    imageUrl: text("image_url"),
    email: text("email"),
    bioUrl: text("bio_url"),
    source: text("source").notNull(),
    createdAt: text("created_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (table) => [
    uniqueIndex("idx_legislators_legiscan").on(table.legiscanPeopleId),
    index("idx_legislators_person").on(table.personId),
    index("idx_legislators_chamber").on(table.chamber),
  ]
);

// ─── Bills ──────────────────────────────────────────────────────────

export const bills = sqliteTable(
  "bills",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    legiscanBillId: integer("legiscan_bill_id"),
    sessionId: integer("session_id"),
    billNumber: text("bill_number"),
    title: text("title").notNull(),
    description: text("description"),
    chamber: text("chamber"), // "House" or "Senate"
    status: integer("status"), // 1-6
    statusLabel: text("status_label"),
    statusDate: text("status_date"),
    lastAction: text("last_action"),
    lastActionDate: text("last_action_date"),
    url: text("url"),
    changeHash: text("change_hash"),
    source: text("source").notNull(),
    createdAt: text("created_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    updatedAt: text("updated_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (table) => [
    uniqueIndex("idx_bills_legiscan").on(table.legiscanBillId),
    index("idx_bills_chamber").on(table.chamber),
    index("idx_bills_status").on(table.status),
    index("idx_bills_session").on(table.sessionId),
  ]
);

// ─── Bill Sponsors ──────────────────────────────────────────────────

export const billSponsors = sqliteTable(
  "bill_sponsors",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    billId: integer("bill_id")
      .notNull()
      .references(() => bills.id, { onDelete: "cascade" }),
    legislatorId: integer("legislator_id")
      .notNull()
      .references(() => legislators.id, { onDelete: "cascade" }),
    type: text("type", { enum: ["sponsor", "cosponsor"] }).notNull(),
  },
  (table) => [
    index("idx_bill_sponsors_bill").on(table.billId),
    index("idx_bill_sponsors_legislator").on(table.legislatorId),
    uniqueIndex("idx_bill_sponsors_unique").on(table.billId, table.legislatorId),
  ]
);

// ─── Roll Call Votes ────────────────────────────────────────────────

export const rollCallVotes = sqliteTable(
  "roll_call_votes",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    billId: integer("bill_id")
      .notNull()
      .references(() => bills.id, { onDelete: "cascade" }),
    legiscanRollCallId: integer("legiscan_roll_call_id"),
    date: text("date"),
    chamber: text("chamber"),
    description: text("description"),
    yea: integer("yea").default(0),
    nay: integer("nay").default(0),
    nv: integer("nv").default(0),
    absent: integer("absent").default(0),
    passed: integer("passed").default(0),
    source: text("source").notNull(),
  },
  (table) => [
    index("idx_roll_calls_bill").on(table.billId),
    uniqueIndex("idx_roll_calls_legiscan").on(table.legiscanRollCallId),
  ]
);

// ─── Legislator Votes ───────────────────────────────────────────────

export const legislatorVotes = sqliteTable(
  "legislator_votes",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    rollCallId: integer("roll_call_id")
      .notNull()
      .references(() => rollCallVotes.id, { onDelete: "cascade" }),
    legislatorId: integer("legislator_id")
      .notNull()
      .references(() => legislators.id, { onDelete: "cascade" }),
    vote: text("vote", { enum: ["yea", "nay", "nv", "absent"] }).notNull(),
  },
  (table) => [
    index("idx_legislator_votes_roll_call").on(table.rollCallId),
    index("idx_legislator_votes_legislator").on(table.legislatorId),
    uniqueIndex("idx_legislator_votes_unique").on(
      table.rollCallId,
      table.legislatorId
    ),
  ]
);

// ─── County Resolutions ─────────────────────────────────────────────

export const countyResolutions = sqliteTable(
  "county_resolutions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    resolutionNumber: text("resolution_number"),
    date: text("date"),
    title: text("title").notNull(),
    description: text("description"),
    pdfUrl: text("pdf_url"),
    body: text("body"),
    source: text("source").notNull(),
    createdAt: text("created_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (table) => [
    uniqueIndex("idx_resolutions_number").on(table.resolutionNumber),
    index("idx_resolutions_date").on(table.date),
  ]
);

// ─── Scraper Runs ────────────────────────────────────────────────────

export const scraperRuns = sqliteTable(
  "scraper_runs",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    scraperName: text("scraper_name").notNull(),
    status: text("status", {
      enum: ["running", "completed", "failed"],
    }).notNull(),
    recordsProcessed: integer("records_processed").default(0),
    recordsCreated: integer("records_created").default(0),
    recordsUpdated: integer("records_updated").default(0),
    error: text("error"),
    startedAt: text("started_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    completedAt: text("completed_at"),
  },
  (table) => [
    index("idx_scraper_runs_name").on(table.scraperName),
    index("idx_scraper_runs_status").on(table.status),
  ]
);
