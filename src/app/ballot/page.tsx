import type { Metadata } from "next";
import { BALLOT, explain } from "@/lib/ballot";
import { BallotPicker } from "./picker";

export const metadata: Metadata = {
  title: "What's on my ballot",
  description: "Races and issues on the November 3, 2026 ballot in Medina County, Ohio, from the official sample ballots.",
};

export default function BallotPage() {
  const order = (j: string | null) => (j === "Liverpool Township" ? -1 : 0);
  const precincts = [...BALLOT.precincts].sort((a, b) => order(a.jurisdiction) - order(b.jurisdiction) || (a.jurisdiction ?? a.precinct).localeCompare(b.jurisdiction ?? b.precinct) || a.precinct.localeCompare(b.precinct));
  const withExplainers = precincts.map((p) => ({
    ...p,
    contests: p.contests.map((c) => (c.kind === "issue" ? { ...c, explainer: explain(c) } : c)),
  }));
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">What&apos;s on my ballot</h1>
        <p className="mt-2 max-w-3xl text-[var(--muted)]">
          General election, Tuesday, November 3, 2026. Pick your community to see the races and issues on its official
          sample ballot from the Medina County Board of Elections.
        </p>
        <div className="mt-4 max-w-3xl rounded-xl border border-[var(--gold)] bg-[var(--gold)]/10 p-4 text-sm">
          <p className="font-semibold">Informational only, not advice.</p>
          <p className="mt-1">
            OpenMedina does not endorse candidates or take positions on issues. Summaries are written from the official
            ballot wording; the official wording always controls. Ballots can differ by precinct because of school,
            library, ward and local option questions, so confirm your exact ballot with the{" "}
            <a href="https://lookup.boe.ohio.gov/vtrapp/medina/vtrlookup.aspx" target="_blank" rel="noopener noreferrer" className="text-[var(--royal)] underline">
              Board of Elections voter lookup
            </a>
            . Sample ballots copied on Oct 24, 2026.
          </p>
        </div>
      </div>
      <BallotPicker precincts={withExplainers} />
      <section className="max-w-3xl space-y-2 text-sm text-[var(--muted)]">
        <h2 className="text-lg font-semibold text-[var(--navy)]">Sources</h2>
        <p>
          Races, candidates and ballot wording come from each precinct&apos;s official sample ballot on the Medina County
          Board of Elections ballot display. Tax and bond issues were also checked against the Board&apos;s{" "}
          <a href="https://www.boe.ohio.gov/medina/c/upload/Election_QuestionsandIssues.pdf" target="_blank" rel="noopener noreferrer" className="text-[var(--royal)] underline">
            Questions and Issues list
          </a>{" "}
          certified August 17, 2026. Cost figures are the county auditor&apos;s estimates as printed on the ballot.
        </p>
        <p>
          The part of the City of Rittman in Medina County is not in the Medina County precinct list; its voters use the
          Wayne County Board of Elections. The August issues list included a Village of Gloria Glens Park levy, but the
          village&apos;s current official sample ballot does not include it.
        </p>
      </section>
    </div>
  );
}
