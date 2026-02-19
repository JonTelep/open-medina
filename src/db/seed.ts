import { db } from "./index";
import {
  people,
  nameAliases,
  salaries,
  dockets,
  docketLineItems,
  meetings,
  meetingMentions,
  campaigns,
  donations,
  legislators,
  bills,
  billSponsors,
  rollCallVotes,
  legislatorVotes,
  countyResolutions,
} from "./schema";

// Seed with realistic Medina County sample data for development

const DEPARTMENTS = [
  "Commissioner",
  "Auditor",
  "Treasurer",
  "Prosecutor",
  "Sheriff",
  "Engineer",
  "Recorder",
  "Clerk of Courts",
  "Board of Elections",
  "Job & Family Services",
  "Building Department",
  "Planning Commission",
  "Dog Warden",
  "Veterans Service",
  "Probate Court",
  "Juvenile Court",
  "Common Pleas Court",
  "Emergency Management",
  "IT Department",
  "Soil & Water",
];

interface SeedPerson {
  name: string;
  dept: string;
  title: string;
  salaries: { year: number; amount: number }[];
}

const PEOPLE: SeedPerson[] = [
  {
    name: "Colleen Swedyk",
    dept: "Commissioner",
    title: "Commissioner",
    salaries: [
      { year: 2025, amount: 86647 },
      { year: 2024, amount: 84123 },
      { year: 2023, amount: 81456 },
    ],
  },
  {
    name: "Stephen Hambley",
    dept: "Commissioner",
    title: "Commissioner",
    salaries: [
      { year: 2025, amount: 86647 },
      { year: 2024, amount: 84123 },
      { year: 2023, amount: 81456 },
    ],
  },
  {
    name: "Bill Hutson",
    dept: "Commissioner",
    title: "Commissioner",
    salaries: [
      { year: 2025, amount: 86647 },
      { year: 2024, amount: 84123 },
      { year: 2023, amount: 81456 },
    ],
  },
  {
    name: "Michael Kovack",
    dept: "Auditor",
    title: "County Auditor",
    salaries: [
      { year: 2025, amount: 95230 },
      { year: 2024, amount: 92456 },
      { year: 2023, amount: 89600 },
    ],
  },
  {
    name: "John Meacham",
    dept: "Sheriff",
    title: "Sheriff",
    salaries: [
      { year: 2025, amount: 105415 },
      { year: 2024, amount: 102345 },
      { year: 2023, amount: 98200 },
    ],
  },
  {
    name: "Forrest Buckley",
    dept: "Prosecutor",
    title: "Prosecuting Attorney",
    salaries: [
      { year: 2025, amount: 149968 },
      { year: 2024, amount: 145600 },
      { year: 2023, amount: 140200 },
    ],
  },
  {
    name: "Denise Smith",
    dept: "Treasurer",
    title: "County Treasurer",
    salaries: [
      { year: 2025, amount: 91567 },
      { year: 2024, amount: 88900 },
      { year: 2023, amount: 86100 },
    ],
  },
  {
    name: "Kimberly Murphey",
    dept: "Recorder",
    title: "County Recorder",
    salaries: [
      { year: 2025, amount: 84821 },
      { year: 2024, amount: 82350 },
      { year: 2023, amount: 79800 },
    ],
  },
  {
    name: "Brian Dill",
    dept: "Sheriff",
    title: "Deputy Sheriff",
    salaries: [
      { year: 2025, amount: 70246 },
      { year: 2024, amount: 68200 },
      { year: 2023, amount: 65400 },
    ],
  },
  {
    name: "Patricia Johnson",
    dept: "Job & Family Services",
    title: "Director",
    salaries: [
      { year: 2025, amount: 98056 },
      { year: 2024, amount: 95200 },
      { year: 2023, amount: 92100 },
    ],
  },
  {
    name: "Robert Williams",
    dept: "Engineer",
    title: "County Engineer",
    salaries: [
      { year: 2025, amount: 115875 },
      { year: 2024, amount: 112500 },
      { year: 2023, amount: 108900 },
    ],
  },
  {
    name: "James Mitchell",
    dept: "IT Department",
    title: "IT Director",
    salaries: [
      { year: 2025, amount: 91361 },
      { year: 2024, amount: 88700 },
      { year: 2023, amount: 85200 },
    ],
  },
  {
    name: "Susan Clark",
    dept: "Board of Elections",
    title: "Director",
    salaries: [
      { year: 2025, amount: 74778 },
      { year: 2024, amount: 72600 },
      { year: 2023, amount: 70100 },
    ],
  },
  {
    name: "Thomas Anderson",
    dept: "Building Department",
    title: "Building Inspector",
    salaries: [
      { year: 2025, amount: 64272 },
      { year: 2024, amount: 62400 },
      { year: 2023, amount: 60100 },
    ],
  },
  {
    name: "Mary Thompson",
    dept: "Clerk of Courts",
    title: "Clerk of Courts",
    salaries: [
      { year: 2025, amount: 84821 },
      { year: 2024, amount: 82350 },
      { year: 2023, amount: 79800 },
    ],
  },
];

const VENDORS = [
  "Medina County Gazette",
  "Ohio Edison / FirstEnergy",
  "Columbia Gas of Ohio",
  "Medina City Schools",
  "Charter Communications",
  "Dell Technologies",
  "Verizon Wireless",
  "Staples Business Advantage",
  "Medina Hospital",
  "Thompson Hine LLP",
  "Bricker Graydon LLP",
  "Environmental Design Group",
  "GPD Group",
  "CT Consultants",
  "K.E. McCartney & Associates",
  "Medina County Highway Dept",
  "American Electric Power",
  "Ricoh USA Inc.",
  "Kforce Inc.",
  "Calfee Halter & Griswold",
];

