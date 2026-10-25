import type { Metadata } from "next";
import { pageMeta } from "@/lib/og";
import { COUNTY_BUDGET, pageUrl } from "@/lib/county-budget";
import { Sourced, fmtNum } from "@/components/sourced";
import { ReportLink } from "@/components/forms";

export const metadata: Metadata = pageMeta(
  "/budget",
  "County budget by year",
  "Medina County General Fund budget and actual spending by year, from the county's audited financial reports, each figure linked to its page.",
);

export default function BudgetPage() {
  const rows = COUNTY_BUDGET;
  if (!rows.length) return null;
  const usd = (n: number, r: (typeof rows)[number]) => <Sourced block value={fmtNum(n, "usd")} url={pageUrl(r)} verifiedAt={r.verifiedAt} />;
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">County budget by year</h1>
        <p className="mt-2 max-w-3xl text-[var(--muted)]">
          The General Fund is Medina County&apos;s main operating fund. Each year below shows what the county planned to spend
          (the final budget after changes during the year) and what it actually spent, on the budget basis used in the
          county&apos;s audited annual financial report.
        </p>
      </div>

      <section aria-labelledby="gf-heading" className="space-y-3">
        <h2 id="gf-heading" className="text-xl font-semibold">General Fund: final budget vs actual spending</h2>
        <div className="overflow-x-auto rounded-xl border border-[var(--royal)] bg-white">
          <table className="w-full min-w-[34rem] text-left text-sm">
            <thead className="bg-[var(--navy)] text-white">
              <tr>
                <th scope="col" className="px-3 py-2">Year</th>
                <th scope="col" className="px-3 py-2">Final budget</th>
                <th scope="col" className="px-3 py-2">Actual spending</th>
                <th scope="col" className="px-3 py-2">Under budget by</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.year} className="border-t border-slate-200 align-top">
                  <th scope="row" className="px-3 py-2 font-semibold">{r.year}</th>
                  <td className="px-3 py-2">{usd(r.finalExpenditures, r)}</td>
                  <td className="px-3 py-2">{usd(r.actualExpenditures, r)}</td>
                  <td className="px-3 py-2">{usd(r.finalExpenditures - r.actualExpenditures, r)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="rev-heading" className="space-y-3">
        <h2 id="rev-heading" className="text-xl font-semibold">General Fund: expected vs actual revenue</h2>
        <div className="overflow-x-auto rounded-xl border border-[var(--royal)] bg-white">
          <table className="w-full min-w-[26rem] text-left text-sm">
            <thead className="bg-[var(--navy)] text-white">
              <tr>
                <th scope="col" className="px-3 py-2">Year</th>
                <th scope="col" className="px-3 py-2">Final budgeted revenue</th>
                <th scope="col" className="px-3 py-2">Actual revenue</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.year} className="border-t border-slate-200 align-top">
                  <th scope="row" className="px-3 py-2 font-semibold">{r.year}</th>
                  <td className="px-3 py-2">{usd(r.finalRevenues, r)}</td>
                  <td className="px-3 py-2">{usd(r.actualRevenues, r)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="max-w-3xl space-y-2 text-sm text-[var(--muted)]">
        <h2 className="text-lg font-semibold text-[var(--navy)]">Sources and notes</h2>
        <p>
          Every figure links to the page of the county&apos;s audited annual financial report, as published by the Ohio
          Auditor of State, that shows the General Fund budget and actual statement for that year. &quot;Under budget by&quot;
          is the final budget minus actual spending, which equals the variance printed in each report.
        </p>
        <p>
          Spending here is on the county&apos;s budget basis and does not include transfers out to other funds or money the
          county collects and passes through to schools, townships and other governments. Years after 2024 will be added
          once their audited reports are published.
        </p>
        <ReportLink item="Budget: General Fund by year" />
      </section>
    </div>
  );
}
