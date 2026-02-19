"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";

interface VotingStats {
  total: number;
  yea: number;
  nay: number;
  nv: number;
  absent: number;
}

interface Legislator {
  id: number;
  name: string;
  party: string | null;
  chamber: string | null;
  district: string | null;
  votingStats: VotingStats;
}

interface Bill {
  id: number;
  billNumber: string | null;
  title: string;
  chamber: string | null;
  status: number | null;
  statusLabel: string | null;
  lastActionDate: string | null;
  lastAction: string | null;
}

interface Resolution {
  id: number;
  resolutionNumber: string | null;
  title: string;
  date: string | null;
}

interface StatusBreakdown {
  status: number | null;
  statusLabel: string | null;
  count: number;
}

interface DashboardData {
  stats: {
    totalBills: number;
    totalResolutions: number;
    totalLegislators: number;
  };
  legislators: Legislator[];
  recentBills: Bill[];
  recentResolutions: Resolution[];
  statusBreakdown: StatusBreakdown[];
}

const STATUS_COLORS: Record<string, string> = {
  Introduced: "#3b82f6",
  Engrossed: "#eab308",
  Enrolled: "#a855f7",
  Passed: "#22c55e",
  Vetoed: "#ef4444",
  Dead: "#6b7280",
};

const STATUS_BADGE: Record<string, string> = {
  Introduced: "bg-blue-100 text-blue-800",
  Engrossed: "bg-yellow-100 text-yellow-800",
  Enrolled: "bg-purple-100 text-purple-800",
  Passed: "bg-green-100 text-green-800",
  Vetoed: "bg-red-100 text-red-800",
  Dead: "bg-gray-100 text-gray-800",
};

export default function LegislationDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/legislation")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-[var(--muted)]">Loading...</p>;
  if (!data) return <p className="text-[var(--muted)]">Failed to load data</p>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">State Legislation</h1>
        <p className="mt-1 text-[var(--muted)]">
          Tracking {data.stats.totalBills} bill{data.stats.totalBills !== 1 ? "s" : ""},{" "}
          {data.stats.totalResolutions} county resolution{data.stats.totalResolutions !== 1 ? "s" : ""}, and{" "}
          {data.stats.totalLegislators} legislator{data.stats.totalLegislators !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Legislator Cards */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Medina County&apos;s Representatives</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.legislators.map((leg) => (
            <Link
              key={leg.id}
              href={`/legislation/legislators/${leg.id}`}
              className="rounded-lg border border-[var(--border)] bg-white p-5 transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{leg.name}</h3>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                      {leg.party}
                    </span>
                    <span className="text-sm text-[var(--muted)]">
                      {leg.chamber === "Senate" ? "SD" : "HD"}-{leg.district}
                    </span>
                  </div>
                </div>
              </div>
              {leg.votingStats.total > 0 && (
                <div className="mt-3 flex gap-3 text-xs">
                  <span className="text-green-600">{leg.votingStats.yea} Yea</span>
                  <span className="text-red-600">{leg.votingStats.nay} Nay</span>
                  <span className="text-gray-500">{leg.votingStats.nv} NV</span>
                  <span className="text-gray-400">{leg.votingStats.absent} Absent</span>
                </div>
              )}
            </Link>
          ))}
        </div>
      </section>

      {/* Bill Status Breakdown */}
      {data.statusBreakdown.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Bill Status Breakdown</h2>
          <div className="rounded-lg border border-[var(--border)] bg-white p-4">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.statusBreakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="statusLabel" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" name="Bills" radius={[4, 4, 0, 0]}>
                  {data.statusBreakdown.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={STATUS_COLORS[entry.statusLabel ?? ""] ?? "#6b7280"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* Recent Bills */}
      {data.recentBills.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Bills</h2>
            <Link
              href="/legislation/bills"
              className="text-sm text-[var(--accent)] hover:underline"
            >
              View all bills
            </Link>
          </div>
          <div className="overflow-x-auto rounded-lg border border-[var(--border)] bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-gray-50">
                  <th className="px-4 py-3 text-left font-medium text-[var(--muted)]">Bill</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--muted)]">Title</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--muted)]">Chamber</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--muted)]">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--muted)]">Last Action</th>
                </tr>
              </thead>
              <tbody>
                {data.recentBills.map((bill) => (
                  <tr key={bill.id} className="border-b border-[var(--border)] last:border-0">
                    <td className="px-4 py-3">
                      <Link
                        href={`/legislation/bills/${bill.id}`}
                        className="font-medium text-[var(--accent)] hover:underline"
                      >
                        {bill.billNumber}
                      </Link>
                    </td>
                    <td className="max-w-xs truncate px-4 py-3">{bill.title}</td>
                    <td className="px-4 py-3">{bill.chamber}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[bill.statusLabel ?? ""] ?? "bg-gray-100 text-gray-800"}`}
                      >
                        {bill.statusLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--muted)]">{bill.lastActionDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Recent Resolutions */}
      {data.recentResolutions.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent County Resolutions</h2>
            <Link
              href="/legislation/resolutions"
              className="text-sm text-[var(--accent)] hover:underline"
            >
              View all resolutions
            </Link>
          </div>
          <div className="space-y-2">
            {data.recentResolutions.map((res) => (
              <div
                key={res.id}
                className="rounded-lg border border-[var(--border)] bg-white p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-sm font-medium text-[var(--accent)]">
                      {res.resolutionNumber}
                    </span>
                    <p className="mt-0.5">{res.title}</p>
                  </div>
                  <span className="flex-shrink-0 text-sm text-[var(--muted)]">
                    {res.date}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
