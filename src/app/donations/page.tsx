"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatMoney } from "@/components/money-format";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface DonationsData {
  campaigns: Array<{
    id: number;
    candidateName: string;
    committeeName: string | null;
    office: string | null;
    party: string | null;
    year: number | null;
    totalRaised: number;
    donorCount: number;
  }>;
  topDonors: Array<{
    donorName: string;
    totalAmount: number;
    donationCount: number;
    campaignCount: number;
  }>;
  timeline: Array<{
    month: string;
    totalAmount: number;
    donationCount: number;
  }>;
  totalAmount: number;
  totalCampaigns: number;
  totalDonations: number;
}

export default function DonationsPage() {
  const [data, setData] = useState<DonationsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/donations")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-[var(--muted)]">Loading...</p>;
  if (!data) return <p className="text-[var(--muted)]">Failed to load data</p>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Campaign Finance</h1>
        <p className="mt-1 text-[var(--muted)]">
          {data.totalCampaigns} campaign{data.totalCampaigns !== 1 ? "s" : ""},{" "}
          {data.totalDonations} donation{data.totalDonations !== 1 ? "s" : ""} totaling{" "}
          <span className="font-mono font-semibold">{formatMoney(data.totalAmount)}</span>
        </p>
      </div>

      {/* Donation Timeline */}
      {data.timeline.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Donation Timeline</h2>
          <div className="rounded-lg border border-[var(--border)] bg-white p-4">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.timeline}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(v: number) => formatMoney(v)} />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <Tooltip formatter={(value: any) => formatMoney(Number(value))} />
                <Line
                  type="monotone"
                  dataKey="totalAmount"
                  stroke="#dc2626"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Donations"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* Top Donors */}
      {data.topDonors.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Top Donors</h2>
          <div className="overflow-x-auto rounded-lg border border-[var(--border)] bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-gray-50">
                  <th className="px-4 py-3 text-left font-medium text-[var(--muted)]">#</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--muted)]">Donor</th>
                  <th className="px-4 py-3 text-right font-medium text-[var(--muted)]">Donations</th>
                  <th className="px-4 py-3 text-right font-medium text-[var(--muted)]">Campaigns</th>
                  <th className="px-4 py-3 text-right font-medium text-[var(--muted)]">Total</th>
                </tr>
              </thead>
              <tbody>
                {data.topDonors.map((d, i) => (
                  <tr key={d.donorName} className="border-b border-[var(--border)] last:border-0">
                    <td className="px-4 py-3 text-[var(--muted)]">{i + 1}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/donations/donors/${encodeURIComponent(d.donorName)}`}
                        className="font-medium text-[var(--accent)] hover:underline"
                      >
                        {d.donorName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right">{d.donationCount}</td>
                    <td className="px-4 py-3 text-right">{d.campaignCount}</td>
                    <td className="px-4 py-3 text-right font-mono">{formatMoney(d.totalAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Campaigns */}
      {data.campaigns.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Campaigns</h2>
          <div className="space-y-2">
            {data.campaigns.map((c) => (
              <Link
                key={c.id}
                href={`/donations/campaigns/${c.id}`}
                className="block rounded-lg border border-[var(--border)] bg-white p-4 transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-medium">{c.candidateName}</h3>
                    <div className="mt-1 flex flex-wrap gap-2 text-sm text-[var(--muted)]">
                      {c.committeeName && <span>{c.committeeName}</span>}
                      {c.office && <span>{c.office}</span>}
                      {c.party && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            c.party === "Republican"
                              ? "bg-red-100 text-red-800"
                              : c.party === "Democrat"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {c.party}
                        </span>
                      )}
                      {c.year && <span>{c.year}</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-semibold">{formatMoney(c.totalRaised)}</p>
                    <p className="text-xs text-[var(--muted)]">
                      {c.donorCount} donor{c.donorCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {data.campaigns.length === 0 && data.topDonors.length === 0 && (
        <div className="rounded-lg border border-[var(--border)] bg-white p-8 text-center">
          <p className="text-lg text-[var(--muted)]">No campaign finance data yet</p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Import donation data using the scraper to populate this dashboard.
          </p>
        </div>
      )}
    </div>
  );
}
