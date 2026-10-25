// Medina County General Fund, final budget vs actual, budget (non-GAAP) basis, as audited.
// Each row comes from the "Statement of Revenues, Expenditures and Changes in Fund Balance,
// Budget (Non-GAAP Basis) and Actual, General Fund" in the county's audited annual financial
// report as published by the Ohio Auditor of State. `page` is the PDF page (not the printed folio).
// Figures were read from the PDFs and checked so final minus actual equals the printed variance.
export type BudgetYear = {
  year: number;
  originalExpenditures: number;
  finalExpenditures: number;
  actualExpenditures: number;
  finalRevenues: number;
  actualRevenues: number;
  url: string;
  page: number;
  verifiedAt: string;
};

const SAO = "https://ohioauditor.gov/auditsearch/Reports";
const V = "2026-10-25";

export const COUNTY_BUDGET: BudgetYear[] = [
  { year: 2024, originalExpenditures: 57728965, finalExpenditures: 62782874, actualExpenditures: 58452762, finalRevenues: 62674093, actualRevenues: 64618012, url: `${SAO}/2026/Medina_County_24-Medina_FINAL.pdf`, page: 72, verifiedAt: V },
  { year: 2023, originalExpenditures: 51956958, finalExpenditures: 57792029, actualExpenditures: 53883873, finalRevenues: 54591227, actualRevenues: 60781334, url: `${SAO}/2025/Medina_County_23-Medina_FINAL.pdf`, page: 66, verifiedAt: V },
  { year: 2022, originalExpenditures: 49870565, finalExpenditures: 53501292, actualExpenditures: 45128161, finalRevenues: 52058107, actualRevenues: 54424055, url: `${SAO}/2023/Medina_County_22-Medina_FINAL.pdf`, page: 64, verifiedAt: V },
  { year: 2021, originalExpenditures: 51133565, finalExpenditures: 53494694, actualExpenditures: 47074002, finalRevenues: 48329026, actualRevenues: 51660890, url: `${SAO}/2022/Medina_County_21-Medina_FINAL.pdf`, page: 64, verifiedAt: V },
  { year: 2020, originalExpenditures: 49548886, finalExpenditures: 45299385, actualExpenditures: 40126490, finalRevenues: 42128800, actualRevenues: 47867630, url: `${SAO}/2021/Medina_County_20-Medina_FINAL.pdf`, page: 60, verifiedAt: V },
];

export const pageUrl = (r: BudgetYear) => `${r.url}#page=${r.page}`;
