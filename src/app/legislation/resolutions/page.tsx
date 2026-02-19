"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";

interface Resolution {
  id: number;
  resolutionNumber: string | null;
  date: string | null;
  title: string;
  description: string | null;
  pdfUrl: string | null;
}

interface ResolutionsData {
  resolutions: Resolution[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function ResolutionsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const search = searchParams.get("search") ?? "";
  const dateFrom = searchParams.get("dateFrom") ?? "";
  const dateTo = searchParams.get("dateTo") ?? "";
  const page = parseInt(searchParams.get("page") ?? "1", 10);

  const [data, setData] = useState<ResolutionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(search);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    params.set("page", String(page));

    fetch(`/api/legislation/resolutions?${params}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [search, dateFrom, dateTo, page]);

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
    router.push(`/legislation/resolutions?${params}`);
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateFilters({ search: searchInput });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">County Resolutions</h1>
        <p className="mt-1 text-[var(--muted)]">
          {data ? `${data.total} resolution${data.total !== 1 ? "s" : ""} found` : "Loading..."}
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
              placeholder="Search resolutions..."
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
          <label className="mb-1 block text-xs font-medium text-[var(--muted)]">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => updateFilters({ dateFrom: e.target.value })}
            className="rounded-md border border-[var(--border)] px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--muted)]">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => updateFilters({ dateTo: e.target.value })}
            className="rounded-md border border-[var(--border)] px-3 py-2 text-sm"
          />
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <p className="text-[var(--muted)]">Loading...</p>
      ) : data && data.resolutions.length > 0 ? (
        <>
          <div className="space-y-2">
            {data.resolutions.map((res) => (
              <div
                key={res.id}
                className="rounded-lg border border-[var(--border)] bg-white p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-[var(--accent)]">
                        {res.resolutionNumber}
                      </span>
                      <span className="text-xs text-[var(--muted)]">{res.date}</span>
                    </div>
                    <p className="mt-1">{res.title}</p>
                  </div>
                  {res.pdfUrl && (
                    <a
                      href={res.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 rounded-md border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--accent)] hover:bg-gray-50"
                    >
                      PDF
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              {page > 1 && (
                <Link
                  href={`/legislation/resolutions?${new URLSearchParams({ ...Object.fromEntries(searchParams.entries()), page: String(page - 1) })}`}
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
                  href={`/legislation/resolutions?${new URLSearchParams({ ...Object.fromEntries(searchParams.entries()), page: String(page + 1) })}`}
                  className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm hover:bg-gray-50"
                >
                  Next
                </Link>
              )}
            </div>
          )}
        </>
      ) : (
        <p className="text-[var(--muted)]">No resolutions found.</p>
      )}
    </div>
  );
}

export default function ResolutionsPage() {
  return (
    <Suspense fallback={<p className="text-[var(--muted)]">Loading...</p>}>
      <ResolutionsContent />
    </Suspense>
  );
}
