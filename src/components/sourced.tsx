// Every number on the site renders through <Sourced>. It needs the exact official page or
// document the figure came from and the time it was last verified. Without both, or when the
// URL is only a site's home page, nothing is rendered. scripts/check-sourced.mjs fails the build
// when a page formats a number outside this component.
import type { ReactNode } from "react";

export function isExactSource(url: string | null | undefined): url is string {
  if (!url) return false;
  try {
    const u = new URL(url);
    return u.protocol === "https:" && (u.pathname.replace(/\/+$/, "") !== "" || u.search !== "");
  } catch {
    return false;
  }
}

export function formatVerified(t: string): string {
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(t);
  const d = new Date(dateOnly ? `${t}T12:00:00-04:00` : t.includes("T") ? t : t.replace(" ", "T") + "Z");
  if (Number.isNaN(+d)) return "";
  return (
    d.toLocaleString("en-US", {
      timeZone: "America/New_York",
      month: "short",
      day: "numeric",
      year: "numeric",
    }) + " ET"
  );
}

/** Formats a figure. Only call inside <Sourced value={...}>. */
export function fmtNum(n: number, kind: "int" | "usd" | "pct" = "int") {
  return kind === "usd" ? `$${n.toLocaleString("en-US")}` : kind === "pct" ? `${n}%` : n.toLocaleString("en-US");
}

export function Sourced({
  value,
  url,
  verifiedAt,
  block = false,
  className = "",
}: {
  value: ReactNode;
  url: string | null | undefined;
  verifiedAt: string | null | undefined;
  block?: boolean;
  className?: string;
}) {
  if (!isExactSource(url) || !verifiedAt || !formatVerified(verifiedAt)) return null;
  const note = (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[10px] font-normal leading-tight text-[var(--muted)] underline hover:text-[var(--royal)]"
      title={url}
    >
      <span className="whitespace-nowrap">source,</span> <span className="whitespace-nowrap">verified {formatVerified(verifiedAt)}</span>
    </a>
  );
  return block ? (
    <div data-sourced className={`flex flex-col ${className}`}>
      <div>{value}</div>
      {note}
    </div>
  ) : (
    <span data-sourced className={className}>
      {value} {note}
    </span>
  );
}
