"use client";

import { useMemo, useState } from "react";
import type { Explainer, Issue, Precinct, Race } from "@/lib/ballot";
import { ReportLink } from "@/components/forms";
import { Sourced } from "@/components/sourced";

type P = Omit<Precinct, "contests"> & { contests: (Race | (Issue & { explainer: Explainer }))[] };

const label = (p: P) => p.jurisdiction ?? `Precinct ${p.precinct}`;

export function BallotPicker({ precincts, verifiedAt, initialGroup }: { precincts: P[]; verifiedAt: string; initialGroup?: string }) {
  const groups = useMemo(() => [...new Set(precincts.map(label))], [precincts]);
  const [group, setGroup] = useState(initialGroup && groups.includes(initialGroup) ? initialGroup : groups[0]!);
  const inGroup = precincts.filter((p) => label(p) === group);
  const [code, setCode] = useState(inGroup[0]!.code);
  const p = inGroup.find((x) => x.code === code) ?? inGroup[0]!;
  const races = p.contests.filter((c): c is Race => c.kind === "race");
  const issues = p.contests.filter((c): c is Issue & { explainer: Explainer } => c.kind === "issue");

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex min-w-0 flex-col text-sm font-medium">
          Community
          <select
            className="mt-1 rounded-lg border border-[var(--royal)] bg-white px-3 py-2"
            value={group}
            onChange={(e) => {
              setGroup(e.target.value);
              setCode(precincts.find((x) => label(x) === e.target.value)!.code);
            }}
          >
            {groups.map((g) => (
              <option key={g} value={g}>
                {g === "Liverpool Township" ? "Liverpool Township (Valley City)" : g}
              </option>
            ))}
          </select>
        </label>
        {inGroup.length > 1 && (
          <label className="flex min-w-0 flex-col text-sm font-medium">
            Precinct
            <select className="mt-1 rounded-lg border border-[var(--royal)] bg-white px-3 py-2" value={p.code} onChange={(e) => setCode(e.target.value)}>
              {inGroup.map((x) => (
                <option key={x.code} value={x.code}>
                  {x.precinct}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <p className="text-sm text-[var(--muted)]">
        Showing the official sample ballot for precinct <strong>{p.precinct}</strong>.{" "}
        <a href={p.pdf} target="_blank" rel="noopener noreferrer" className="text-[var(--royal)] underline">
          Official sample ballot (PDF)
        </a>
        {inGroup.length === 1 && " Other precincts in this community may have additional school, library, ward or local option questions."}
      </p>

      <section>
        <h2 className="text-2xl font-bold">Issues</h2>
        <div className="mt-4 space-y-4">
          {issues.map((c, i) => (
            <article key={i} className="min-w-0 rounded-xl border border-[var(--royal)] border-t-4 border-t-[var(--gold)] bg-white p-4">
              <h3 className="font-semibold text-[var(--navy)]">{c.heading.filter((h) => !/^A majority/i.test(h)).slice(0, 3).join(": ")}</h3>
              <Sourced
                block
                url={p.pdf}
                verifiedAt={verifiedAt}
                value={
                  <>
              <dl className="mt-3 space-y-2 text-sm">
                <div><dt className="font-medium">What it does</dt><dd>{c.explainer.what}</dd></div>
                {c.explainer.cost && <div><dt className="font-medium">Cost</dt><dd>{c.explainer.cost}</dd></div>}
                {c.explainer.newOrRenewal && <div><dt className="font-medium">New tax or renewal</dt><dd>{c.explainer.newOrRenewal}</dd></div>}
                <div><dt className="font-medium">What your vote means</dt><dd>{c.explainer.yesNo}</dd></div>
              </dl>
              <details className="mt-3 text-sm">
                <summary className="cursor-pointer text-[var(--royal)] underline">Official ballot wording</summary>
                <div className="mt-2 space-y-2 border-l-2 border-[var(--gold)] pl-3">
                  {c.heading.filter((h) => !/^A majority/i.test(h)).slice(3).concat(c.heading.filter((h) => /^A majority/i.test(h))).map((t, k) => <p key={`h${k}`}>{t}</p>)}
                  {c.text.map((t, k) => <p key={k} className="whitespace-pre-line">{t}</p>)}
                  <p className="text-xs text-[var(--muted)]">Choices: {c.choices.join(" / ")}</p>
                </div>
              </details>
                  </>
                }
              />
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                <a href={p.source} target="_blank" rel="noopener noreferrer" className="text-[var(--royal)] underline">Ballot display page</a>
                <ReportLink item={`Ballot: ${p.precinct}: ${c.heading[0]}`} />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold">Races</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">Candidates are listed in the order they appear on this precinct&apos;s ballot.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {races.map((r, i) => (
            <article key={i} className="min-w-0 rounded-xl border border-[var(--royal)] bg-white p-4">
              <h3 className="font-semibold text-[var(--navy)]">{r.office.replace(/^For /, "")}</h3>
              <Sourced
                block
                url={p.pdf}
                verifiedAt={verifiedAt}
                value={
                  <>
                    {r.voteFor && <p className="text-xs text-[var(--muted)]">{r.voteFor.replace(/[()]/g, "")}</p>}
                    <ul className="mt-2 space-y-1 text-sm">
                      {r.candidates.map((c) => <li key={c.name}>{c.name}</li>)}
                      {r.writeIn && <li className="text-[var(--muted)]">Write-in line</li>}
                    </ul>
                  </>
                }
              />
              <div className="mt-2"><ReportLink item={`Ballot: ${p.precinct}: ${r.office}`} /></div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
