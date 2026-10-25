import type { Metadata } from "next";
import { pageMeta } from "@/lib/og";
import Link from "next/link";
import { StatCard } from "@/components/stat-card";
import { AskMedina } from "@/components/ask-medina";
import { Logo } from "@/components/logo";
import { MEDINA_FACTS } from "@/lib/site";
import { getOfficials, getPopulation, lastUpdated } from "@/lib/local-data";
import { formatET } from "@/components/last-updated";
import { ReportLink } from "@/components/forms";
import { liveSections } from "@/lib/sections";
import { Sourced, fmtNum } from "@/components/sourced";

export const dynamic = "force-dynamic";
export const metadata: Metadata = pageMeta(
  "/",
  "OpenMedina: Open government for Medina County, Ohio",
  "Ask a question about Medina County, Ohio government, see what is on your November 3 ballot, and explore official data, each figure linked to its source.",
);


export default function HomePage() {
  const pop = getPopulation();
  const latestYear = pop.length ? Math.max(...pop.map((p) => p.year)) : null;
  const popRow = (g: string) => pop.find((p) => p.geography === g && p.year === latestYear && p.source_url && p.verified_at);
  const officials = getOfficials();
  const hasLocal = pop.some((p) => p.source_url && p.verified_at);
  const localUpdated = lastUpdated({ sources: ["census-county", "census-cities", "medina-council", "brunswick-council", "wadsworth-council", "wadsworth-agendas", "medina-agendas"] });
  const facts = MEDINA_FACTS.filter((f) => f.label && f.detail);

  return (
    <div className="space-y-14">
      {/* Hero */}
      <section className="bg-sunburst relative left-1/2 -mt-6 w-screen -translate-x-1/2 border-b-4 border-[var(--gold)] text-white">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-8 [&>*]:min-w-0 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[1fr_1.3fr] lg:gap-12 lg:px-8 lg:py-16">
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <Logo size={140} className="rounded-3xl shadow-xl ring-2 ring-[var(--royal)] sm:h-[180px] sm:w-[180px]" />
            <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--gold)]">Medina County, Ohio</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-5xl">
              Your county, <span className="text-[var(--gold)]">in the open.</span>
            </h1>
            <p className="mt-4 max-w-md text-base leading-relaxed text-blue-100 sm:text-lg">
              From the historic Public Square in Medina to city halls in Brunswick and Wadsworth, ask a question and get
              linked straight to the official source.
            </p>
          </div>

          <div className="w-full min-w-0 max-w-full overflow-hidden rounded-2xl border-2 border-[var(--royal)] bg-white p-4 text-[var(--foreground)] shadow-2xl sm:p-6">
            <AskMedina />
          </div>
        </div>
      </section>

      {/* Facts slot: fill MEDINA_FACTS in src/lib/site.ts */}
      {facts.length > 0 && (
        <section aria-labelledby="facts-heading">
          <h2 id="facts-heading" className="text-2xl font-bold">About Medina County</h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {facts.map((f) => (
              <li key={f.label} className="rounded-xl border border-[var(--royal)] border-l-4 border-l-[var(--gold)] bg-white p-5">
                <p className="text-sm font-semibold text-[var(--royal)]">{f.label}</p>
                <p className="mt-1 text-slate-700">{f.detail}</p>
                {f.sourceUrl && (
                  <a href={f.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs text-[var(--muted)] underline">
                    Source
                  </a>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Explore */}
      <section aria-labelledby="explore-heading">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="explore-heading" className="text-2xl font-bold">Explore public records</h2>
            <p className="mt-1 text-[var(--muted)]">Every section here is built from official public records.</p>
          </div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {liveSections().filter((s) => s.title).map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="group rounded-xl border border-[var(--royal)] bg-white p-6 transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              <span className="mb-3 block h-1 w-10 rounded bg-[var(--gold)] transition-all group-hover:w-16" aria-hidden />
              <h3 className="text-lg font-semibold text-[var(--navy)]">{s.title}</h3>
              <p className="mt-1 text-sm text-[var(--muted)]">{s.body}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Live local data from official sources */}
      {hasLocal && (
        <section aria-labelledby="numbers-heading">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <h2 id="numbers-heading" className="text-2xl font-bold">By the numbers</h2>
            {localUpdated && <p className="text-xs text-[var(--muted)]">Last updated {formatET(localUpdated)}</p>}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {["Medina County", "City of Medina", "City of Brunswick", "City of Wadsworth"].map((g) => {
              const row = popRow(g);
              if (!row) return null;
              const v = <Sourced block value={fmtNum(row.population)} url={row.source_url} verifiedAt={row.verified_at} />;
              return <StatCard key={g} label={g === "Medina County" ? "Medina County population" : g} value={v} sub={`Census estimate, ${latestYear}`} />;
            })}
          </div>
          <p className="mt-3 text-sm">
            <a href="/local" className="font-semibold text-[var(--royal)] underline">See local government data and sources</a>
          </p>
          <ReportLink item="Home: By the numbers" />
        </section>
      )}

    </div>
  );
}