function normalizeKey(name: string): string {
  const parts = name.toLowerCase().trim().split(/\s+/);
  if (parts.length === 1) return parts[0]!;
  const last = parts[parts.length - 1];
  const first = parts[0];
  const middle = parts.length > 2 ? parts[1]![0] : "";
  return `${last}|${first}|${middle}`;
}

console.log("Seeding database...");

// Clear existing data (order matters for foreign keys)
db.delete(legislatorVotes).run();
db.delete(rollCallVotes).run();
db.delete(billSponsors).run();
db.delete(bills).run();
db.delete(legislators).run();
db.delete(countyResolutions).run();
db.delete(donations).run();
db.delete(campaigns).run();
db.delete(meetingMentions).run();
db.delete(meetings).run();
db.delete(docketLineItems).run();
db.delete(dockets).run();
db.delete(salaries).run();
db.delete(nameAliases).run();
db.delete(people).run();

// Insert people with salaries
for (const p of PEOPLE) {
  const result = db
    .insert(people)
    .values({
      displayName: p.name,
      type: "person",
      department: p.dept,
      title: p.title,
    })
    .returning({ id: people.id })
    .get();

  // Add name alias
  db.insert(nameAliases)
    .values({
      personId: result.id,
      rawName: p.name,
      normalizedKey: normalizeKey(p.name),
      source: "seed",
    })
    .run();

  // Insert salary records
  for (const s of p.salaries) {
    db.insert(salaries)
      .values({
        personId: result.id,
        rawName: p.name,
        department: p.dept,
        title: p.title,
        salary: s.amount,
        year: s.year,
        source: "seed",
      })
      .run();
  }
}

// Insert dockets with line items
const docketDates = [
  "2025-02-11",
  "2025-02-04",
  "2025-01-28",
  "2025-01-21",
  "2025-01-14",
  "2025-01-07",
  "2024-12-17",
  "2024-12-10",
  "2024-12-03",
  "2024-11-26",
  "2024-11-19",
  "2024-11-12",
  "2024-10-29",
  "2024-10-22",
  "2024-10-08",
  "2024-09-24",
  "2024-09-17",
  "2024-08-27",
];

for (const date of docketDates) {
  const itemCount = 8 + Math.floor(Math.random() * 12);
  let totalAmount = 0;
  const items: Array<{
    rawVendorName: string;
    department: string;
    description: string;
    amount: number;
    checkNumber: string;
    fund: string;
  }> = [];

  for (let i = 0; i < itemCount; i++) {
    const vendor = VENDORS[Math.floor(Math.random() * VENDORS.length)]!;
    const dept = DEPARTMENTS[Math.floor(Math.random() * DEPARTMENTS.length)]!;
    const amount = Math.round((500 + Math.random() * 50000) * 100) / 100;
    totalAmount += amount;

    items.push({
      rawVendorName: vendor,
      department: dept,
      description: `Payment for services - ${dept}`,
      amount,
      checkNumber: String(100000 + Math.floor(Math.random() * 900000)),
      fund: `Fund ${Math.floor(Math.random() * 10) + 1}`,
    });
  }

  const docket = db
    .insert(dockets)
    .values({
      date,
      title: `Weekly Bills - ${date}`,
      totalAmount: Math.round(totalAmount * 100) / 100,
      source: "seed",
    })
    .returning({ id: dockets.id })
    .get();

  for (const item of items) {
    db.insert(docketLineItems)
      .values({
        docketId: docket.id,
        rawVendorName: item.rawVendorName,
        department: item.department,
        description: item.description,
        amount: item.amount,
        checkNumber: item.checkNumber,
        fund: item.fund,
      })
      .run();
  }
}

// ─── Seed Meetings ──────────────────────────────────────────────────

