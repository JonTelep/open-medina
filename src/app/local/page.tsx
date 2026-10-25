import type { Metadata } from "next";
import { pageMeta } from "@/lib/og";
import { getAcs, getAgendas, getJurisdictions, getOfficials, getPopulation, getSources } from "@/lib/local-data";
import { LastUpdated, formatET } from "@/components/last-updated";
import { ReportLink } from "@/components/forms";
import { Sourced, fmtNum } from "@/components/sourced";
import { NewsletterCta } from "@/components/newsletter-cta";

export const dynamic = "force-dynamic";
export const metadata: Metadata = pageMeta(
  "/local",
  "Local Government",
  "Every city, village and township in Medina County, Ohio: Census data and elected officials, each linked to its official source.",
  "/og-local.png",
);

const ORDER = ["Medina County", "City of Medina", "City of Brunswick", "City of Wadsworth"];
const COUNCILS = ["City of Medina", "City of Brunswick", "City of Wadsworth"];
const link = "text-[var(--royal)] underline";
function fmtDay(d: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  return new Date(d + "T12:00:00-04:00").toLocaleDateString("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", year: "numeric" }); // sourced-ok: date
}
const CITY_SITES: Record<string, string> = {
  "City of Medina": "https://medinaoh.org/",
  "City of Brunswick": "https://brunswick.oh.us/",
  "City of Wadsworth": "https://wadsworthcity.com/",
  "City of Rittman": "https://www.rittman.com/",
};

export default function LocalPage() {
  const pop = getPopulation();
  const officials = getOfficials();
  const agendas = getAgendas(8);
  const sources = getSources();
  const acs = getAcs();
  const juris2 = getJurisdictions();
  const dirOfficials = officials.filter((o) => o.source_key === "county-directory");
  const measures = [...new Set(acs.map((a) => a.measure))];
  const fmt = (m: string, v: number) => fmtNum(v, m.includes("rate") || m.includes("degree") ? "pct" : "usd");

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
                      return <td key={y} className="px-4 py-2 text-right tabular-nums">{v && <Sourced block value={fmtNum(v.population)} url={v.source_url} verifiedAt={v.verified_at} />}</td>;
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

      {acs.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold">Income, housing and education</h2>
          <div className="mt-4 overflow-x-auto rounded-xl border border-[var(--royal)] bg-white">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="bg-[var(--accent-light)] text-left">
                <tr>
                  <th className="px-4 py-2">Measure</th>
                  {ORDER.map((g) => <th key={g} className="px-4 py-2 text-right">{g}</th>)}
                </tr>
              </thead>
              <tbody>
                {measures.map((m) => (
                  <tr key={m} className="border-t">
                    <td className="px-4 py-2 font-medium">{m}</td>
                    {ORDER.map((g) => {
                      const v = acs.find((a) => a.geography === g && a.measure === m);
                      return (
                        <td key={g} className="px-4 py-2 text-right tabular-nums">
                          {v && (
                            <Sourced
                              block
                              value={<>{fmt(m, v.value)}<span className="block text-[10px] text-[var(--muted)]">± {fmt(m, v.moe)}</span></>}
                              url={v.source_url}
                              verifiedAt={v.verified_at}
                            />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-[var(--muted)]">
            American Community Survey 5-year estimates, 2020 to 2024. The small number under each value is the margin of
            error at 90 percent confidence. Variables: B19013, B25077, S1701, S1501.
          </p>
          <div className="flex flex-col gap-1"><SourceLink k="census-acs" /><ReportLink item="Local Government: ACS estimates" /></div>
        </section>
      )}

      {juris2.length > 0 && (
        <section id="communities">
          <h2 className="text-2xl font-bold">Every city, village and township</h2>
          <p className="mt-1 max-w-3xl text-sm text-[var(--muted)]">
            Every city, village and township in Medina County, including the part of Rittman in the county. Elected officials
            are from the county&apos;s official Public Officials Directory. Populations are Census estimates for July 1, {juris2[0]!.pop_year}.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {juris2.map((j, i) => {
              const people = dirOfficials.filter((o) => o.jurisdiction === j.name);
              return (
                <details key={j.name} open={i === 0} className="group min-w-0 rounded-xl border border-[var(--royal)] bg-white p-4 open:border-t-4 open:border-t-[var(--gold)]">
                  <summary className="cursor-pointer list-none">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-semibold text-[var(--navy)]">{j.name}{j.name === "Liverpool Township" ? " (Valley City)" : ""}</span>
                      {j.population != null && <Sourced block className="shrink-0 text-right text-sm tabular-nums" value={`${fmtNum(j.population)} people`} url={j.source_url} verifiedAt={j.verified_at} />}
                    </div>
                    <span className="text-xs text-[var(--muted)]"><span className="capitalize">{j.kind}</span><span className="text-[var(--royal)] group-open:hidden"> · Show officials and links ›</span></span>
                  </summary>
                  {j.pop_note && <p className="mt-2 text-xs text-[var(--muted)]">{j.pop_note}</p>}
                  {people.length > 0 && (
                    <ul className="mt-3 space-y-1 text-sm">
                      {people.map((o) => (
                        <li key={o.role + o.name} className="flex flex-wrap justify-between gap-x-2">
                          <span className="font-medium">{o.name}</span>
                          <span className="text-xs text-[var(--muted)]">{o.role}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {COUNCILS.includes(j.name) && officials.some((o) => o.jurisdiction === j.name && o.source_key !== "county-directory") && (
                    <p className="mt-3 text-sm"><a href="#councils" className={link}>See the {j.name.replace("City of ", "")} City Council members</a></p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                    {(j.website ?? CITY_SITES[j.name]) && <a href={(j.website ?? CITY_SITES[j.name])!} target="_blank" rel="noopener noreferrer" className={link}>Official website</a>}
                    <ReportLink item={`Local Government: ${j.name}`} />
                  </div>
                </details>
              );
            })}
          </div>
          <div className="mt-2 flex flex-col gap-1">
            <SourceLink k="county-directory" />
            <a href="https://www2.census.gov/programs-surveys/popest/datasets/2020-2025/cities/totals/sub-est2025.csv" target="_blank" rel="noopener noreferrer" className={`break-all text-xs ${link}`}>Source: U.S. Census Bureau subcounty population estimates</a>
          </div>
        </section>
      )}

      <NewsletterCta />

      <section id="councils">
        <h2 className="text-2xl font-bold">City councils</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {COUNCILS.map((c) => {
            const list = officials.filter((o) => o.jurisdiction === c && o.source_key !== "county-directory");
            if (!list.length) return null;
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
                          {a.meeting_date ? fmtDay(a.meeting_date) : "Date not listed"}
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
              {sources.filter((s) => s.last_success).map((s) => (
                <tr key={s.key} className="border-t align-top">
                  <td className="px-4 py-2"><a href={s.url} target="_blank" rel="noopener noreferrer" className={link}>{s.name}</a></td>
                  <td className="whitespace-nowrap px-4 py-2">{formatET(s.last_success!)}</td>
                  <td className="px-4 py-2">
                    {s.last_error
                      ? <span className="text-amber-800">Could not reach on the latest check; showing the last successful copy</span>
                      : <span className="text-green-700">OK</span>}
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
