import { NewsletterForm } from "./forms";

export const NEWSLETTER_PITCH = "Get one short email each week with new agendas, votes and data for Medina County.";

export function NewsletterCta() {
  return (
    <section aria-label="Weekly email" className="rounded-xl border-2 border-[var(--gold)] bg-[var(--accent-light)] p-5">
      <p className="font-semibold text-[var(--navy)]">{NEWSLETTER_PITCH}</p>
      <div className="mt-3 max-w-xl"><NewsletterForm /></div>
    </section>
  );
}