const MEETING_DATA = [
  {
    date: "2025-02-11",
    title: "Board of Commissioners Regular Session",
    body: `The Board of County Commissioners met in regular session on February 11, 2025.

Present: Commissioner Stephen Hambley, Commissioner Colleen Swedyk, Commissioner Bill Hutson.

Commissioner Hambley called the meeting to order at 9:00 AM.

Resolution 2025-045: Approve weekly docket of bills totaling $623,891.45. Motion by Commissioner Hutson, seconded by Commissioner Swedyk. Vote: 3-0.

Auditor Michael Kovack presented the 2024 year-end financial summary. Kovack reported the county ended the year with a surplus of $2.3 million.

Sheriff John Meacham provided an update on staffing levels. Meacham noted the department is currently at 92% of authorized strength.

IT Director James Mitchell presented a proposal for cybersecurity infrastructure upgrades. Estimated cost: $340,000 over two years.

Public comment period: No speakers.

Meeting adjourned at 10:30 AM.`,
  },
  {
    date: "2025-01-28",
    title: "Board of Commissioners Regular Session",
    body: `The Board of County Commissioners met in regular session on January 28, 2025.

Present: Commissioner Stephen Hambley, Commissioner Colleen Swedyk, Commissioner Bill Hutson.

Commissioner Swedyk called the meeting to order at 9:00 AM.

Resolution 2025-031: Award contract for county website redesign to Kforce Inc. for $185,000. Motion by Commissioner Hambley, seconded by Commissioner Hutson. Vote: 3-0.

County Engineer Robert Williams reported on winter road maintenance operations. Williams stated the Highway Department has used 4,200 tons of salt so far this season.

Treasurer Denise Smith presented the January investment portfolio report. Smith noted stable returns despite market volatility.

Recorder Kimberly Murphey announced that the office has completed digitization of all records dating back to 1970.

Meeting adjourned at 10:45 AM.`,
  },
  {
    date: "2025-01-14",
    title: "Board of Commissioners Regular Session",
    body: `The Board of County Commissioners met in regular session on January 14, 2025.

Present: Commissioner Stephen Hambley, Commissioner Bill Hutson. Absent: Commissioner Colleen Swedyk.

Commissioner Hambley called the meeting to order at 9:00 AM.

Resolution 2025-012: Approve 2025 organizational appointments and committee assignments. Motion by Commissioner Hutson, seconded by Commissioner Hambley. Vote: 2-0.

Prosecutor Forrest Buckley provided the annual report on county litigation. Buckley noted a 15% reduction in pending cases from the prior year.

Director Patricia Johnson of Job & Family Services presented the 2024 program statistics, including a 20% increase in workforce development placements.

Clerk of Courts Mary Thompson reported on the new electronic filing system implemented in December 2024.

Public comment: Thomas Anderson spoke regarding building permit fee structure review.

Meeting adjourned at 11:00 AM.`,
  },
  {
    date: "2024-12-10",
    title: "Board of Commissioners Regular Session",
    body: `The Board of County Commissioners met in regular session on December 10, 2024.

Present: Commissioner Stephen Hambley, Commissioner Colleen Swedyk, Commissioner Bill Hutson.

Commissioner Hambley called the meeting to order at 9:00 AM.

Resolution 2024-456: Approve weekly docket of bills totaling $847,234.12. Motion by Commissioner Swedyk, seconded by Commissioner Hutson. Vote: 3-0.

County Engineer Robert Williams presented an update on the State Route 18 bridge project. Williams stated the project is on schedule and within budget. Commissioner Hutson asked about winter construction delays.

Sheriff John Meacham reported on the new body camera program. The Sheriff's office has deployed cameras to all patrol deputies.

Prosecutor Forrest Buckley provided an update on pending litigation matters. Buckley recommended the Board authorize settlement of Case No. 2024-CV-1234.

Public comment period: No speakers.

Meeting adjourned at 10:45 AM.`,
  },
  {
    date: "2024-11-26",
    title: "Board of Commissioners Regular Session",
    body: `The Board of County Commissioners met in regular session on November 26, 2024.

Present: Commissioner Stephen Hambley, Commissioner Colleen Swedyk, Commissioner Bill Hutson.

Commissioner Swedyk called the meeting to order at 9:00 AM.

Resolution 2024-421: Accept the 2023 Annual Comprehensive Financial Report as presented by Auditor Michael Kovack. Motion by Commissioner Hambley, seconded by Commissioner Hutson. Vote: 3-0.

Treasurer Denise Smith presented the quarterly investment report. Smith noted improved returns on the county portfolio.

IT Director James Mitchell demonstrated the new public records request portal. Mitchell stated the system will reduce response times by approximately 40%.

Commissioner Hambley recognized Recorder Kimberly Murphey for the office's transition to digital recording services.

Building Inspector Thomas Anderson reported on code enforcement activities in the unincorporated areas.

Public comment: Susan Clark spoke regarding Board of Elections preparations for the 2025 cycle.

Meeting adjourned at 11:15 AM.`,
  },
  {
    date: "2024-11-12",
    title: "Board of Commissioners Regular Session",
    body: `The Board of County Commissioners met in regular session on November 12, 2024.

Present: Commissioner Stephen Hambley, Commissioner Bill Hutson. Absent: Commissioner Colleen Swedyk.

Commissioner Hambley called the meeting to order at 9:00 AM.

Resolution 2024-398: Award contract for courthouse HVAC replacement to Thompson Mechanical for $1.2 million. Motion by Commissioner Hutson, seconded by Commissioner Hambley. Vote: 2-0.

County Engineer Robert Williams requested approval for emergency bridge repair on Remsen Road. Estimated cost: $85,000.

Director Patricia Johnson of Job & Family Services provided an update on the opioid response program.

Deputy Sheriff Brian Dill reported on recent traffic enforcement activities on Interstate 71.

Meeting adjourned at 10:30 AM.`,
  },
  {
    date: "2024-10-22",
    title: "Board of Commissioners Regular Session",
    body: `The Board of County Commissioners met in regular session on October 22, 2024.

Present: Commissioner Stephen Hambley, Commissioner Colleen Swedyk, Commissioner Bill Hutson.

Commissioner Hutson called the meeting to order at 9:00 AM.

Resolution 2024-367: Approve the 2025 county budget appropriations. Total budget: $178.5 million. Motion by Commissioner Swedyk, seconded by Commissioner Hambley. Vote: 3-0.

Auditor Michael Kovack reviewed the tax revenue projections for 2025.

Clerk of Courts Mary Thompson reported on court technology upgrades.

Commissioner Swedyk recognized the efforts of the Soil & Water Conservation District in the watershed restoration project.

Meeting adjourned at 11:00 AM.`,
  },
  {
    date: "2024-10-08",
    title: "Board of Commissioners Regular Session",
    body: `The Board of County Commissioners met in regular session on October 8, 2024.

Present: Commissioner Stephen Hambley, Commissioner Colleen Swedyk, Commissioner Bill Hutson.

Commissioner Hambley called the meeting to order at 9:00 AM.

Resolution 2024-345: Accept proposal from GPD Group for engineering services on the new county parking structure. Motion by Commissioner Hutson, seconded by Commissioner Swedyk. Vote: 3-0.

Sheriff John Meacham presented the annual crime statistics report. Meacham noted a 12% decrease in property crime.

Commissioner Hambley announced the upcoming town hall meeting series regarding county broadband expansion.

Meeting adjourned at 10:15 AM.`,
  },
  {
    date: "2024-09-17",
    title: "Board of Commissioners Special Session",
    body: `The Board of County Commissioners met in special session on September 17, 2024.

Present: Commissioner Stephen Hambley, Commissioner Colleen Swedyk, Commissioner Bill Hutson.

Commissioner Swedyk called the meeting to order at 2:00 PM.

Purpose: Review and approval of the ARPA fund allocation plan.

Treasurer Denise Smith presented the remaining ARPA fund balance of $4.2 million.

The Board discussed allocations for broadband infrastructure, mental health services, and small business recovery grants.

Resolution 2024-330: Approve ARPA fund allocation plan as presented. Motion by Commissioner Hambley, seconded by Commissioner Hutson. Vote: 3-0.

Meeting adjourned at 3:30 PM.`,
  },
];

