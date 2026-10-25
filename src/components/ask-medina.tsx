"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { NewsletterCta } from "./newsletter-cta";

interface AskResult {
  title: string;
  url: string;
  domain: string;
  snippet: string;
  jurisdiction: "city" | "village" | "township" | "county" | "state" | "federal" | "other";
  sourceLabel: string;
  boosted: boolean;
}

interface LocalResult {
  title: string;
  href: string;
  snippet: string;
  kind: "ballot" | "community" | "official" | "bill" | "budget";
  sourceUrl?: string;
  sourceLabel?: string;
}

const LOCAL_BADGE: Record<LocalResult["kind"], string> = {
  ballot: "Ballot",
  community: "Community",
  official: "Official",
  bill: "Ohio bill",
  budget: "Budget",
};

interface AskResponse {
  query: string;
  scope: "medina-county-oh" | "us-federal-fallback";
  results: AskResult[];
  official?: { label: string; url: string } | null;
  local?: LocalResult[];
  officialLinks?: { label: string; url: string }[];
  resting?: boolean;
  cached: boolean;
  fetchedAt: string;
}

const SUGGESTED = [
  "When do the Liverpool Township trustees meet in Valley City?",
  "How do I register to vote in Medina County?",
  "Do I need a permit to build a fence in the city of Medina?",
  "What property tax levies are on the ballot in Medina County?",
  "Where is the Medina County Board of Elections?",
  "How do I get a building permit in Brunswick?",
  "When is trash pickup in Wadsworth?",
];

const BADGE: Record<AskResult["jurisdiction"], string> = {
  city: "bg-emerald-100 text-emerald-800",
  village: "bg-teal-100 text-teal-800",
  township: "bg-lime-100 text-lime-800",
  county: "bg-blue-100 text-blue-800",
  state: "bg-amber-100 text-amber-800",
  federal: "bg-purple-100 text-purple-800",
  other: "bg-gray-100 text-gray-700",
};

const BADGE_TEXT: Record<AskResult["jurisdiction"], string> = {
  city: "City",
  village: "Village",
  township: "Township",
  county: "County",
  state: "Ohio",
  federal: "Federal",
  other: "Other",
};

