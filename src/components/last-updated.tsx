import { lastUpdated } from "@/lib/local-data";

export function formatET(iso: string) {
  return (
    new Date(iso).toLocaleString("en-US", { // sourced-ok: date, not a figure
      timeZone: "America/New_York",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }) + " ET"
  );
}

export function LastUpdated({ scrapers, sources, label = "Last updated" }: { scrapers?: string[]; sources?: string[]; label?: string }) {
  const t = lastUpdated({ scrapers, sources });
  if (!t) return null;
  return (
    <p className="text-xs text-[var(--muted)]">
      <span className="font-semibold">{label}:</span>{" "}
      <time dateTime={t}>{formatET(t)}</time>
    </p>
  );
}
