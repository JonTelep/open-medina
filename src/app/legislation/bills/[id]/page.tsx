"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface Sponsor {
  id: number;
  legislatorId: number;
  type: string;
  legislatorName: string;
  party: string | null;
  chamber: string | null;
  district: string | null;
}

interface LegislatorVote {
  legislatorId: number;
  vote: string;
  legislatorName: string;
  party: string | null;
  chamber: string | null;
  district: string | null;
}

interface RollCall {
  id: number;
  date: string | null;
  chamber: string | null;
  description: string | null;
  yea: number | null;
  nay: number | null;
  nv: number | null;
  absent: number | null;
  passed: number | null;
  legislatorVotes: LegislatorVote[];
}

interface BillData {
  bill: {
    id: number;
    billNumber: string | null;
    title: string;
    description: string | null;
    chamber: string | null;
    status: number | null;
    statusLabel: string | null;
    statusDate: string | null;
    lastAction: string | null;
    lastActionDate: string | null;
    url: string | null;
  };
  sponsors: Sponsor[];
  rollCalls: RollCall[];
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

const VOTE_DOT_COLORS: Record<string, string> = {
  yea: "bg-green-500",
  nay: "bg-red-500",
  nv: "bg-gray-400",
  absent: "bg-gray-300",
};

// Pipeline stages (normal flow)
const PIPELINE_STAGES = [
  { status: 1, label: "Introduced" },
  { status: 2, label: "Engrossed" },
  { status: 3, label: "Enrolled" },
  { status: 4, label: "Passed" },
];

function StatusPipeline({ status, statusLabel }: { status: number | null; statusLabel: string | null }) {
  const isVetoed = status === 5;
  const isDead = status === 6;
  const currentStatus = status ?? 0;

  const stages = PIPELINE_STAGES.map((stage) => {
    // For vetoed/dead, the last stage changes
    if (stage.status === 4) {
      if (isVetoed) return { ...stage, label: "Vetoed", reached: true, terminal: true, color: "text-red-600 border-red-400 bg-red-50" };
      if (isDead) return { ...stage, label: "Dead", reached: true, terminal: true, color: "text-gray-500 border-gray-400 bg-gray-50" };
    }

    const reached = currentStatus >= stage.status;
    return { ...stage, reached, terminal: false, color: "" };
  });

  return (
    <div className="flex items-center gap-0">
      {stages.map((stage, i) => (
        <div key={stage.status} className="flex items-center">
          {i > 0 && (
            <div
              className={`h-0.5 w-8 sm:w-12 ${stage.reached ? "bg-[var(--accent)]" : "bg-gray-200"}`}
            />
          )}
          <div className="flex flex-col items-center gap-1">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold ${
                stage.terminal
                  ? stage.color
                  : stage.reached
                    ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                    : "border-gray-300 bg-white text-gray-400"
              }`}
            >
              {stage.reached ? (stage.terminal ? "!" : "\u2713") : i + 1}
            </div>
            <span
              className={`text-xs font-medium ${
                stage.terminal
                  ? stage.color.split(" ")[0]
                  : stage.reached
                    ? "text-[var(--accent)]"
                    : "text-gray-400"
              }`}
            >
              {stage.label}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function MedinaVoteCard({ rollCall }: { rollCall: RollCall }) {
  // All 3 Medina legislators
  const MEDINA_LEGISLATORS = [
    { name: "Sharon A. Ray", chamber: "House", district: "66" },
    { name: "Melanie Miller", chamber: "House", district: "67" },
    { name: "Mark Romanchuk", chamber: "Senate", district: "22" },
  ];

  return (
    <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
      <h4 className="mb-2 text-sm font-semibold text-blue-800">How Medina County Voted</h4>
      <div className="space-y-1.5">
        {MEDINA_LEGISLATORS.map((leg) => {
          const vote = rollCall.legislatorVotes.find(
            (v) => v.legislatorName === leg.name
          );

          // If the vote was in a different chamber, show N/A
          const wrongChamber = rollCall.chamber !== leg.chamber;

          return (
            <div key={leg.name} className="flex items-center justify-between text-sm">
              <span>
                {leg.name}{" "}
                <span className="text-xs text-gray-500">
                  ({leg.chamber === "Senate" ? "SD" : "HD"}-{leg.district})
                </span>
              </span>
              {wrongChamber && !vote ? (
                <span className="text-xs text-gray-400">N/A — {leg.chamber} vote</span>
              ) : vote ? (
                <span className={`flex items-center gap-1.5 font-medium ${VOTE_COLORS[vote.vote]}`}>
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${VOTE_DOT_COLORS[vote.vote]}`}
                  />
                  {vote.vote.toUpperCase()}
                </span>
              ) : (
                <span className="text-xs text-gray-400">No vote recorded</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function BillDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<BillData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/legislation/bills/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="text-[var(--muted)]">Loading...</p>;
  if (error || !data) return <p className="text-[var(--muted)]">Bill not found.</p>;

  const { bill, sponsors, rollCalls } = data;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/legislation/bills"
          className="text-sm text-[var(--accent)] hover:underline"
        >
          &larr; Back to Bills
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <h1 className="text-2xl font-bold">{bill.billNumber}</h1>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[bill.statusLabel ?? ""] ?? "bg-gray-100 text-gray-800"}`}
          >
            {bill.statusLabel}
          </span>
          <span className="text-sm text-[var(--muted)]">{bill.chamber}</span>
        </div>
        <h2 className="mt-1 text-lg">{bill.title}</h2>
        {bill.description && (
          <p className="mt-2 text-[var(--muted)]">{bill.description}</p>
        )}
      </div>

      {/* Status Pipeline */}
      <section>
        <h3 className="mb-3 text-sm font-semibold text-[var(--muted)]">STATUS PROGRESS</h3>
        <div className="rounded-lg border border-[var(--border)] bg-white p-6">
          <StatusPipeline status={bill.status} statusLabel={bill.statusLabel} />
        </div>
      </section>

      {/* Last Action */}
      {bill.lastAction && (
        <section className="rounded-lg border border-[var(--border)] bg-white p-4">
          <p className="text-sm text-[var(--muted)]">Last Action ({bill.lastActionDate})</p>
          <p className="mt-1">{bill.lastAction}</p>
        </section>
      )}

      {/* Sponsors */}
      {sponsors.length > 0 && (
        <section>
          <h3 className="mb-3 text-sm font-semibold text-[var(--muted)]">SPONSORS</h3>
          <div className="flex flex-wrap gap-2">
            {sponsors.map((s) => (
              <Link
                key={s.id}
                href={`/legislation/legislators/${s.legislatorId}`}
                className="rounded-lg border border-[var(--border)] bg-white px-4 py-2 transition-shadow hover:shadow-md"
              >
                <span className="font-medium">{s.legislatorName}</span>
                <span className="ml-2 text-xs text-[var(--muted)]">
                  ({s.party}, {s.chamber === "Senate" ? "SD" : "HD"}-{s.district})
                </span>
                <span
                  className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                    s.type === "sponsor"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {s.type}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Roll Call Votes */}
      {rollCalls.length > 0 && (
        <section>
          <h3 className="mb-3 text-sm font-semibold text-[var(--muted)]">ROLL CALL VOTES</h3>
          <div className="space-y-4">
            {rollCalls.map((rc) => (
              <div
                key={rc.id}
                className="rounded-lg border border-[var(--border)] bg-white p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-medium">{rc.description}</h4>
                    <p className="text-sm text-[var(--muted)]">
                      {rc.chamber} — {rc.date}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      rc.passed ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}
                  >
                    {rc.passed ? "Passed" : "Failed"}
                  </span>
                </div>

                {/* Vote Tally */}
                <div className="mt-3 flex gap-4 text-sm">
                  <span className="text-green-600 font-medium">{rc.yea} Yea</span>
                  <span className="text-red-600 font-medium">{rc.nay} Nay</span>
                  <span className="text-gray-500">{rc.nv} NV</span>
                  <span className="text-gray-400">{rc.absent} Absent</span>
                </div>

                {/* How Medina County Voted */}
                <MedinaVoteCard rollCall={rc} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* External Link */}
      {bill.url && (
        <a
          href={bill.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-sm text-[var(--accent)] hover:underline"
        >
          View on LegiScan &rarr;
        </a>
      )}
    </div>
  );
}
