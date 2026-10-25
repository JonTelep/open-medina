import type { Metadata } from "next";
import { pageMeta } from "@/lib/og";
import Link from "next/link";
import { getBills, getLegislators } from "@/db/queries/legislation";
import { ohioBillUrl } from "@/lib/legis-links";
import { formatVerified } from "@/components/sourced";
import { NewsletterCta } from "@/components/newsletter-cta";

export const dynamic = "force-dynamic";
export const metadata: Metadata = pageMeta(
  "/legislation",
  "State Legislation",
  "Ohio bills sponsored by Medina County's state legislators or that mention Medina County, each linked to LegiScan and legislature.ohio.gov.",
  "/og-legislation.png",
);

const PER_PAGE = 25;
const STATUSES: [string, string][] = [["1", "Introduced"], ["2", "Engrossed"], ["3", "Enrolled"], ["4", "Passed"], ["5", "Vetoed"], ["6", "Dead"]];
const link = "text-[var(--royal)] underline";

export default async function LegislationPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const search = sp.search?.slice(0, 100) || undefined;
  const chamber = sp.chamber === "House" || sp.chamber === "Senate" ? sp.chamber : undefined;
  const status = sp.status && /^[1-6]$/.test(sp.status) ? Number(sp.status) : undefined;
  const page = Math.min(Math.max(parseInt(sp.page ?? "1", 10) || 1, 1), 100);
  const rows = getBills({ search, chamber, status, limit: PER_PAGE + 1, offset: (page - 1) * PER_PAGE });
  const list = rows.slice(0, PER_PAGE);
  const hasNext = rows.length > PER_PAGE;
  const legs = getLegislators();
  const qs = (p: number) => {
    const u = new URLSearchParams();
    if (search) u.set("search", search);
    if (chamber) u.set("chamber", chamber);
    if (status) u.set("status", String(status));
    u.set("page", String(p));
    return `/legislation?${u}#bills`;
  };

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold">State Legislation</h1>
      </div>

      {legs.length > 0 && (
        <section>
          <h2 className="mb-3 text-xl font-semibold">Medina County&apos;s state legislators</h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {legs.map((l) => (
              <li key={l.id} className="rounded-lg border border-[var(--royal)] bg-white p-4">
                <Link href={`/legislation/legislators/${l.id}`} className="font-semibold text-[var(--navy)] hover:underline">{l.name}</Link>
                <p className="text-sm text-[var(--muted)]">{l.party}, Ohio {l.chamber === "Senate" ? "Senate District" : "House District"} {l.district}</p>
                {l.bioUrl && <a href={l.bioUrl} target="_blank" rel="noopener noreferrer" className={`text-xs ${link}`}>Official page</a>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section id="bills" className="space-y-4">
        <h2 className="text-xl font-semibold">Bills</h2>
        <form method="get" action="/legislation#bills" className="flex flex-wrap items-end gap-3">
          <label className="flex min-w-0 flex-1 flex-col text-xs font-medium text-[var(--muted)]">
            Search
            <input name="search" defaultValue={search} placeholder="Bill number or topic" className="mt-1 min-w-0 rounded-md border border-[var(--border)] px-3 py-2 text-sm text-[var(--foreground)]" />
          </label>
          <label className="flex flex-col text-xs font-medium text-[var(--muted)]">
            Chamber
            <select name="chamber" defaultValue={chamber ?? ""} className="mt-1 rounded-md border border-[var(--border)] px-3 py-2 text-sm text-[var(--foreground)]">
              <option value="">All</option><option>House</option><option>Senate</option>
            </select>
          </label>
          <label className="flex flex-col text-xs font-medium text-[var(--muted)]">
            Status
            <select name="status" defaultValue={status ? String(status) : ""} className="mt-1 rounded-md border border-[var(--border)] px-3 py-2 text-sm text-[var(--foreground)]">
              <option value="">All</option>
              {STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
          <button className="rounded-md bg-[var(--royal)] px-4 py-2 text-sm font-medium text-white">Filter</button>
        </form>

        {list.length === 0 ? (
          <p className="text-[var(--muted)]">No bills match those filters.</p>
        ) : (
          <ul className="space-y-2">
            {list.map((b) => (
              <li key={b.id} className="min-w-0 rounded-lg border border-[var(--border)] bg-white p-4">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <Link href={`/legislation/bills/${b.id}`} className="font-mono font-semibold text-[var(--accent)] hover:underline">{b.billNumber}</Link>
                  {b.statusLabel && <span className="rounded-full bg-[var(--accent-light)] px-2 py-0.5 text-xs font-medium">{b.statusLabel}</span>}
                  <span className="text-xs text-[var(--muted)]">{b.chamber}</span>
                </div>
                <p className="mt-1 break-words">{b.title}</p>
                {b.lastAction && <p className="mt-1 text-xs text-[var(--muted)]">Last action {b.lastActionDate}: {b.lastAction}</p>}
                <p className="mt-1 flex flex-wrap gap-x-3 text-xs">
                  {b.url && <a href={b.url} target="_blank" rel="noopener noreferrer" className={link}>LegiScan</a>}
                  {ohioBillUrl(b.billNumber) && <a href={ohioBillUrl(b.billNumber)!} target="_blank" rel="noopener noreferrer" className={link}>legislature.ohio.gov</a>}
                  <span className="text-[var(--muted)]">verified {formatVerified(b.updatedAt)}</span>
                </p>
              </li>
            ))}
          </ul>
        )}
        <nav aria-label="Pages" className="flex gap-4 text-sm">
          {page > 1 && <Link href={qs(page - 1)} className={link}>Previous</Link>}
          {hasNext && <Link href={qs(page + 1)} className={link}>Next</Link>}
        </nav>
      </section>

      <NewsletterCta />
    </div>
  );
}
