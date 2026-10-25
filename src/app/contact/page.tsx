import type { Metadata } from "next";
import { ContactForm } from "@/components/forms";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Contact" };

export default async function Page({ searchParams }: { searchParams: Promise<{ item?: string }> }) {
  const { item } = await searchParams;
  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-3xl font-extrabold text-[var(--navy)]">Report an issue</h1>
      <p className="mt-2 text-[var(--muted)]">
        Found a wrong number, a broken link, or something missing? Tell us what and where, and we will check it against
        the official source and fix it.
      </p>
      <div className="mt-6 rounded-xl border border-[var(--royal)] bg-white p-6">
        <ContactForm item={item?.slice(0, 300) ?? ""} />
      </div>
    </div>
  );
}