// Get all seeded people IDs for linking mentions
const seededPeople = db.select({ id: people.id, displayName: people.displayName }).from(people).all();
const personByName = new Map(seededPeople.map((p) => [p.displayName, p.id]));

for (const m of MEETING_DATA) {
  const meetingResult = db
    .insert(meetings)
    .values({
      date: m.date,
      title: m.title,
      body: m.body,
      source: "seed",
    })
    .returning({ id: meetings.id })
    .get();

  // Simple name extraction for seed data: look for known person names
  for (const [name, personId] of personByName) {
    if (m.body.includes(name)) {
      // Find context around the first occurrence
      const idx = m.body.indexOf(name);
      const start = Math.max(0, idx - 40);
      const end = Math.min(m.body.length, idx + name.length + 40);
      let context = m.body.slice(start, end).replace(/\s+/g, " ").trim();
      if (start > 0) context = "..." + context;
      if (end < m.body.length) context = context + "...";

      db.insert(meetingMentions)
        .values({
          meetingId: meetingResult.id,
          personId,
          rawName: name,
          context,
        })
        .run();
    }
  }
}

// ─── Seed Campaigns & Donations ─────────────────────────────────────

const CAMPAIGN_DATA = [
  {
    candidateName: "Stephen Hambley",
    committeeName: "Friends of Stephen Hambley",
    office: "County Commissioner",
    party: "Republican",
    year: 2024,
  },
  {
    candidateName: "Colleen Swedyk",
    committeeName: "Swedyk for Commissioner",
    office: "County Commissioner",
    party: "Republican",
    year: 2022,
  },
  {
    candidateName: "Bill Hutson",
    committeeName: "Citizens for Hutson",
    office: "County Commissioner",
    party: "Republican",
    year: 2022,
  },
  {
    candidateName: "Forrest Buckley",
    committeeName: "Buckley for Prosecutor",
    office: "County Prosecutor",
    party: "Republican",
    year: 2024,
  },
  {
    candidateName: "John Meacham",
    committeeName: "Re-Elect Sheriff Meacham",
    office: "County Sheriff",
    party: "Republican",
    year: 2025,
  },
];

const DONOR_POOL = [
  { name: "John Smith", city: "Medina", state: "OH", employer: "Smith Construction", occupation: "Contractor" },
  { name: "Jane Williams", city: "Brunswick", state: "OH", employer: "Retired", occupation: "Retired" },
  { name: "Robert Taylor", city: "Wadsworth", state: "OH", employer: "Taylor Insurance Agency", occupation: "Insurance Agent" },
  { name: "Mary Davis", city: "Medina", state: "OH", employer: "Medina Hospital", occupation: "Physician" },
  { name: "David Brown", city: "Seville", state: "OH", employer: "Brown Family Farms", occupation: "Farmer" },
  { name: "Linda Wilson", city: "Medina", state: "OH", employer: "Wilson & Associates", occupation: "Attorney" },
  { name: "Michael Anderson", city: "Lodi", state: "OH", employer: "Anderson Manufacturing", occupation: "Executive" },
  { name: "Patricia Martinez", city: "Brunswick", state: "OH", employer: "Self-employed", occupation: "Realtor" },
  { name: "James Johnson", city: "Hinckley", state: "OH", employer: "Retired", occupation: "Retired" },
  { name: "Karen Thomas", city: "Wadsworth", state: "OH", employer: "Thomas CPA", occupation: "Accountant" },
  { name: "Richard Harris", city: "Medina", state: "OH", employer: "Harris Dental", occupation: "Dentist" },
  { name: "Susan Clark", city: "Medina", state: "OH", employer: "County Board of Elections", occupation: "Director" },
  { name: "Charles White", city: "Spencer", state: "OH", employer: "White Auto Group", occupation: "Dealer" },
  { name: "Elizabeth Moore", city: "Medina", state: "OH", employer: "Medina City Schools", occupation: "Teacher" },
  { name: "Daniel Jackson", city: "Wadsworth", state: "OH", employer: "Jackson Engineering", occupation: "Engineer" },
];

const campaignIds: number[] = [];
for (const c of CAMPAIGN_DATA) {
  // Link campaign to person if they exist in seed data
  const personId = personByName.get(c.candidateName) ?? null;

  const result = db
    .insert(campaigns)
    .values({
      personId,
      candidateName: c.candidateName,
      committeeName: c.committeeName,
      office: c.office,
      party: c.party,
      year: c.year,
      source: "seed",
    })
    .returning({ id: campaigns.id })
    .get();

  campaignIds.push(result.id);
}

