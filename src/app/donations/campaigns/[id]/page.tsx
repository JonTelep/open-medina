"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { formatMoney } from "@/components/money-format";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface CampaignDetail {
  campaign: {
    id: number;
    personId: number | null;
    candidateName: string;
    committeeName: string | null;
    office: string | null;
    party: string | null;
    year: number | null;
  };
  donations: Array<{
    id: number;
    rawDonorName: string;
    donorAddress: string | null;
    donorCity: string | null;
    donorState: string | null;
    donorEmployer: string | null;
    donorOccupation: string | null;
    amount: number;
    date: string;
    type: string | null;
  }>;
  donorBreakdown: Array<{
    donorName: string;
    totalAmount: number;
    donationCount: number;
  }>;
}

export default function CampaignDetailPage() {
  const params = useParams();
  const [data, setData] = useState<CampaignDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/donations/campaigns/${params.id}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <p className="text-[var(--muted)]">Loading...</p>;
  if (!data?.campaign) return <p className="text-[var(--muted)]">Campaign not found</p>;

  const { campaign, donations, donorBreakdown } = data;
  const totalRaised = donations.reduce((sum, d) => sum + d.amount, 0);

  const chartData = donorBreakdown.slice(0, 15).map((d) => ({
    name: d.donorName.length > 25 ? d.donorName.slice(0, 23) + "..." : d.donorName,
    fullName: d.donorName,
    amount: Math.round(d.totalAmount * 100) / 100,
  }));

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/donations"
          className="text-sm text-[var(--accent)] hover:underline"
        >
          &larr; Campaign Finance
        </Link>
        <h1 className="mt-2 text-2xl font-bold">{campaign.candidateName}</h1>
        <div className="mt-1 flex flex-wrap gap-3 text-sm text-[var(--muted)]">
          {campaign.committeeName && <span>{campaign.committeeName}</span>}
          {campaign.office && <span>{campaign.office}</span>}
          {campaign.party && <span>{campaign.party}</span>}
          {campaign.year && <span>{campaign.year}</span>}
        </div>
        <p className="mt-2 text-lg">
          Total raised: <span className="font-mono font-semibold">{formatMoney(totalRaised)}</span>
          {" from "}
          {donorBreakdown.length} donor{donorBreakdown.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Donor Breakdown Chart */}
      {chartData.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Top Donors</h2>
          <div className="rounded-lg border border-[var(--border)] bg-white p-4">
            <ResponsiveContainer width="100%" height={Math.max(300, chartData.length * 35)}>
              <BarChart data={chartData} layout="vertical" margin={{ left: 160 }}>
                <XAxis
                  type="number"
                  tickFormatter={(v: number) => formatMoney(v)}
                />
                <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 12 }} />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <Tooltip
                  formatter={(value: any) => formatMoney(Number(value))}
                  labelFormatter={(label: any) => {
                    const item = chartData.find((d) => d.name === label);
                    return item?.fullName ?? label;
                  }}
                />
                <Bar dataKey="amount" fill="#dc2626" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* Full Donations Table */}
      {donations.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">All Donations ({donations.length})</h2>
          <div className="overflow-x-auto rounded-lg border border-[var(--border)] bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-gray-50">
                  <th className="px-4 py-3 text-left font-medium text-[var(--muted)]">Date</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--muted)]">Donor</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--muted)]">Location</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--muted)]">Employer</th>
                  <th className="px-4 py-3 text-right font-medium text-[var(--muted)]">Amount</th>
                </tr>
              </thead>
              <tbody>
                {donations.map((d) => (
                  <tr key={d.id} className="border-b border-[var(--border)] last:border-0">
                    <td className="px-4 py-3">{d.date}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/donations/donors/${encodeURIComponent(d.rawDonorName)}`}
                        className="text-[var(--accent)] hover:underline"
                      >
                        {d.rawDonorName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[var(--muted)]">
                      {[d.donorCity, d.donorState].filter(Boolean).join(", ")}
                    </td>
                    <td className="px-4 py-3 text-[var(--muted)]">{d.donorEmployer}</td>
                    <td className="px-4 py-3 text-right font-mono">{formatMoney(d.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
