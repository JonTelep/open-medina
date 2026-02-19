"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";

interface Bill {
  id: number;
  billNumber: string | null;
  title: string;
  description: string | null;
  chamber: string | null;
  status: number | null;
  statusLabel: string | null;
  lastAction: string | null;
  lastActionDate: string | null;
}

interface BillsData {
  bills: Bill[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const STATUS_BADGE: Record<string, string> = {
  Introduced: "bg-blue-100 text-blue-800",
  Engrossed: "bg-yellow-100 text-yellow-800",
  Enrolled: "bg-purple-100 text-purple-800",
  Passed: "bg-green-100 text-green-800",
  Vetoed: "bg-red-100 text-red-800",
  Dead: "bg-gray-100 text-gray-800",
};

function BillsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const search = searchParams.get("search") ?? "";
  const chamber = searchParams.get("chamber") ?? "";
  const status = searchParams.get("status") ?? "";
  const page = parseInt(searchParams.get("page") ?? "1", 10);

  const [data, setData] = useState<BillsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(search);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (chamber) params.set("chamber", chamber);
    if (status) params.set("status", status);
    params.set("page", String(page));

    fetch(`/api/legislation/bills?${params}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [search, chamber, status, page]);

  function updateFilters(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }
    params.set("page", "1");
    router.push(`/legislation/bills?${params}`);
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateFilters({ search: searchInput });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">State Bills</h1>
        <p className="mt-1 text-[var(--muted)]">
          {data ? `${data.total} bill${data.total !== 1 ? "s" : ""} found` : "Loading..."}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1">
          <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Search</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search bills..."
              className="w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Search
            </button>
          </div>
        </form>
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Chamber</label>
          <select
            value={chamber}
            onChange={(e) => updateFilters({ chamber: e.target.value })}
            className="rounded-md border border-[var(--border)] px-3 py-2 text-sm"
          >
            <option value="">All Chambers</option>
            <option value="House">House</option>
            <option value="Senate">Senate</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Status</label>
          <select
            value={status}
            onChange={(e) => updateFilters({ status: e.target.value })}
            className="rounded-md border border-[var(--border)] px-3 py-2 text-sm"
          >
            <option value="">All Statuses</option>
            <option value="1">Introduced</option>
            <option value="2">Engrossed</option>
            <option value="3">Enrolled</option>
            <option value="4">Passed</option>
            <option value="5">Vetoed</option>
            <option value="6">Dead</option>
          </select>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <p className="text-[var(--muted)]">Loading...</p>
      ) : data && data.bills.length > 0 ? (
        <>
          <div className="space-y-2">
            {data.bills.map((bill) => (
              <Link
                key={bill.id}
                href={`/legislation/bills/${bill.id}`}
                className="block rounded-lg border border-[var(--border)] bg-white p-4 transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-[var(--accent)]">
                        {bill.billNumber}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[bill.statusLabel ?? ""] ?? "bg-gray-100 text-gray-800"}`}
                      >
                        {bill.statusLabel}
                      </span>
                      <span className="text-xs text-[var(--muted)]">{bill.chamber}</span>
                    </div>
                    <h3 className="mt-1 font-medium">{bill.title}</h3>
                    {bill.description && (
                      <p className="mt-1 text-sm text-[var(--muted)] line-clamp-2">
                        {bill.description}
                      </p>
                    )}
                  </div>
                  <span className="flex-shrink-0 text-xs text-[var(--muted)]">
                    {bill.lastActionDate}
                  </span>
                </div>
                {bill.lastAction && (
                  <p className="mt-2 text-xs text-[var(--muted)]">
                    Last action: {bill.lastAction}
                  </p>
                )}
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              {page > 1 && (
                <Link
                  href={`/legislation/bills?${new URLSearchParams({ ...Object.fromEntries(searchParams.entries()), page: String(page - 1) })}`}
                  className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm hover:bg-gray-50"
                >
                  Previous
                </Link>
              )}
              <span className="text-sm text-[var(--muted)]">
                Page {data.page} of {data.totalPages}
              </span>
              {page < data.totalPages && (
                <Link
                  href={`/legislation/bills?${new URLSearchParams({ ...Object.fromEntries(searchParams.entries()), page: String(page + 1) })}`}
                  className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm hover:bg-gray-50"
                >
                  Next
                </Link>
              )}
            </div>
          )}
        </>
      ) : (
        <p className="text-[var(--muted)]">No bills found.</p>
      )}
    </div>
  );
}

export default function BillsPage() {
  return (
    <Suspense fallback={<p className="text-[var(--muted)]">Loading...</p>}>
      <BillsContent />
    </Suspense>
  );
}