// Generate donations
const donationDates = [
  "2025-01-10", "2025-01-22", "2025-02-05", "2025-02-14",
  "2024-01-15", "2024-02-20", "2024-03-10", "2024-04-05",
  "2024-05-12", "2024-06-18", "2024-07-22", "2024-08-14",
  "2024-09-03", "2024-10-01", "2024-10-15", "2024-10-28",
  "2022-01-20", "2022-03-15", "2022-05-10", "2022-07-08",
  "2022-08-22", "2022-09-15", "2022-10-05", "2022-10-20",
];

let donationCount = 0;
for (const campaignId of campaignIds) {
  // Each campaign gets 10-15 donations from random donors
  const numDonations = 10 + Math.floor(Math.random() * 6);
  for (let i = 0; i < numDonations; i++) {
    const donor = DONOR_POOL[Math.floor(Math.random() * DONOR_POOL.length)]!;
    const date = donationDates[Math.floor(Math.random() * donationDates.length)]!;
    const amount = Math.round((25 + Math.random() * 2000) * 100) / 100;

    db.insert(donations)
      .values({
        campaignId,
        rawDonorName: donor.name,
        donorCity: donor.city,
        donorState: donor.state,
        donorEmployer: donor.employer,
        donorOccupation: donor.occupation,
        amount,
        date,
        type: "monetary",
        source: "seed",
      })
      .run();
    donationCount++;
  }
}

// ─── Seed Legislators ────────────────────────────────────────────────

const LEGISLATORS_DATA = [
  {
    name: "Mark Romanchuk",
    firstName: "Mark",
    lastName: "Romanchuk",
    party: "Republican",
    chamber: "Senate",
    district: "22",
    bioUrl: "https://www.ohiosenate.gov/senators/romanchuk",
  },
  {
    name: "Sharon A. Ray",
    firstName: "Sharon",
    lastName: "Ray",
    party: "Republican",
    chamber: "House",
    district: "66",
    bioUrl: "https://ohiohouse.gov/members/sharon-a-ray",
  },
  {
    name: "Melanie Miller",
    firstName: "Melanie",
    lastName: "Miller",
    party: "Republican",
    chamber: "House",
    district: "67",
    bioUrl: "https://ohiohouse.gov/members/melanie-miller",
  },
];

const legislatorIds: number[] = [];
for (const leg of LEGISLATORS_DATA) {
  // Link to people hub if they exist (e.g. Sharon Ray as former commissioner)
  const existingPerson = personByName.get(leg.name) ?? null;

  const result = db
    .insert(legislators)
    .values({
      ...leg,
      personId: existingPerson,
      source: "seed",
    })
    .returning({ id: legislators.id })
    .get();

  legislatorIds.push(result.id);
}

// ─── Seed Bills ──────────────────────────────────────────────────────

