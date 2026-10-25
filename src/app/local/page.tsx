import type { Metadata } from "next";
import { getAgendas, getOfficials, getPopulation, getSources } from "@/lib/local-data";
import { LastUpdated, formatET } from "@/components/last-updated";
import { ReportLink } from "@/components/forms";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Local Government" };

const ORDER = ["Medina County", "City of Medina", "City of Brunswick", "City of Wadsworth"];
const COUNCILS = ["City of Medina", "City of Brunswick", "City of Wadsworth"];
const link = "text-[var(--royal)] underline";

export default function LocalPage() {
  const pop = getPopulation();
  const officials = getOfficials();
  const agendas = getAgendas(8);
  const sources = getSources();

  function SourceLink({ k }: { k: string }) {
    const s = sources.find((x) => x.key === k);
    if (!s) return null;
    return (
      <a href={s.url} target="_blank" rel="noopener noreferrer" className={`break-all text-xs ${link}`}>
        Source: {s.name}
      </a>
    );
  }

  const geos = ORDER.filter((g) => pop.some((p) => p.geography === g));
  const years = [...new Set(pop.map((p) => p.year))].sort();
  const juris = [...new Set(agendas.map((a) => a.jurisdiction))];

  return (
    <div className="space-y-12">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--gold-dark)]">Medina County, Ohio</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-[var(--navy)]">Local Government</h1>
        <p className="mt-2 max-w-2xl text-[var(--muted)]">
          Population, city councils, and recent meeting agendas, collected from official public sources and refreshed
          daily. Every section links to its source.
        </p>
        <div className="mt-2"><LastUpdated sources={sources.map((s) => s.key)} /></div>
      </div>

      {geos.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold">Population estimates</h2>
          <div className="mt-4 overflow-x-auto rounded-xl border border-[var(--royal)] bg-white">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="bg-[var(--accent-light)] text-left">
                <tr>
                  <th className="px-4 py-2">Place</th>
                  {years.map((y) => <th key={y} className="px-4 py-2 text-right">{y}</th>)}
                </tr>
              </thead>
              <tbody>
                {geos.map((g) => (
                  <tr key={g} className="border-t">
                    <td className="px-4 py-2 font-medium">{g}</td>
                    {years.map((y) => {
                      const v = pop.find((p) => p.geography === g && p.year === y);
                      return <td key={y} className="px-4 py-2 text-right tabular-nums">{v ? v.population.toLocaleString() : ""}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-[var(--muted)]">July 1 estimates (2020 is the April base) from the U.S. Census Bureau Population Estimates Program.</p>
          <div className="flex flex-col gap-1"><SourceLink k="census-county" /><SourceLink k="census-cities" /><ReportLink item="Local Government: population" /></div>
        </section>
      )}

      <section>
        <h2 className="text-2xl font-bold">City councils</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {COUNCILS.map((c) => {
            const list = officials.filter((o) => o.jurisdiction === c);
            return (
              <div key={c} className="rounded-xl border border-[var(--royal)] border-t-4 border-t-[var(--gold)] bg-white p-5">
                <h3 className="text-lg font-semibold text-[var(--navy)]">{c}</h3>
                {list.length ? (
                  <ul className="mt-3 space-y-2 text-sm">
                    {list.map((o) => (
                      <li key={o.name + o.role}>
                        <div className="font-medium">{o.name}</div>
                        <div className="text-xs text-[var(--muted)]">{o.role}{o.term ? `, ${o.term.toLowerCase()}` : ""}</div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-[var(--muted)]">Not loaded yet.</p>
                )}
                <div className="mt-3 flex flex-col gap-1">{list[0] && <SourceLink k={list[0].source_key} />}<ReportLink item={`Local Government: ${c} council`} /></div>
              </div>
            );
          })}
        </div>
      </section>

      {juris.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold">Recent agendas</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {juris.map((j) => {
              const list = agendas.filter((a) => a.jurisdiction === j);
              return (
                <div key={j} className="rounded-xl border border-[var(--royal)] bg-white p-5">
                  <h3 className="text-lg font-semibold text-[var(--navy)]">{j}</h3>
                  <ul className="mt-3 divide-y divide-[var(--border-soft)] text-sm">
                    {list.map((a) => (
                      <li key={a.url} className="py-2">
                        <a href={a.url} target="_blank" rel="noopener noreferrer" className="font-medium text-[var(--royal)] hover:underline">{a.title}</a>
                        <div className="text-xs text-[var(--muted)]">
                          {a.meeting_date ?? "Date not listed"}
                          {a.minutes_url && <> · <a href={a.minutes_url} target="_blank" rel="noopener noreferrer" className="underline">Minutes</a></>}
                        </div>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 flex flex-col gap-1"><SourceLink k={list[0]!.source_key} /><ReportLink item={`Local Government: ${j} agendas`} /></div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="rounded-xl border border-[var(--royal)] bg-[var(--accent-light)] p-5">
        <h2 className="text-xl font-bold">Elections</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          For candidates, issues and levies, and where to vote on November 3, go straight to the official sources.
        </p>
        <ul className="mt-3 space-y-1 text-sm">
          <li><a className={link} href="https://boe.ohio.gov/medina/" target="_blank" rel="noopener noreferrer">Medina County Board of Elections</a></li>
          <li><a className={link} href="https://www.ohiosos.gov/elections/" target="_blank" rel="noopener noreferrer">Ohio Secretary of State, Elections</a></li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold">Data sources and status</h2>
        <div className="mt-3 overflow-x-auto rounded-xl border border-[var(--royal)] bg-white">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-[var(--accent-light)] text-left">
              <tr><th className="px-4 py-2">Source</th><th className="px-4 py-2">Last success</th><th className="px-4 py-2">Status</th></tr>
            </thead>
            <tbody>
              {sources.map((s) => (
                <tr key={s.key} className="border-t align-top">
                  <td className="px-4 py-2"><a href={s.url} target="_blank" rel="noopener noreferrer" className={link}>{s.name}</a></td>
                  <td className="whitespace-nowrap px-4 py-2">{s.last_success ? formatET(s.last_success) : "Never"}</td>
                  <td className="px-4 py-2">
                    {s.last_error
                      ? <span className="text-red-700">Last attempt failed: {s.last_error}</span>
                      : <span className="text-green-700">OK, {s.record_count} records</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
