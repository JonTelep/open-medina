import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBillWithDetails } from "@/db/queries/legislation";
import { legiscanRollCallUrl, ohioBillUrl } from "@/lib/legis-links";
import { Sourced, fmtNum, formatVerified } from "@/components/sourced";
import { ReportLink } from "@/components/forms";

export const dynamic = "force-dynamic";
const link = "text-[var(--royal)] underline";

async function load(params: Promise<{ id: string }>) {
  const id = Number((await params).id);
  return Number.isInteger(id) ? getBillWithDetails(id) : null;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const d = await load(params);
  return d ? { title: `${d.bill.billNumber}: ${d.bill.title}` } : {};
}

export default async function BillPage({ params }: { params: Promise<{ id: string }> }) {
  const d = await load(params);
  if (!d) notFound();
  const { bill, sponsors, rollCalls } = d;
  const ohio = ohioBillUrl(bill.billNumber);
  return (
    <div className="space-y-8">
      <Link href="/legislation#bills" className={`text-sm ${link}`}>All bills</Link>
      <div>
        <p className="font-mono text-sm font-semibold text-[var(--accent)]">{bill.billNumber}</p>
        <h1 className="mt-1 text-2xl font-bold">{bill.title}</h1>
        {bill.description && bill.description !== bill.title && <p className="mt-2 text-[var(--muted)]">{bill.description}</p>}
        <p className="mt-2 text-sm">
          {bill.statusLabel && <span className="mr-2 rounded-full bg-[var(--accent-light)] px-2 py-0.5 text-xs font-medium">{bill.statusLabel}</span>}
          {bill.lastAction && <>Last action {bill.lastActionDate}: {bill.lastAction}</>}
        </p>
        <p className="mt-2 flex flex-wrap gap-x-4 text-sm">
          {bill.url && <a href={bill.url} target="_blank" rel="noopener noreferrer" className={link}>LegiScan bill page</a>}
          {ohio && <a href={ohio} target="_blank" rel="noopener noreferrer" className={link}>Official bill page, legislature.ohio.gov</a>}
          <span className="text-xs text-[var(--muted)]">verified {formatVerified(bill.updatedAt)}</span>
        </p>
      </div>

      {sponsors.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold">Medina County sponsors</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {sponsors.map((s) => (
              <li key={s.id}><Link href={`/legislation/legislators/${s.legislatorId}`} className={link}>{s.legislatorName}</Link> <span className="text-[var(--muted)]">{s.type}</span></li>
            ))}
          </ul>
        </section>
      )}

      {rollCalls.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold">Roll call votes</h2>
          <ul className="mt-3 space-y-3">
            {rollCalls.map((rc) => (
              <li key={rc.id} className="min-w-0 rounded-lg border border-[var(--border)] bg-white p-4 text-sm">
                <p className="font-medium">{rc.date}, {rc.chamber}: {rc.description} {rc.passed ? "(passed)" : "(failed)"}</p>
                <Sourced
                  block
                  className="mt-1"
                  url={legiscanRollCallUrl(bill.billNumber, rc.legiscanRollCallId)}
                  verifiedAt={bill.updatedAt}
                  value={<span className="tabular-nums">Yea {fmtNum(rc.yea ?? 0)}, Nay {fmtNum(rc.nay ?? 0)}, Not voting {fmtNum(rc.nv ?? 0)}, Absent {fmtNum(rc.absent ?? 0)}</span>}
                />
                {rc.legislatorVotes.length > 0 && (
                  <ul className="mt-2 flex flex-wrap gap-x-4 text-xs">
                    {rc.legislatorVotes.map((v) => <li key={v.legislatorId}>{v.legislatorName}: <strong>{v.vote === "nv" ? "not voting" : v.vote}</strong></li>)}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
      <ReportLink item={`Legislation: ${bill.billNumber}`} />
    </div>
  );
}
