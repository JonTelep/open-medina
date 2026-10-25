// Exact official pages for a bill or roll call.
export const ohioBillUrl = (billNumber: string | null) =>
  billNumber ? `https://www.legislature.ohio.gov/legislation/136/${billNumber.toLowerCase()}` : null;
export const legiscanRollCallUrl = (billNumber: string | null, rollCallId: number | null) =>
  billNumber && rollCallId ? `https://legiscan.com/OH/rollcall/${billNumber}/id/${rollCallId}` : null;
