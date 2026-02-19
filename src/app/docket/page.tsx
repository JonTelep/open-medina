"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatMoney } from "@/components/money-format";

interface Docket {
  id: number;
  date: string;
  title: string | null;
  totalAmount: number | null;
  source: string;
}

const PAGE_SIZE = 50;

export default function DocketPage() {
  const [dockets, setDockets] = useState<Docket[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("limit", String(PAGE_SIZE + 1)); // fetch one extra to detect hasMore
    params.set("offset", String(page * PAGE_SIZE));

    fetch(`/api/dockets?${params}`)
      .then((r) => r.json())
      .then((data: Docket[]) => {
        setHasMore(data.length > PAGE_SIZE);
        setDockets(data.slice(0, PAGE_SIZE));
      })
      .finally(() => setLoading(false));
  }, [page]);

  if (loading) return <p className="text-[var(--muted)]">Loading...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Weekly Docket</h1>
        <p className="mt-1 text-[var(--muted)]">
          Browse weekly payment batches approved by commissioners
        </p>
      </div>

      {dockets.length === 0 ? (
        <p className="text-[var(--muted)]">No dockets found.</p>
      ) : (
        <>
          <div className="space-y-2">
            {dockets.map((d) => (
              <Link
                key={d.id}
                href={`/docket/${d.id}`}
                className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-white px-4 py-3 transition-shadow hover:shadow-md"
              >
                <div>
                  <p className="font-medium">{d.title ?? `Docket ${d.date}`}</p>
                  <p className="text-sm text-[var(--muted)]">{d.date}</p>
                </div>
                {d.totalAmount != null && (
                  <p className="font-mono font-semibold">{formatMoney(d.totalAmount)}</p>
                )}
              </Link>
            ))}
          </div>
          {(page > 0 || hasMore) && (
            <div className="flex items-center justify-between">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm text-[var(--muted)]">Page {page + 1}</span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={!hasMore}
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
