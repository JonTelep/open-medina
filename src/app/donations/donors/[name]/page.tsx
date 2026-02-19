"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { formatMoney } from "@/components/money-format";

interface DonorData {
  donorName: string;
  totalAmount: number;
  donationCount: number;
  donations: Array<{
    id: number;
    campaignId: number;
    candidateName: string;
    office: string | null;
    year: number | null;
    amount: number;
    date: string;
    type: string | null;
    donorAddress: string | null;
    donorCity: string | null;
    donorState: string | null;
    donorEmployer: string | null;
    donorOccupation: string | null;
  }>;
}

export default function DonorDetailPage() {
  const params = useParams();
  const [data, setData] = useState<DonorData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/donations/donors/${encodeURIComponent(params.name as string)}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [params.name]);

  if (loading) return <p className="text-[var(--muted)]">Loading...</p>;
  if (!data?.donations?.length) return <p className="text-[var(--muted)]">Donor not found</p>;

  const { donorName, totalAmount, donations } = data;
  const firstDonation = donations[0]!;

  // Group by campaign
  const byCampaign = new Map<number, { candidateName: string; office: string | null; year: number | null; total: number; count: number }>();
  for (const d of donations) {
    const existing = byCampaign.get(d.campaignId);
    if (existing) {
      existing.total += d.amount;
      existing.count++;
    } else {
      byCampaign.set(d.campaignId, {
        candidateName: d.candidateName,
        office: d.office,
        year: d.year,
        total: d.amount,
        count: 1,
      });
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/donations"
          className="text-sm text-[var(--accent)] hover:underline"
        >
          &larr; Campaign Finance
        </Link>
        <h1 className="mt-2 text-2xl font-bold">{donorName}</h1>
        <div className="mt-1 flex flex-wrap gap-3 text-sm text-[var(--muted)]">
          {firstDonation.donorCity && firstDonation.donorState && (
            <span>{firstDonation.donorCity}, {firstDonation.donorState}</span>
          )}
          {firstDonation.donorEmployer && <span>{firstDonation.donorEmployer}</span>}
          {firstDonation.donorOccupation && <span>{firstDonation.donorOccupation}</span>}
        </div>
        <p className="mt-2 text-lg">
          Total donated: <span className="font-mono font-semibold">{formatMoney(totalAmount)}</span>
          {" across "}
          {byCampaign.size} campaign{byCampaign.size !== 1 ? "s" : ""}
        </p>
      </div>

      {/* By Campaign Summary */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Campaigns Supported</h2>
        <div className="space-y-2">
          {Array.from(byCampaign.entries()).map(([campaignId, c]) => (
            <Link
              key={campaignId}
              href={`/donations/campaigns/${campaignId}`}
              className="block rounded-lg border border-[var(--border)] bg-white p-4 transition-shadow hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{c.candidateName}</p>
                  <p className="text-sm text-[var(--muted)]">
                    {[c.office, c.year].filter(Boolean).join(" — ")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono font-semibold">{formatMoney(c.total)}</p>
                  <p className="text-xs text-[var(--muted)]">
                    {c.count} donation{c.count !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* All Donations */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">All Donations ({donations.length})</h2>
        <div className="overflow-x-auto rounded-lg border border-[var(--border)] bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-gray-50">
                <th className="px-4 py-3 text-left font-medium text-[var(--muted)]">Date</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--muted)]">Candidate</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--muted)]">Office</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--muted)]">Type</th>
                <th className="px-4 py-3 text-right font-medium text-[var(--muted)]">Amount</th>
              </tr>
            </thead>
            <tbody>
              {donations.map((d) => (
                <tr key={d.id} className="border-b border-[var(--border)] last:border-0">
                  <td className="px-4 py-3">{d.date}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/donations/campaigns/${d.campaignId}`}
                      className="text-[var(--accent)] hover:underline"
                    >
                      {d.candidateName}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{d.office}</td>
                  <td className="px-4 py-3">{d.type}</td>
                  <td className="px-4 py-3 text-right font-mono">{formatMoney(d.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
