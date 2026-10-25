import { notFound } from "next/navigation";
import { isSectionLive } from "@/lib/sections";
import { LastUpdated } from "@/components/last-updated";
import { ReportLink } from "@/components/forms";

export const dynamic = "force-dynamic";

export default function Layout({ children }: { children: React.ReactNode }) {
  if (!isSectionLive("/legislation")) notFound();
  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-x-4">
        <LastUpdated scrapers={["legislation"]} />
        <ReportLink item="legislation" />
      </div>
      <p className="mb-4 text-xs text-[var(--muted)]">
        Bills in the current Ohio General Assembly that are sponsored by legislators representing Medina County (House
        Districts 66 and 67, Senate District 22) or that mention Medina County. Source:{" "}
        <a className="underline" href="https://legiscan.com/OH" target="_blank" rel="noopener noreferrer">LegiScan</a>
        , with official bill text at{" "}
        <a className="underline" href="https://www.legislature.ohio.gov/legislation" target="_blank" rel="noopener noreferrer">legislature.ohio.gov</a>.
      </p>
      {children}
    </>
  );
}