export function AskMedina({
  initialQuery = "",
  syncUrl = false,
  hideHeading = false,
}: {
  initialQuery?: string;
  syncUrl?: boolean;
  hideHeading?: boolean;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [data, setData] = useState<AskResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showChips, setShowChips] = useState(false);
  const ran = useRef<string | null>(null);

  async function ask(q: string) {
    const question = q.trim();
    if (question.length < 3) return;
    setQuery(question);
    setLoading(true);
    setError(null);
    setData(null);
    setShowChips(false);
    if (syncUrl) router.replace(`/search?q=${encodeURIComponent(question)}`, { scroll: false });
    try {
      const res = await fetch(`/api/ask?q=${encodeURIComponent(question)}`);
      const body = await res.json();
      if (!res.ok) setError(body.error ?? "Something went wrong. Please try again.");
      else setData(body);
    } catch {
      setError("Could not reach the server. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (initialQuery && ran.current !== initialQuery) {
      ran.current = initialQuery;
      ask(initialQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    ask(query);
  }

  return (
    <section className="min-w-0 max-w-full space-y-4" aria-labelledby="ask-medina-heading">
      <div className={hideHeading ? "sr-only" : ""}>
        <h2 id="ask-medina-heading" className="text-xl font-semibold sm:text-2xl">
          Ask Medina
        </h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Ask a question about local government anywhere in Medina County, Ohio: every city, village
          and township, from Liverpool Township in Valley City to York. We search official government websites and link you straight to the source.
        </p>
      </div>

      <form onSubmit={onSubmit} className="flex w-full flex-col gap-2 sm:flex-row" role="search">
        <label htmlFor="ask-medina-input" className="sr-only">
          Your question about Medina County, Ohio
        </label>
        <input
          id="ask-medina-input"
          type="search"
          value={query}
          maxLength={200}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. Do I need a permit for a fence in Medina?"
          className="min-w-0 flex-1 rounded-lg border-2 border-[var(--royal)] bg-white px-4 py-3 text-base text-[var(--navy)] placeholder:text-slate-500 focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-light)]"
        />
        <button
          type="submit"
          disabled={loading || query.trim().length < 3}
          className="rounded-lg bg-[var(--gold)] px-6 py-3 text-base font-semibold text-[var(--navy)] hover:bg-yellow-400 disabled:opacity-60"
        >
          {loading ? "Searching..." : "Ask"}
        </button>
      </form>

      {(data || loading || error) && !showChips ? (
        <button type="button" onClick={() => setShowChips(true)} className="text-xs font-semibold text-[var(--royal)] underline">
          Show suggested questions
        </button>
      ) : (
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Try asking</p>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => { setShowChips(false); ask(s); }}
              className="rounded-full border border-[var(--royal)] bg-white px-3 py-1.5 text-left text-sm text-[var(--navy)] hover:bg-[var(--accent-light)]"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      )}

      <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
        This is not legal advice. Results come from government websites and may be out of date. Always confirm details
        with the official office before you rely on them.
      </p>

      <div aria-live="polite">
        {loading && <p className="text-sm text-[var(--muted)]">Searching official sources...</p>}
        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}
        {data && (
          <div className="space-y-3">
            {!!data.local?.length && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-[var(--navy)]">From OpenMedina&apos;s verified data</p>
                <ul className="space-y-2 sm:space-y-3">
                  {data.local.map((r) => (
                    <li key={r.href + r.title} className="min-w-0 overflow-hidden rounded-xl border border-[var(--gold)] bg-white p-3 shadow-sm sm:p-4">
                      <div className="flex min-w-0 items-center gap-2 text-[11px] sm:text-xs">
                        <span className="shrink-0 rounded-full bg-[var(--accent-light)] px-2 py-0.5 font-medium text-[var(--navy)]">{LOCAL_BADGE[r.kind]}</span>
                        <span className="min-w-0 truncate text-[var(--muted)]">openmedina.org</span>
                      </div>
                      <h3 className="mt-1.5 break-words text-[15px] font-semibold leading-snug sm:mt-2 sm:text-base">
                        <a href={r.href} className="text-[var(--accent)] hover:underline">{r.title}</a>
                      </h3>
                      {r.snippet && <p className="mt-1 line-clamp-2 break-words text-[13px] text-slate-700 sm:line-clamp-3 sm:text-sm">{r.snippet}</p>}
                      {r.sourceUrl && (
                        <a href={r.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-1 block truncate text-xs text-[var(--muted)] underline">
                          Source: {r.sourceLabel ?? "official record"}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <p className="text-sm text-[var(--muted)]">
              {data.resting ? "Official websites for" : "Official sources for"} &ldquo;{data.query}&rdquo;
              {data.scope === "us-federal-fallback" ? " (includes federal sources)" : ""}
            </p>
            {data.official && (
              <div className="rounded-xl border-2 border-[var(--gold)] bg-amber-50 p-3 text-sm sm:p-4">
                <p className="font-semibold text-[var(--navy)]">
                  Start with the{" "}
                  <a href={data.official.url} target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] underline">
                    {data.official.label} official website
                  </a>
                </p>
                <p className="mt-1 text-[var(--muted)]">
                  Elected officials and contacts are on{" "}
                  <a href="/local#communities" className="underline">our local government page</a>.
                </p>
              </div>
            )}
            {data.resting && (
              <div className="space-y-3">
                <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  {(data.officialLinks ?? []).map((l) => (
                    <li key={l.url}>
                      <a href={l.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-[var(--accent)] underline">{l.label}</a>
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-[var(--muted)]">Full government web search is resting until tomorrow.</p>
                <NewsletterCta />
              </div>
            )}
            {!data.resting && data.results.length === 0 && !data.local?.length && (
              <p className="text-sm text-[var(--muted)]">
                No official sources found. Try rewording your question or naming the city or office.
              </p>
            )}
            <ul className="space-y-2 sm:space-y-3">
              {data.results.map((r) => (
                <li key={r.url} className="min-w-0 overflow-hidden rounded-xl border border-[var(--royal)] bg-white p-3 shadow-sm transition-shadow hover:shadow-md sm:p-4">
                  <div className="flex min-w-0 items-center gap-2 text-[11px] sm:text-xs">
                    <span className={`shrink-0 rounded-full px-2 py-0.5 font-medium ${BADGE[r.jurisdiction]}`}>
                      {BADGE_TEXT[r.jurisdiction]}
                    </span>
                    <span className="min-w-0 truncate text-[var(--muted)]">{r.domain}{r.boosted && <span className="hidden sm:inline"> · {r.sourceLabel}</span>}</span>
                  </div>
                  <h3 className="mt-1.5 break-words text-[15px] font-semibold leading-snug sm:mt-2 sm:text-base">
                    <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline">
                      {r.title}
                    </a>
                  </h3>
                  {r.snippet && <p className="mt-1 line-clamp-2 break-words text-[13px] text-slate-700 sm:line-clamp-3 sm:text-sm">{r.snippet}</p>}
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 hidden truncate text-xs text-[var(--muted)] hover:underline sm:block"
                  >
                    {r.url}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
