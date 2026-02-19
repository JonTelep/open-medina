"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface MeetingItem {
  id: number;
  date: string;
  title: string | null;
  bodySnippet: string | null;
  source: string;
}

const PAGE_SIZE = 20;

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<MeetingItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(0);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    params.set("limit", String(PAGE_SIZE));
    params.set("offset", String(page * PAGE_SIZE));

    fetch(`/api/meetings?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setMeetings(data.items);
        setTotal(data.total);
      })
      .finally(() => setLoading(false));
  }, [search, startDate, endDate, page]);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [search, startDate, endDate]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Meeting Minutes</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          {total} meeting{total !== 1 ? "s" : ""} on record
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-[var(--muted)]">
            Search
          </label>
          <input
            type="text"
            placeholder="Search titles and text..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--muted)]">
            From
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--muted)]">
            To
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
          />
        </div>
      </div>

      {loading ? (
        <p className="text-[var(--muted)]">Loading...</p>
      ) : meetings.length === 0 ? (
        <p className="text-[var(--muted)]">No meetings found.</p>
      ) : (
        <>
          <div className="space-y-3">
            {meetings.map((m) => (
              <Link
                key={m.id}
                href={`/meetings/${m.id}`}
                className="block rounded-lg border border-[var(--border)] bg-white p-4 transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium">
                      {m.title ?? `Meeting ${m.date}`}
                    </h3>
                    {m.bodySnippet && (
                      <p className="mt-1 text-sm text-[var(--muted)] line-clamp-2">
                        {m.bodySnippet}
                      </p>
                    )}
                  </div>
                  <span className="flex-shrink-0 text-sm text-[var(--muted)]">
                    {m.date}
                  </span>
                </div>
              </Link>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm text-[var(--muted)]">
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
