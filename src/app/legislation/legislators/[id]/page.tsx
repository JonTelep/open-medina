import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLegislatorById, getLegislatorSponsoredBills, getLegislatorVotingRecord } from "@/db/queries/legislation";
import { ReportLink } from "@/components/forms";

export const dynamic = "force-dynamic";
const link = "text-[var(--royal)] underline";

async function load(params: Promise<{ id: string }>) {
  const id = Number((await params).id);
  return Number.isInteger(id) ? getLegislatorById(id) : undefined;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const l = await load(params);
  return l ? { title: l.name } : {};
}

export default async function LegislatorPage({ params }: { params: Promise<{ id: string }> }) {
  const l = await load(params);
  if (!l) notFound();
  const sponsored = getLegislatorSponsoredBills(l.id);
  const votes = getLegislatorVotingRecord(l.id, { limit: 50 });
  return (
    <div className="space-y-8">
      <Link href="/legislation" className={`text-sm ${link}`}>State Legislation</Link>
      <div>
        <h1 className="text-2xl font-bold">{l.name}</h1>
        <p className="text-[var(--muted)]">{l.party}, Ohio {l.chamber === "Senate" ? "Senate District" : "House District"} {l.district}</p>
        {l.bioUrl && <a href={l.bioUrl} target="_blank" rel="noopener noreferrer" className={`text-sm ${link}`}>Official legislator page</a>}
      </div>
      {sponsored.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold">Bills sponsored</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {sponsored.map((b) => (
              <li key={b.sponsorId}><Link href={`/legislation/bills/${b.billId}`} className={`font-mono ${link}`}>{b.billNumber}</Link> {b.title} <span className="text-xs text-[var(--muted)]">{b.type}</span></li>
            ))}
          </ul>
        </section>
      )}
      {votes.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold">Recent votes</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {votes.map((v) => (
              <li key={v.voteId}>
                {v.rollCallDate}: <strong>{v.vote === "nv" ? "not voting" : v.vote}</strong> on{" "}
                <Link href={`/legislation/bills/${v.billId}`} className={`font-mono ${link}`}>{v.billNumber}</Link>, {v.rollCallDescription}
              </li>
            ))}
          </ul>
        </section>
      )}
      <ReportLink item={`Legislation: ${l.name}`} />
    </div>
  );
}
