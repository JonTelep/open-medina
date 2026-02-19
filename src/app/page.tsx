import { SearchBar } from "@/components/search-bar";
import { StatCard } from "@/components/stat-card";
import { getDashboardStats } from "@/db/queries/stats";
import { formatMoney } from "@/components/money-format";
import Link from "next/link";

export default function HomePage() {
  const stats = getDashboardStats();

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">OpenMedina</h1>
        <p className="mt-1 text-lg text-[var(--foreground)]">Government Transparency for Medina County</p>
        <p className="mt-2 text-[var(--muted)]">
          Search public financial data — salaries, spending, meetings, campaign finance, and legislation
        </p>
      </div>

      <div className="mx-auto max-w-2xl">
        <SearchBar large />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard
          label="People"
          value={stats.totalPeople.toLocaleString()}
          sub="Tracked entities"
        />
        <StatCard
          label="Salary Records"
          value={stats.totalSalaryRecords.toLocaleString()}
          sub={
            stats.salaryYearMin && stats.salaryYearMax
              ? `${stats.salaryYearMin}–${stats.salaryYearMax}`
              : undefined
          }
        />
        <StatCard
          label="Docket Payments"
          value={stats.totalDocketItems.toLocaleString()}
          sub={`${stats.totalDockets} dockets`}
        />
        <StatCard
          label="Total Spending"
          value={formatMoney(stats.totalSpending)}
          sub="Docket payments"
        />
        <StatCard
          label="Campaigns"
          value={stats.totalCampaigns.toLocaleString()}
          sub={`${formatMoney(stats.totalDonationAmount)} donated`}
        />
        <StatCard
          label="Bills Tracked"
          value={stats.totalBills.toLocaleString()}
          sub={`${stats.totalResolutions} resolutions`}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/people"
          className="rounded-lg border border-[var(--border)] bg-white p-6 transition-shadow hover:shadow-md"
        >
          <h2 className="text-lg font-semibold">People Directory</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Browse employees, officials, and vendors. See salary history, payment records, and connections.
          </p>
        </Link>
        <Link
          href="/money"
          className="rounded-lg border border-[var(--border)] bg-white p-6 transition-shadow hover:shadow-md"
        >
          <h2 className="text-lg font-semibold">Money Flow</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Explore spending by department, top vendors, and payment timelines with interactive charts.
          </p>
        </Link>
        <Link
          href="/docket"
          className="rounded-lg border border-[var(--border)] bg-white p-6 transition-shadow hover:shadow-md"
        >
          <h2 className="text-lg font-semibold">Weekly Docket</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Browse weekly payment batches approved by commissioners. Filter by vendor, department, or amount.
          </p>
        </Link>
        <Link
          href="/meetings"
          className="rounded-lg border border-[var(--border)] bg-white p-6 transition-shadow hover:shadow-md"
        >
          <h2 className="text-lg font-semibold">Meeting Minutes</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Search commissioner meeting minutes. See who was mentioned and what was discussed.
          </p>
        </Link>
        <Link
          href="/donations"
          className="rounded-lg border border-[var(--border)] bg-white p-6 transition-shadow hover:shadow-md"
        >
          <h2 className="text-lg font-semibold">Campaign Finance</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Explore campaign contributions by candidate or donor. See who funds local elections.
          </p>
        </Link>
        <Link
          href="/legislation"
          className="rounded-lg border border-[var(--border)] bg-white p-6 transition-shadow hover:shadow-md"
        >
          <h2 className="text-lg font-semibold">State Legislation</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Track Ohio bills and see how Medina County&apos;s representatives vote. Browse county resolutions.
          </p>
        </Link>
      </div>
    </div>
  );
}
