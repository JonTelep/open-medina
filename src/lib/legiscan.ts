/**
 * LegiScan API client for Ohio General Assembly bill tracking.
 *
 * Requires LEGISCAN_API_KEY in .env
 * Free tier: 30,000 queries/month
 *
 * Docs: https://legiscan.com/legiscan
 */

const API_BASE = "https://api.legiscan.com/?key=";

// Rate limit: 1 request per second
let lastRequestTime = 0;
const MIN_INTERVAL_MS = 1000;

async function rateLimitWait() {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < MIN_INTERVAL_MS) {
    await new Promise((resolve) => setTimeout(resolve, MIN_INTERVAL_MS - elapsed));
  }
  lastRequestTime = Date.now();
}

function getApiKey(): string | null {
  return process.env.LEGISCAN_API_KEY ?? null;
}

export function hasApiKey(): boolean {
  return !!getApiKey();
}

async function apiCall(op: string, params: Record<string, string | number> = {}): Promise<Record<string, unknown>> {
  const key = getApiKey();
  if (!key) throw new Error("LEGISCAN_API_KEY not set in environment");

  await rateLimitWait();

  const url = new URL(`${API_BASE}${key}`);
  url.searchParams.set("op", op);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, String(v));
  }

  const response = await fetch(url.toString(), { headers: { "User-Agent": "OpenMedina/1.0 (+https://openmedina.org)" } });
  if (!response.ok) {
    throw new Error(`LegiScan API error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as Record<string, unknown>;

  if (data.status === "ERROR") {
    throw new Error(`LegiScan API error: ${JSON.stringify(data.alert)}`);
  }

  return data;
}

// ─── API Operations ─────────────────────────────────────────────────

export interface LegiScanMasterListBill {
  bill_id: number;
  number: string;
  change_hash: string;
  title: string;
  status: number;
  last_action: string;
  last_action_date: string;
}

export async function getMasterList(sessionId?: number): Promise<Record<string, LegiScanMasterListBill>> {
  const params: Record<string, string | number> = { state: "OH" };
  if (sessionId) params.id = sessionId;

  const data = await apiCall("getMasterList", params);
  const masterList = data.masterlist as Record<string, unknown>;

  // masterlist contains a "session" key and then bill entries keyed by index
  const result: Record<string, LegiScanMasterListBill> = {};
  for (const [key, value] of Object.entries(masterList)) {
    if (key === "session") continue;
    result[key] = value as LegiScanMasterListBill;
  }

  return result;
}

export interface LegiScanBillDetail {
  bill_id: number;
  change_hash: string;
  session_id: number;
  session: { session_id: number; session_name: string };
  url: string;
  state_link: string;
  status: number;
  status_date: string;
  title: string;
  description: string;
  bill_number: string;
  bill_type: string;
  body: string;
  body_id: number;
  current_body: string;
  current_body_id: number;
  sponsors: Array<{
    people_id: number;
    party_id: number;
    party: string;
    role_id: number;
    role: string;
    name: string;
    first_name: string;
    last_name: string;
    sponsor_type_id: number;
    sponsor_order: number;
  }>;
  votes: Array<{
    roll_call_id: number;
    date: string;
    desc: string;
    yea: number;
    nay: number;
    nv: number;
    absent: number;
    total: number;
    passed: number;
    chamber: string;
    chamber_id: number;
  }>;
  history: Array<{
    date: string;
    action: string;
    chamber: string;
    chamber_id: number;
    importance: number;
  }>;
}

export async function getBill(billId: number): Promise<LegiScanBillDetail> {
  const data = await apiCall("getBill", { id: billId });
  return data.bill as LegiScanBillDetail;
}

export interface LegiScanRollCallDetail {
  roll_call_id: number;
  bill_id: number;
  date: string;
  desc: string;
  yea: number;
  nay: number;
  nv: number;
  absent: number;
  total: number;
  passed: number;
  chamber: string;
  chamber_id: number;
  votes: Array<{
    people_id: number;
    vote_id: number;
    vote_text: string;
  }>;
}

export async function getRollCall(rollCallId: number): Promise<LegiScanRollCallDetail> {
  const data = await apiCall("getRollCall", { id: rollCallId });
  return data.roll_call as LegiScanRollCallDetail;
}

export interface LegiScanPersonDetail {
  people_id: number;
  person_hash: string;
  name: string;
  first_name: string;
  last_name: string;
  party: string;
  party_id: number;
  role: string;
  role_id: number;
  district: string;
  ftm_eid: number;
  votesmart_id: number;
  opensecrets_id: string;
  ballotpedia: string;
}

export async function getPersonDetail(peopleId: number): Promise<LegiScanPersonDetail> {
  const data = await apiCall("getPerson", { id: peopleId });
  return data.person as LegiScanPersonDetail;
}

export interface LegiScanSearchResult {
  bill_id: number;
  bill_number: string;
  title: string;
  change_hash: string;
  relevance: number;
}

export async function searchBills(query: string, state = "OH"): Promise<LegiScanSearchResult[]> {
  const data = await apiCall("search", { state, query });
  const searchResult = data.searchresult as Record<string, unknown>;

  const results: LegiScanSearchResult[] = [];
  for (const [key, value] of Object.entries(searchResult)) {
    if (key === "summary") continue;
    results.push(value as LegiScanSearchResult);
  }

  return results;
}

// ─── Status code mapping ────────────────────────────────────────────

const STATUS_LABELS: Record<number, string> = {
  1: "Introduced",
  2: "Engrossed",
  3: "Enrolled",
  4: "Passed",
  5: "Vetoed",
  6: "Dead",
};

export function statusLabel(code: number): string {
  return STATUS_LABELS[code] ?? "Unknown";
}

// Map LegiScan vote_text to our enum
export function normalizeVoteText(voteText: string): "yea" | "nay" | "nv" | "absent" {
  switch (voteText.toLowerCase()) {
    case "yea":
    case "yes":
      return "yea";
    case "nay":
    case "no":
      return "nay";
    case "absent":
      return "absent";
    default:
      return "nv";
  }
}

// Map LegiScan chamber string
export function normalizeChamber(chamber: string): string {
  if (/house|h/i.test(chamber)) return "House";
  if (/senate|s/i.test(chamber)) return "Senate";
  return chamber;
}

// ─── Session helpers ────────────────────────────────────────────────

export async function getCurrentSession(state = "OH"): Promise<{ session_id: number; session_name: string }> {
  const data = await apiCall("getSessionList", { state });
  const list = data.sessions as { session_id: number; session_name: string; special: number; year_start: number }[];
  return list.filter((s) => !s.special).sort((a, b) => b.year_start - a.year_start)[0]!;
}

export interface LegiScanSessionPerson {
  people_id: number;
  name: string;
  first_name: string;
  last_name: string;
  party: string;
  role: string;
  district: string;
}

export async function getSessionPeople(sessionId: number): Promise<LegiScanSessionPerson[]> {
  const data = await apiCall("getSessionPeople", { id: sessionId });
  return (data.sessionpeople as { people: LegiScanSessionPerson[] }).people;
}

export async function getSponsoredBillIds(peopleId: number, sessionId: number): Promise<number[]> {
  const data = await apiCall("getSponsoredList", { id: peopleId });
  const bills = (data.sponsoredbills as { bills: { bill_id: number; session_id: number }[] }).bills;
  return bills.filter((b) => b.session_id === sessionId).map((b) => b.bill_id);
}

export async function searchSessionBillIds(query: string, state = "OH"): Promise<number[]> {
  const data = await apiCall("getSearch", { state, query, year: 2 });
  const r = data.searchresult as Record<string, { bill_id?: number }>;
  return Object.entries(r).filter(([k]) => k !== "summary").map(([, v]) => v.bill_id!).filter(Boolean);
}
