"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface VotingStats {
  total: number;
  yea: number;
  nay: number;
  nv: number;
  absent: number;
}

interface VoteRecord {
  voteId: number;
  vote: string;
  rollCallId: number;
  rollCallDate: string | null;
  rollCallDescription: string | null;
  rollCallChamber: string | null;
  passed: number | null;
  billId: number;
  billNumber: string | null;
  billTitle: string;
}

interface SponsoredBill {
  sponsorId: number;
  type: string;
  billId: number;
  billNumber: string | null;
  title: string;
  status: number | null;
  statusLabel: string | null;
  chamber: string | null;
  lastActionDate: string | null;
}

interface LegislatorData {
  legislator: {
    id: number;
    name: string;
    firstName: string | null;
    lastName: string | null;
    party: string | null;
    chamber: string | null;
    district: string | null;
    email: string | null;
    bioUrl: string | null;
  };
  votingStats: VotingStats;
  recentVotes: VoteRecord[];
  sponsoredBills: SponsoredBill[];
}

const STATUS_BADGE: Record<string, string> = {
  Introduced: "bg-blue-100 text-blue-800",
  Engrossed: "bg-yellow-100 text-yellow-800",
  Enrolled: "bg-purple-100 text-purple-800",
  Passed: "bg-green-100 text-green-800",
  Vetoed: "bg-red-100 text-red-800",
  Dead: "bg-gray-100 text-gray-800",
};

const VOTE_COLORS: Record<string, string> = {
  yea: "text-green-600",
  nay: "text-red-600",
  nv: "text-gray-500",
  absent: "text-gray-400",
};

const PIE_COLORS = {
  yea: "#22c55e",
  nay: "#ef4444",
  nv: "#6b7280",
  absent: "#d1d5db",
};

export default function LegislatorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<LegislatorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/legislation/legislators/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="text-[var(--muted)]">Loading...</p>;
  if (error || !data) return <p className="text-[var(--muted)]">Legislator not found.</p>;

  const { legislator, votingStats, recentVotes, sponsoredBills } = data;

  const pieData = [
    { name: "Yea", value: votingStats.yea, color: PIE_COLORS.yea },
    { name: "Nay", value: votingStats.nay, color: PIE_COLORS.nay },
    { name: "NV", value: votingStats.nv, color: PIE_COLORS.nv },
    { name: "Absent", value: votingStats.absent, color: PIE_COLORS.absent },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/legislation"
          className="text-sm text-[var(--accent)] hover:underline"
        >
          &larr; Back to Legislation
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <h1 className="text-2xl font-bold">{legislator.name}</h1>
          <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
            {legislator.party}
          </span>
        </div>
        <p className="mt-1 text-[var(--muted)]">
          Ohio {legislator.chamber}, District {legislator.district}
        </p>
        <div className="mt-2 flex gap-3">
          {legislator.bioUrl && (
            <a
              href={legislator.bioUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[var(--accent)] hover:underline"
            >
              Official Bio &rarr;
            </a>
          )}
          {legislator.email && (
            <a
              href={`mailto:${legislator.email}`}
              className="text-sm text-[var(--accent)] hover:underline"
            >
              {legislator.email}
            </a>
          )}
        </div>
      </div>

      {/* Voting Record Chart */}
      {votingStats.total > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Voting Record</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-[var(--border)] bg-white p-4">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-white p-4">
              <h3 className="mb-3 font-medium">Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Total Votes</span>
                  <span className="font-mono font-semibold">{votingStats.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-600">Yea</span>
                  <span className="font-mono">
                    {votingStats.yea} ({votingStats.total > 0 ? Math.round((votingStats.yea / votingStats.total) * 100) : 0}%)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-red-600">Nay</span>
                  <span className="font-mono">
                    {votingStats.nay} ({votingStats.total > 0 ? Math.round((votingStats.nay / votingStats.total) * 100) : 0}%)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Not Voting</span>
                  <span className="font-mono">{votingStats.nv}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Absent</span>
                  <span className="font-mono">{votingStats.absent}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Sponsored Bills */}
      {sponsoredBills.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">
            Sponsored Bills ({sponsoredBills.length})
          </h2>
          <div className="space-y-2">
            {sponsoredBills.map((sb) => (
              <Link
                key={sb.sponsorId}
                href={`/legislation/bills/${sb.billId}`}
                className="block rounded-lg border border-[var(--border)] bg-white p-4 transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-[var(--accent)]">
                        {sb.billNumber}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[sb.statusLabel ?? ""] ?? "bg-gray-100 text-gray-800"}`}
                      >
                        {sb.statusLabel}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          sb.type === "sponsor"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {sb.type}
                      </span>
                    </div>
                    <p className="mt-1">{sb.title}</p>
                  </div>
                  <span className="flex-shrink-0 text-xs text-[var(--muted)]">
                    {sb.lastActionDate}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Recent Votes */}
      {recentVotes.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Vote History</h2>
          <div className="overflow-x-auto rounded-lg border border-[var(--border)] bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-gray-50">
                  <th className="px-4 py-3 text-left font-medium text-[var(--muted)]">Date</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--muted)]">Bill</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--muted)]">Description</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--muted)]">Vote</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--muted)]">Result</th>
                </tr>
              </thead>
              <tbody>
                {recentVotes.map((v) => (
                  <tr key={v.voteId} className="border-b border-[var(--border)] last:border-0">
                    <td className="px-4 py-3 text-[var(--muted)]">{v.rollCallDate}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/legislation/bills/${v.billId}`}
                        className="font-medium text-[var(--accent)] hover:underline"
                      >
                        {v.billNumber}
                      </Link>
                    </td>
                    <td className="max-w-xs truncate px-4 py-3">{v.rollCallDescription}</td>
                    <td className="px-4 py-3">
                      <span className={`font-medium ${VOTE_COLORS[v.vote]}`}>
                        {v.vote.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          v.passed ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}
                      >
                        {v.passed ? "Passed" : "Failed"}
                      </span>
                    </td>
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
