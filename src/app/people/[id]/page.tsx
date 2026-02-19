"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { formatMoney } from "@/components/money-format";

interface PersonDetail {
  person: {
    id: number;
    displayName: string;
    type: string;
    department: string | null;
    title: string | null;
    notes: string | null;
  };
  aliases: Array<{ rawName: string; source: string }>;
  salaries: Array<{
    id: number;
    rawName: string;
    department: string | null;
    title: string | null;
    salary: number;
    year: number;
    source: string;
  }>;
  payments: Array<{
    id: number;
    vendorName: string;
    department: string | null;
    description: string | null;
    amount: number;
    checkNumber: string | null;
    fund: string | null;
  }>;
  donations: Array<{
    id: number;
    donorName: string;
    amount: number;
    date: string;
    type: string | null;
    campaignId: number | null;
    candidateName: string | null;
  }>;
  campaigns: Array<{
    id: number;
    candidateName: string;
    committeeName: string | null;
    office: string | null;
    party: string | null;
    year: number | null;
  }>;
  mentions: Array<{
    id: number;
    meetingId: number;
    rawName: string;
    context: string | null;
    meetingDate: string | null;
    meetingTitle: string | null;
  }>;
}

export default function PersonDetailPage() {
  const params = useParams();
  const [data, setData] = useState<PersonDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/people/${params.id}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <p className="text-[var(--muted)]">Loading...</p>;
  if (!data?.person) return <p className="text-[var(--muted)]">Person not found</p>;

  const { person, aliases, salaries, payments, donations, campaigns, mentions } = data;

  return (
    <div className="space-y-8">
      <div>
        <Link href="/people" className="text-sm text-[var(--accent)] hover:underline">
          &larr; People Directory
        </Link>
        <h1 className="mt-2 text-2xl font-bold">{person.displayName}</h1>
        <div className="mt-1 flex gap-3 text-sm text-[var(--muted)]">
          {person.title && <span>{person.title}</span>}
          {person.department && <span>{person.department}</span>}
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              person.type === "person"
                ? "bg-blue-100 text-blue-800"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            {person.type}
          </span>
        </div>
      </div>

      {aliases.length > 1 && (
        <div>
          <h2 className="text-sm font-medium text-[var(--muted)]">Also known as</h2>
          <div className="mt-1 flex flex-wrap gap-2">
            {aliases.map((a, i) => (
              <span key={i} className="rounded bg-gray-100 px-2 py-0.5 text-xs">
                {a.rawName}
                <span className="ml-1 text-[var(--muted)]">({a.source})</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Salary History */}
      {salaries.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Salary History</h2>
          <div className="overflow-x-auto rounded-lg border border-[var(--border)] bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-gray-50">
                  <th className="px-4 py-3 text-left font-medium text-[var(--muted)]">Year</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--muted)]">Title</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--muted)]">Department</th>
                  <th className="px-4 py-3 text-right font-medium text-[var(--muted)]">Salary</th>
                </tr>
              </thead>
              <tbody>
                {salaries.map((s) => (
                  <tr key={s.id} className="border-b border-[var(--border)] last:border-0">
                    <td className="px-4 py-3 font-medium">{s.year}</td>
                    <td className="px-4 py-3">{s.title}</td>
                    <td className="px-4 py-3">{s.department}</td>
                    <td className="px-4 py-3 text-right font-mono">{formatMoney(s.salary)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Vendor Payments */}
      {payments.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Vendor Payments Received</h2>
          <div className="overflow-x-auto rounded-lg border border-[var(--border)] bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-gray-50">
                  <th className="px-4 py-3 text-left font-medium text-[var(--muted)]">Description</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--muted)]">Department</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--muted)]">Fund</th>
                  <th className="px-4 py-3 text-right font-medium text-[var(--muted)]">Amount</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-[var(--border)] last:border-0">
                    <td className="px-4 py-3">{p.description}</td>
                    <td className="px-4 py-3">{p.department}</td>
                    <td className="px-4 py-3">{p.fund}</td>
                    <td className="px-4 py-3 text-right font-mono">{formatMoney(p.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Total:{" "}
            <span className="font-mono font-medium">
              {formatMoney(payments.reduce((sum, p) => sum + p.amount, 0))}
            </span>
          </p>
        </section>
      )}

      {/* Campaign Info */}
      {campaigns.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Campaign Committees</h2>
          <div className="space-y-2">
            {campaigns.map((c) => (
              <Link
                key={c.id}
                href={`/donations/campaigns/${c.id}`}
                className="block rounded-lg border border-[var(--border)] bg-white p-4 transition-shadow hover:shadow-md"
              >
                <p className="font-medium">{c.committeeName ?? c.candidateName}</p>
                <div className="mt-1 flex gap-3 text-sm text-[var(--muted)]">
                  {c.office && <span>{c.office}</span>}
                  {c.party && <span>{c.party}</span>}
                  {c.year && <span>{c.year}</span>}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Donations */}
      {donations.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Donations Made</h2>
          <div className="overflow-x-auto rounded-lg border border-[var(--border)] bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-gray-50">
                  <th className="px-4 py-3 text-left font-medium text-[var(--muted)]">Date</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--muted)]">Campaign</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--muted)]">Type</th>
                  <th className="px-4 py-3 text-right font-medium text-[var(--muted)]">Amount</th>
                </tr>
              </thead>
              <tbody>
                {donations.map((d) => (
                  <tr key={d.id} className="border-b border-[var(--border)] last:border-0">
                    <td className="px-4 py-3">{d.date}</td>
                    <td className="px-4 py-3">
                      {d.campaignId ? (
                        <Link
                          href={`/donations/campaigns/${d.campaignId}`}
                          className="text-[var(--accent)] hover:underline"
                        >
                          {d.candidateName ?? "Unknown campaign"}
                        </Link>
                      ) : (
                        d.donorName
                      )}
                    </td>
                    <td className="px-4 py-3">{d.type}</td>
                    <td className="px-4 py-3 text-right font-mono">{formatMoney(d.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Meeting Mentions */}
      {mentions.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Meeting Mentions</h2>
          <div className="space-y-2">
            {mentions.map((m) => (
              <Link
                key={m.id}
                href={`/meetings/${m.meetingId}`}
                className="block rounded-lg border border-[var(--border)] bg-white p-4 transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm">
                      {m.meetingTitle ?? `Meeting ${m.meetingDate ?? ""}`}
                    </p>
                    <p className="mt-1 text-sm text-[var(--muted)] line-clamp-2">
                      {m.context ?? `Mentioned as "${m.rawName}"`}
                    </p>
                  </div>
                  {m.meetingDate && (
                    <span className="flex-shrink-0 text-xs text-[var(--muted)]">
                      {m.meetingDate}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {salaries.length === 0 &&
        payments.length === 0 &&
        donations.length === 0 &&
        campaigns.length === 0 &&
        mentions.length === 0 && (
          <p className="text-[var(--muted)]">
            No additional data found for this person yet.
          </p>
        )}
    </div>
  );
}
