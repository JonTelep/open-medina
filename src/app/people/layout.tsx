import { notFound } from "next/navigation";
import { isSectionLive } from "@/lib/sections";
import { LastUpdated } from "@/components/last-updated";
import { ReportLink } from "@/components/forms";

export const dynamic = "force-dynamic";

export default function Layout({ children }: { children: React.ReactNode }) {
  if (!isSectionLive("/people")) notFound();
  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-x-4">
        <LastUpdated scrapers={["salaries", "entity-resolution"]} />
        <ReportLink item="people" />
      </div>
      {children}
    </>
  );
}
