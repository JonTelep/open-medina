import Link from "next/link";
import { SearchBar } from "@/components/search-bar";
import { StatCard } from "@/components/stat-card";
import { AskMedina } from "@/components/ask-medina";
import { Logo } from "@/components/logo";
import { getDashboardStats } from "@/db/queries/stats";
import { formatMoney } from "@/components/money-format";
import { MEDINA_FACTS } from "@/lib/site";

export const dynamic = "force-dynamic";

const SECTIONS = [
  { href: "/people", title: "People Directory", body: "Browse employees, officials, and vendors. See salary history, payment records, and connections." },
  { href: "/money", title: "Money Flow", body: "Explore spending by department, top vendors, and payment timelines with interactive charts." },
  { href: "/docket", title: "Weekly Docket", body: "Browse weekly payment batches approved by commissioners. Filter by vendor, department, or amount." },
  { href: "/meetings", title: "Meeting Minutes", body: "Search commissioner meeting minutes. See who was mentioned and what was discussed." },
  { href: "/donations", title: "Campaign Finance", body: "Explore campaign contributions by candidate or donor. See who funds local elections." },
  { href: "/legislation", title: "State Legislation", body: "Track Ohio bills and see how Medina County's representatives vote. Browse county resolutions." },
];

export default function HomePage() {
  const stats = getDashboardStats();
  const hasData = stats.totalPeople + stats.totalDocketItems + stats.totalCampaigns + stats.totalBills > 0;
  const facts = MEDINA_FACTS.filter((f) => f.label && f.detail);

  return (
    <div className="space-y-14">
      {/* Hero */}
      <section className="bg-sunburst relative left-1/2 -mt-6 w-screen -translate-x-1/2 border-b-4 border-[var(--gold)] text-white">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[1fr_1.3fr] lg:gap-12 lg:px-8 lg:py-16">
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <Logo size={140} className="rounded-3xl shadow-xl ring-2 ring-[var(--royal)] sm:h-[180px] sm:w-[180px]" />
            <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--gold)]">Medina County, Ohio</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-5xl">
              Your county, <span className="text-[var(--gold)]">in the open.</span>
            </h1>
            <p className="mt-4 max-w-md text-base leading-relaxed text-blue-100 sm:text-lg">
              From the historic Public Square in Medina to city halls in Brunswick and Wadsworth, ask a question and get
              linked straight to the official source.
            </p>
          </div>

          <div className="rounded-2xl border-2 border-[var(--royal)] bg-white p-4 text-[var(--foreground)] shadow-2xl sm:p-6">
            <AskMedina />
          </div>
        </div>
      </section>

      {/* Facts slot: fill MEDINA_FACTS in src/lib/site.ts */}
      {facts.length > 0 && (
        <section aria-labelledby="facts-heading">
          <h2 id="facts-heading" className="text-2xl font-bold">About Medina County</h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {facts.map((f) => (
              <li key={f.label} className="rounded-xl border border-[var(--royal)] border-l-4 border-l-[var(--gold)] bg-white p-5">
                <p className="text-sm font-semibold text-[var(--royal)]">{f.label}</p>
                <p className="mt-1 text-slate-700">{f.detail}</p>
                {f.sourceUrl && (
                  <a href={f.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs text-[var(--muted)] underline">
                    Source
                  </a>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Explore */}
      <section aria-labelledby="explore-heading">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="explore-heading" className="text-2xl font-bold">Explore public records</h2>
            <p className="mt-1 text-[var(--muted)]">Salaries, spending, meetings, campaign finance, and legislation in one place.</p>
          </div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SECTIONS.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="group rounded-xl border border-[var(--royal)] bg-white p-6 transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              <span className="mb-3 block h-1 w-10 rounded bg-[var(--gold)] transition-all group-hover:w-16" aria-hidden />
              <h3 className="text-lg font-semibold text-[var(--navy)]">{s.title}</h3>
              <p className="mt-1 text-sm text-[var(--muted)]">{s.body}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Stats, only when real data has been loaded */}
      {hasData && (
        <section aria-labelledby="stats-heading">
          <h2 id="stats-heading" className="text-2xl font-bold">By the numbers</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <StatCard label="People" value={stats.totalPeople.toLocaleString()} sub="Tracked entities" />
            <StatCard
              label="Salary Records"
              value={stats.totalSalaryRecords.toLocaleString()}
              sub={stats.salaryYearMin && stats.salaryYearMax ? `${stats.salaryYearMin} to ${stats.salaryYearMax}` : undefined}
            />
            <StatCard label="Docket Payments" value={stats.totalDocketItems.toLocaleString()} sub={`${stats.totalDockets} dockets`} />
            <StatCard label="Total Spending" value={formatMoney(stats.totalSpending)} sub="Docket payments" />
            <StatCard label="Campaigns" value={stats.totalCampaigns.toLocaleString()} sub={`${formatMoney(stats.totalDonationAmount)} donated`} />
            <StatCard label="Bills Tracked" value={stats.totalBills.toLocaleString()} sub={`${stats.totalResolutions} resolutions`} />
          </div>
        </section>
      )}

      {/* Database search */}
      <section aria-labelledby="db-heading" className="rounded-2xl border border-[var(--royal)] bg-[var(--accent-light)] p-6 sm:p-8">
        <h2 id="db-heading" className="text-xl font-bold">Search the OpenMedina database</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">Look up people, salaries, vendors, meetings, and more from records we have collected.</p>
        <div className="mt-4">
          <SearchBar large />
        </div>
      </section>
    </div>
  );
}