const BILLS_DATA = [
  {
    billNumber: "HB 1",
    title: "School Safety and Mental Health",
    description: "Requires school districts to develop comprehensive safety plans and expands mental health resources in schools.",
    chamber: "House",
    status: 2,
    statusLabel: "Engrossed",
    statusDate: "2025-06-15",
    lastAction: "Passed by House Education Committee",
    lastActionDate: "2025-06-15",
    sponsors: [1, 2], // legislator indices (Ray, Miller)
  },
  {
    billNumber: "HB 24",
    title: "Local Government Fund Reform",
    description: "Modifies the distribution formula for the Local Government Fund to increase county allocations.",
    chamber: "House",
    status: 1,
    statusLabel: "Introduced",
    statusDate: "2025-02-10",
    lastAction: "Referred to House Finance Committee",
    lastActionDate: "2025-02-10",
    sponsors: [1], // Ray
  },
  {
    billNumber: "SB 15",
    title: "Infrastructure Investment Act",
    description: "Authorizes $2.5 billion in bonds for road, bridge, and broadband infrastructure projects across Ohio.",
    chamber: "Senate",
    status: 4,
    statusLabel: "Passed",
    statusDate: "2025-09-20",
    lastAction: "Signed by Governor",
    lastActionDate: "2025-09-20",
    sponsors: [0], // Romanchuk
  },
  {
    billNumber: "HB 47",
    title: "Property Tax Relief Act",
    description: "Provides property tax relief for senior citizens and disabled veterans by increasing the homestead exemption.",
    chamber: "House",
    status: 3,
    statusLabel: "Enrolled",
    statusDate: "2025-08-01",
    lastAction: "Passed by Senate, awaiting Governor signature",
    lastActionDate: "2025-08-01",
    sponsors: [2], // Miller
  },
  {
    billNumber: "SB 33",
    title: "County Broadband Expansion",
    description: "Creates a grant program for rural broadband expansion in underserved Ohio counties.",
    chamber: "Senate",
    status: 1,
    statusLabel: "Introduced",
    statusDate: "2025-03-05",
    lastAction: "Referred to Senate Technology Committee",
    lastActionDate: "2025-03-05",
    sponsors: [0], // Romanchuk
  },
  {
    billNumber: "HB 82",
    title: "Opioid Response Enhancement",
    description: "Strengthens county-level opioid response programs and allocates additional funding for treatment facilities.",
    chamber: "House",
    status: 4,
    statusLabel: "Passed",
    statusDate: "2025-07-12",
    lastAction: "Signed by Governor",
    lastActionDate: "2025-07-12",
    sponsors: [1, 2], // Ray, Miller
  },
  {
    billNumber: "SB 51",
    title: "Government Transparency Act",
    description: "Requires all county governments to publish financial data in machine-readable formats online.",
    chamber: "Senate",
    status: 2,
    statusLabel: "Engrossed",
    statusDate: "2025-05-20",
    lastAction: "Passed by Senate Government Oversight Committee",
    lastActionDate: "2025-05-20",
    sponsors: [0], // Romanchuk
  },
  {
    billNumber: "HB 105",
    title: "Small Business Tax Credit",
    description: "Creates a tax credit for small businesses that hire Ohio veterans.",
    chamber: "House",
    status: 6,
    statusLabel: "Dead",
    statusDate: "2025-12-31",
    lastAction: "Failed to advance from committee before session end",
    lastActionDate: "2025-12-31",
    sponsors: [2], // Miller
  },
  {
    billNumber: "SB 67",
    title: "Water Quality Protection Act",
    description: "Establishes stricter water quality standards for Ohio waterways and increases penalties for polluters.",
    chamber: "Senate",
    status: 5,
    statusLabel: "Vetoed",
    statusDate: "2025-10-15",
    lastAction: "Vetoed by Governor",
    lastActionDate: "2025-10-15",
    sponsors: [0], // Romanchuk
  },
  {
    billNumber: "HB 130",
    title: "First Responder Benefits",
    description: "Expands workers compensation coverage and PTSD benefits for first responders.",
    chamber: "House",
    status: 1,
    statusLabel: "Introduced",
    statusDate: "2025-04-22",
    lastAction: "Referred to House Insurance Committee",
    lastActionDate: "2025-04-22",
    sponsors: [1], // Ray
  },
  {
    billNumber: "SB 88",
    title: "Agricultural Technology Grants",
    description: "Establishes a grant program for Ohio farmers to adopt precision agriculture technology.",
    chamber: "Senate",
    status: 2,
    statusLabel: "Engrossed",
    statusDate: "2025-06-30",
    lastAction: "Passed by Senate Agriculture Committee",
    lastActionDate: "2025-06-30",
    sponsors: [0], // Romanchuk
  },
  {
    billNumber: "HB 156",
    title: "Public Records Modernization",
    description: "Modernizes Ohio public records law to require digital access to government documents.",
    chamber: "House",
    status: 1,
    statusLabel: "Introduced",
    statusDate: "2025-05-15",
    lastAction: "Referred to House Government Oversight Committee",
    lastActionDate: "2025-05-15",
    sponsors: [1, 2], // Ray, Miller
  },
  {
    billNumber: "SB 102",
    title: "County Emergency Fund Act",
    description: "Creates a state matching fund for county emergency reserves.",
    chamber: "Senate",
    status: 3,
    statusLabel: "Enrolled",
    statusDate: "2025-09-01",
    lastAction: "Passed by both chambers, enrolled",
    lastActionDate: "2025-09-01",
    sponsors: [0], // Romanchuk
  },
  {
    billNumber: "HB 178",
    title: "Youth Employment Initiative",
    description: "Creates summer employment programs for at-risk youth in Ohio counties.",
    chamber: "House",
    status: 4,
    statusLabel: "Passed",
    statusDate: "2025-11-10",
    lastAction: "Signed by Governor",
    lastActionDate: "2025-11-10",
    sponsors: [2], // Miller
  },
  {
    billNumber: "HB 201",
    title: "County Budget Transparency Act",
    description: "Requires county commissioners to hold public budget hearings and publish detailed budget breakdowns.",
    chamber: "House",
    status: 1,
    statusLabel: "Introduced",
    statusDate: "2025-06-01",
    lastAction: "Referred to House Finance Committee",
    lastActionDate: "2025-06-01",
    sponsors: [1], // Ray
  },
];

const billIds: number[] = [];
for (const b of BILLS_DATA) {
  const { sponsors: sponsorIndices, ...billData } = b;

  const result = db
    .insert(bills)
    .values({
      ...billData,
      source: "seed",
    })
    .returning({ id: bills.id })
    .get();

  billIds.push(result.id);

  // Add sponsors
  for (const legIdx of sponsorIndices) {
    db.insert(billSponsors)
      .values({
        billId: result.id,
        legislatorId: legislatorIds[legIdx]!,
        type: sponsorIndices.indexOf(legIdx) === 0 ? "sponsor" : "cosponsor",
      })
      .run();
  }
}

// ─── Seed Roll Call Votes ────────────────────────────────────────────

const VOTE_OPTIONS: Array<"yea" | "nay" | "nv" | "absent"> = ["yea", "nay", "nv", "absent"];

interface RollCallSeed {
  billIdx: number;
  date: string;
  chamber: string;
  description: string;
  yea: number;
  nay: number;
  nv: number;
  absent: number;
  passed: number;
  // Medina legislator votes: [Romanchuk, Ray, Miller]
  medinaVotes: Array<"yea" | "nay" | "nv" | "absent" | null>;
}

