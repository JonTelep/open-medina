import Link from "next/link";
import { Logo } from "./logo";
import { NewsletterForm } from "./forms";

const local = [
  { href: "https://www.medinacounty.gov", label: "Medina County" },
  { href: "https://www.medinaoh.org", label: "City of Medina" },
  { href: "https://www.brunswick.oh.us", label: "City of Brunswick" },
  { href: "https://www.wadsworthcity.com", label: "City of Wadsworth" },
  { href: "https://boe.ohio.gov/medina", label: "Medina County Board of Elections" },
  { href: "https://www.ohiosos.gov", label: "Ohio Secretary of State" },
];

export function Footer() {
  return (
    <footer className="mt-16 border-t-4 border-[var(--royal)] bg-[var(--navy)] text-blue-50">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3 lg:px-8">
        <div>
          <div className="flex items-center gap-3">
            <Logo size={48} className="rounded-lg" />
            <span className="text-xl font-bold text-white">
              Open<span className="text-[var(--gold)]">Medina</span>
            </span>
          </div>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-blue-100">
            Open government for Medina County, Ohio. Built for the residents of Medina, Brunswick, Wadsworth and
            every township in between.
          </p>
          <h2 className="mt-6 text-sm font-semibold uppercase tracking-wider text-[var(--gold)]">Medina This Week</h2>
          <p className="mt-1 text-sm text-blue-100">A weekly email with new agendas and data updates.</p>
          <div className="mt-2"><NewsletterForm dark /></div>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--gold)]">Explore</h2>
          <ul className="mt-3 grid grid-cols-2 gap-2 text-sm">
            {[
              ["/search", "Ask Medina"],
              ["/local", "Local Government"],
              ["/people", "People"],
              ["/money", "Money"],
              ["/docket", "Docket"],
              ["/meetings", "Meetings"],
              ["/donations", "Donations"],
              ["/legislation", "Legislation"],
              ["/about", "About"],
              ["/contact", "Report an issue"],
            ].map(([href = "", label]) => (
              <li key={href}>
                <Link href={href} className="hover:text-white hover:underline">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--gold)]">Official sources</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {local.map((l) => (
              <li key={l.href}>
                <a href={l.href} target="_blank" rel="noopener noreferrer" className="hover:text-white hover:underline">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-7xl px-4 py-4 text-xs text-blue-200 sm:px-6 lg:px-8">
          OpenMedina is an independent project and is not affiliated with any government office. Nothing here is legal
          advice. Always confirm details with the official source.
        </p>
      </div>
    </footer>
  );
}
