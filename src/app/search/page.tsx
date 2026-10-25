"use client";

import { SearchBar } from "@/components/search-bar";
import { AskMedina } from "@/components/ask-medina";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

interface SearchResult {
  entityType: string;
  entityId: number;
  title: string;
  snippet: string;
  department: string | null;
  year: string | null;
}

const TYPE_LABELS: Record<string, string> = {
  person: "Person",
  salary: "Salary",
  vendor: "Vendor Payment",
  meeting: "Meeting",
  donation: "Donation",
  campaign: "Campaign",
  bill: "Bill",
  resolution: "Resolution",
};

const TYPE_COLORS: Record<string, string> = {
  person: "bg-blue-100 text-blue-800",
  salary: "bg-green-100 text-green-800",
  vendor: "bg-amber-100 text-amber-800",
  meeting: "bg-purple-100 text-purple-800",
  donation: "bg-red-100 text-red-800",
  campaign: "bg-pink-100 text-pink-800",
  bill: "bg-indigo-100 text-indigo-800",
  resolution: "bg-teal-100 text-teal-800",
};

function SearchContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const filterType = searchParams.get("type") ?? "";

  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    const url = `/api/search?q=${encodeURIComponent(q)}${filterType ? `&type=${filterType}` : ""}`;
    fetch(url)
      .then((r) => r.json())
      .then(setResults)
      .finally(() => setLoading(false));
  }, [q, filterType]);

  function linkForResult(result: SearchResult): string {
    switch (result.entityType) {
      case "person":
        return `/people/${result.entityId}`;
      case "salary":
        return `/people/${result.entityId}`;
      case "vendor":
        return `/money/vendors/${encodeURIComponent(result.title)}`;
      case "meeting":
        return `/meetings/${result.entityId}`;
      case "donation":
        return `/donations/donors/${encodeURIComponent(result.title)}`;
      case "campaign":
        return `/donations/campaigns/${result.entityId}`;
      case "bill":
        return `/legislation/bills/${result.entityId}`;
      case "resolution":
        return `/legislation/resolutions`;
      default:
        return "#";
    }
  }

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-[var(--border)] bg-white p-4 shadow-sm sm:p-6">
        <AskMedina initialQuery={q} syncUrl />
      </div>

      <div className="space-y-4">
      <h2 className="text-lg font-semibold">OpenMedina database</h2>
      <SearchBar defaultValue={q} />

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-[var(--muted)]">Filter:</span>
        {["", "person", "salary", "vendor", "meeting", "donation", "campaign", "bill", "resolution"].map((t) => (
          <Link
            key={t}
            href={`/search?q=${encodeURIComponent(q)}${t ? `&type=${t}` : ""}`}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              filterType === t
                ? "bg-[var(--accent)] text-white"
                : "bg-gray-100 text-[var(--muted)] hover:bg-gray-200"
            }`}
          >
            {t ? TYPE_LABELS[t] : "All"}
          </Link>
        ))}
      </div>

      {loading ? (
        <p className="text-[var(--muted)]">Searching...</p>
      ) : results.length === 0 && q ? (
        <p className="text-[var(--muted)]">No results found for &ldquo;{q}&rdquo;</p>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-[var(--muted)]">
            {results.length} result{results.length !== 1 ? "s" : ""}
          </p>
          {results.map((result, i) => (
            <Link
              key={i}
              href={linkForResult(result)}
              className="block rounded-lg border border-[var(--border)] bg-white p-4 transition-shadow hover:shadow-md"
            >
              <div className="flex flex-col items-start justify-between gap-2 sm:flex-row">
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium">{result.title}</h3>
                  <p
                    className="mt-1 text-sm text-[var(--muted)]"
                    dangerouslySetInnerHTML={{ __html: result.snippet }}
                  />
                </div>
                <div className="flex flex-shrink-0 items-center gap-2">
                  {result.year && (
                    <span className="text-xs text-[var(--muted)]">{result.year}</span>
                  )}
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_COLORS[result.entityType] ?? "bg-gray-100"}`}
                  >
                    {TYPE_LABELS[result.entityType] ?? result.entityType}
                  </span>
                </div>
              </div>
              {result.department && (
                <p className="mt-1 text-xs text-[var(--muted)]">{result.department}</p>
              )}
            </Link>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<p className="text-[var(--muted)]">Loading...</p>}>
      <SearchContent />
    </Suspense>
  );
}