const ROLL_CALLS: RollCallSeed[] = [
  {
    billIdx: 0, description: "House Education Committee Vote", date: "2025-06-15", chamber: "House",
    yea: 18, nay: 7, nv: 2, absent: 0, passed: 1,
    medinaVotes: [null, "yea", "yea"],
  },
  {
    billIdx: 2, description: "Senate Floor Vote - Third Reading", date: "2025-07-10", chamber: "Senate",
    yea: 28, nay: 5, nv: 0, absent: 0, passed: 1,
    medinaVotes: ["yea", null, null],
  },
  {
    billIdx: 2, description: "House Floor Vote - Third Reading", date: "2025-08-15", chamber: "House",
    yea: 72, nay: 22, nv: 3, absent: 2, passed: 1,
    medinaVotes: [null, "yea", "yea"],
  },
  {
    billIdx: 3, description: "House Floor Vote - Third Reading", date: "2025-06-20", chamber: "House",
    yea: 65, nay: 30, nv: 2, absent: 2, passed: 1,
    medinaVotes: [null, "yea", "nay"],
  },
  {
    billIdx: 3, description: "Senate Floor Vote - Third Reading", date: "2025-07-25", chamber: "Senate",
    yea: 22, nay: 11, nv: 0, absent: 0, passed: 1,
    medinaVotes: ["yea", null, null],
  },
  {
    billIdx: 5, description: "House Floor Vote - Third Reading", date: "2025-05-12", chamber: "House",
    yea: 85, nay: 10, nv: 2, absent: 2, passed: 1,
    medinaVotes: [null, "yea", "yea"],
  },
  {
    billIdx: 5, description: "Senate Floor Vote - Third Reading", date: "2025-06-28", chamber: "Senate",
    yea: 30, nay: 3, nv: 0, absent: 0, passed: 1,
    medinaVotes: ["yea", null, null],
  },
  {
    billIdx: 6, description: "Senate Government Oversight Vote", date: "2025-05-20", chamber: "Senate",
    yea: 8, nay: 3, nv: 1, absent: 0, passed: 1,
    medinaVotes: ["yea", null, null],
  },
  {
    billIdx: 7, description: "House Floor Vote - Third Reading", date: "2025-11-01", chamber: "House",
    yea: 32, nay: 55, nv: 8, absent: 4, passed: 0,
    medinaVotes: [null, "nay", "yea"],
  },
  {
    billIdx: 8, description: "Senate Floor Vote - Third Reading", date: "2025-08-20", chamber: "Senate",
    yea: 24, nay: 9, nv: 0, absent: 0, passed: 1,
    medinaVotes: ["nay", null, null],
  },
  {
    billIdx: 8, description: "House Floor Vote - Third Reading", date: "2025-09-15", chamber: "House",
    yea: 58, nay: 35, nv: 4, absent: 2, passed: 1,
    medinaVotes: [null, "yea", "nay"],
  },
  {
    billIdx: 10, description: "Senate Agriculture Committee Vote", date: "2025-06-30", chamber: "Senate",
    yea: 10, nay: 2, nv: 0, absent: 1, passed: 1,
    medinaVotes: ["yea", null, null],
  },
  {
    billIdx: 11, description: "House Government Oversight Vote", date: "2025-07-10", chamber: "House",
    yea: 15, nay: 5, nv: 2, absent: 1, passed: 1,
    medinaVotes: [null, "yea", "yea"],
  },
  {
    billIdx: 12, description: "Senate Floor Vote - Third Reading", date: "2025-07-30", chamber: "Senate",
    yea: 26, nay: 7, nv: 0, absent: 0, passed: 1,
    medinaVotes: ["yea", null, null],
  },
  {
    billIdx: 12, description: "House Floor Vote - Third Reading", date: "2025-08-28", chamber: "House",
    yea: 70, nay: 25, nv: 2, absent: 2, passed: 1,
    medinaVotes: [null, "yea", "nay"],
  },
  {
    billIdx: 13, description: "House Floor Vote - Third Reading", date: "2025-09-05", chamber: "House",
    yea: 78, nay: 17, nv: 2, absent: 2, passed: 1,
    medinaVotes: [null, "yea", "yea"],
  },
  {
    billIdx: 13, description: "Senate Floor Vote - Third Reading", date: "2025-10-10", chamber: "Senate",
    yea: 29, nay: 4, nv: 0, absent: 0, passed: 1,
    medinaVotes: ["yea", null, null],
  },
  {
    billIdx: 1, description: "House Finance Committee Vote", date: "2025-03-20", chamber: "House",
    yea: 12, nay: 8, nv: 3, absent: 0, passed: 1,
    medinaVotes: [null, "yea", "absent"],
  },
  {
    billIdx: 4, description: "Senate Technology Committee Vote", date: "2025-04-15", chamber: "Senate",
    yea: 9, nay: 3, nv: 1, absent: 0, passed: 1,
    medinaVotes: ["yea", null, null],
  },
  {
    billIdx: 9, description: "House Insurance Committee Vote", date: "2025-05-30", chamber: "House",
    yea: 14, nay: 6, nv: 2, absent: 1, passed: 1,
    medinaVotes: [null, "yea", "nv"],
  },
];

let rollCallCount = 0;
let voteCount = 0;

for (const rc of ROLL_CALLS) {
  const rcResult = db
    .insert(rollCallVotes)
    .values({
      billId: billIds[rc.billIdx]!,
      date: rc.date,
      chamber: rc.chamber,
      description: rc.description,
      yea: rc.yea,
      nay: rc.nay,
      nv: rc.nv,
      absent: rc.absent,
      passed: rc.passed,
      source: "seed",
    })
    .returning({ id: rollCallVotes.id })
    .get();

  rollCallCount++;

  // Insert Medina legislator votes
  for (let i = 0; i < 3; i++) {
    const v = rc.medinaVotes[i];
    if (v != null) {
      const vote: "yea" | "nay" | "nv" | "absent" = v;
      db.insert(legislatorVotes)
        .values({
          rollCallId: rcResult.id,
          legislatorId: legislatorIds[i]!,
          vote,
        })
        .run();
      voteCount++;
    }
  }
}

