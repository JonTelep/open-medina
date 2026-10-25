import type { Metadata } from "next";
import { pageMeta } from "@/lib/og";
import { AskMedina } from "@/components/ask-medina";
import { NewsletterCta } from "@/components/newsletter-cta";

export const metadata: Metadata = pageMeta(
  "/search",
  "Ask Medina",
  "Ask a question about local government in Medina County, Ohio, and get linked straight to the official source.",
);

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--gold-dark)]">Medina County, Ohio</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-[var(--navy)]">Ask Medina</h1>
      </div>
      <div className="rounded-xl border border-[var(--border)] bg-white p-4 shadow-sm sm:p-6">
        <AskMedina initialQuery={q} syncUrl hideHeading />
      </div>
      <NewsletterCta />
    </div>
  );
}