// ─── Seed County Resolutions ─────────────────────────────────────────

const RESOLUTIONS_DATA = [
  { number: "2025-001", date: "2025-01-07", title: "Organizational meeting — 2025 committee assignments and appointments" },
  { number: "2025-012", date: "2025-01-14", title: "Approve 2025 organizational appointments and committee assignments" },
  { number: "2025-018", date: "2025-01-21", title: "Accept lowest bid for courthouse elevator modernization project" },
  { number: "2025-024", date: "2025-01-28", title: "Award contract for county website redesign to Kforce Inc." },
  { number: "2025-031", date: "2025-01-28", title: "Authorize transfer of funds from General Fund to Capital Improvement Fund" },
  { number: "2025-035", date: "2025-02-04", title: "Approve lease agreement for new Dog Warden facility" },
  { number: "2025-039", date: "2025-02-04", title: "Accept Ohio Department of Transportation grant for State Route 18 bridge" },
  { number: "2025-045", date: "2025-02-11", title: "Approve weekly docket of bills totaling $623,891.45" },
  { number: "2025-052", date: "2025-02-18", title: "Establish Medina County Broadband Task Force" },
  { number: "2025-058", date: "2025-02-25", title: "Authorize emergency appropriation for winter road maintenance" },
  { number: "2024-456", date: "2024-12-10", title: "Approve weekly docket of bills totaling $847,234.12" },
  { number: "2024-445", date: "2024-12-03", title: "Accept bid for courthouse HVAC phase 2 replacement" },
  { number: "2024-421", date: "2024-11-26", title: "Accept the 2023 Annual Comprehensive Financial Report" },
  { number: "2024-410", date: "2024-11-19", title: "Approve intergovernmental agreement with City of Medina for shared services" },
  { number: "2024-398", date: "2024-11-12", title: "Award contract for courthouse HVAC replacement to Thompson Mechanical" },
  { number: "2024-385", date: "2024-11-05", title: "Authorize purchase of body cameras for Sheriff's Office" },
  { number: "2024-372", date: "2024-10-29", title: "Approve updated county employee handbook and policies" },
  { number: "2024-367", date: "2024-10-22", title: "Approve the 2025 county budget appropriations — $178.5 million" },
  { number: "2024-355", date: "2024-10-15", title: "Accept donation of land for new county park from Medina Township" },
  { number: "2024-345", date: "2024-10-08", title: "Accept proposal from GPD Group for engineering services on new county parking structure" },
  { number: "2024-330", date: "2024-09-17", title: "Approve ARPA fund allocation plan" },
  { number: "2024-318", date: "2024-09-10", title: "Authorize county participation in NOACA transportation study" },
  { number: "2024-305", date: "2024-09-03", title: "Approve contract extension for county health insurance administrator" },
  { number: "2024-290", date: "2024-08-20", title: "Accept federal workforce development grant for Job & Family Services" },
  { number: "2024-278", date: "2024-08-06", title: "Approve purchase of replacement vehicles for county fleet" },
  { number: "2024-265", date: "2024-07-23", title: "Authorize participation in Ohio Opioid Settlement distribution" },
  { number: "2024-250", date: "2024-07-09", title: "Approve updated county technology plan for 2024-2026" },
  { number: "2024-238", date: "2024-06-25", title: "Award contract for county records digitization project" },
  { number: "2024-225", date: "2024-06-11", title: "Accept Ohio EPA Clean Water grant for Chippewa Creek watershed" },
  { number: "2024-210", date: "2024-05-28", title: "Authorize county Engineer to proceed with Remsen Road bridge repair" },
];

let resolutionCount = 0;
for (const r of RESOLUTIONS_DATA) {
  db.insert(countyResolutions)
    .values({
      resolutionNumber: r.number,
      date: r.date,
      title: r.title,
      description: `Resolution ${r.number}: ${r.title}`,
      source: "seed",
    })
    .run();
  resolutionCount++;
}

// Count results
const peopleCount = db.select().from(people).all().length;
const salaryCount = db.select().from(salaries).all().length;
const docketCount = db.select().from(dockets).all().length;
const lineItemCount = db.select().from(docketLineItems).all().length;
const meetingCount = db.select().from(meetings).all().length;
const mentionCount = db.select().from(meetingMentions).all().length;
const campaignCount = db.select().from(campaigns).all().length;

const legislatorCount = db.select().from(legislators).all().length;
const billCount = db.select().from(bills).all().length;

console.log(`Seeded:`);
console.log(`  ${peopleCount} people`);
console.log(`  ${salaryCount} salary records`);
console.log(`  ${docketCount} dockets`);
console.log(`  ${lineItemCount} docket line items`);
console.log(`  ${meetingCount} meetings`);
console.log(`  ${mentionCount} meeting mentions`);
console.log(`  ${campaignCount} campaigns`);
console.log(`  ${donationCount} donations`);
console.log(`  ${legislatorCount} legislators`);
console.log(`  ${billCount} bills`);
console.log(`  ${rollCallCount} roll call votes`);
console.log(`  ${voteCount} legislator votes`);
console.log(`  ${resolutionCount} county resolutions`);

// Rebuild full-text search index
console.log("Rebuilding search index...");
import("@/db/queries/search").then(({ rebuildSearchIndex }) => {
  rebuildSearchIndex();
  console.log("Search index rebuilt.");
  console.log("Done.");
  process.exit(0);
});
