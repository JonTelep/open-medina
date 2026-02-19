"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { formatMoney } from "@/components/money-format";

interface DeptData {
  department: string;
  spending: Array<{
    vendorName: string;
    totalAmount: number;
    paymentCount: number;
  }>;
  employees: Array<{
    id: number;
    personId: number | null;
    rawName: string;
    title: string | null;
    salary: number;
    year: number;
  }>;
}

export default function DepartmentDetailPage() {
  const params = useParams();
  const [data, setData] = useState<DeptData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/money/departments/${params.slug}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [params.slug]);

  if (loading) return <p className="text-[var(--muted)]">Loading...</p>;
  if (!data) return <p className="text-[var(--muted)]">Department not found</p>;

  const totalSpending = data.spending.reduce((s, v) => s + v.totalAmount, 0);

  return (
    <div className="space-y-8">
      <div>
        <Link href="/money" className="text-sm text-[var(--accent)] hover:underline">
          &larr; Money Flow
        </Link>
        <h1 className="mt-2 text-2xl font-bold">{data.department}</h1>
        <p className="mt-1 text-[var(--muted)]">
          Total vendor payments: <span className="font-mono font-semibold">{formatMoney(totalSpending)}</span>
        </p>
      </div>

      {/* Vendor Spending */}
      {data.spending.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Vendor Payments</h2>
          <div className="overflow-x-auto rounded-lg border border-[var(--border)] bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-gray-50">
                  <th className="px-4 py-3 text-left font-medium text-[var(--muted)]">Vendor</th>
                  <th className="px-4 py-3 text-right font-medium text-[var(--muted)]">Payments</th>
                  <th className="px-4 py-3 text-right font-medium text-[var(--muted)]">Total</th>
                </tr>
              </thead>
              <tbody>
                {data.spending.map((v) => (
                  <tr key={v.vendorName} className="border-b border-[var(--border)] last:border-0">
                    <td className="px-4 py-3">
                      <Link
                        href={`/money/vendors/${encodeURIComponent(v.vendorName)}`}
                        className="text-[var(--accent)] hover:underline"
                      >
                        {v.vendorName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right">{v.paymentCount}</td>
                    <td className="px-4 py-3 text-right font-mono">{formatMoney(v.totalAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Employees */}
      {data.employees.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Employees</h2>
          <div className="overflow-x-auto rounded-lg border border-[var(--border)] bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-gray-50">
                  <th className="px-4 py-3 text-left font-medium text-[var(--muted)]">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--muted)]">Title</th>
                  <th className="px-4 py-3 text-right font-medium text-[var(--muted)]">Year</th>
                  <th className="px-4 py-3 text-right font-medium text-[var(--muted)]">Salary</th>
                </tr>
              </thead>
              <tbody>
                {data.employees.map((e, i) => (
                  <tr key={i} className="border-b border-[var(--border)] last:border-0">
                    <td className="px-4 py-3">
                      {e.personId ? (
                        <Link
                          href={`/people/${e.personId}`}
                          className="text-[var(--accent)] hover:underline"
                        >
                          {e.rawName}
                        </Link>
                      ) : (
                        e.rawName
                      )}
                    </td>
                    <td className="px-4 py-3">{e.title}</td>
                    <td className="px-4 py-3 text-right">{e.year}</td>
                    <td className="px-4 py-3 text-right font-mono">{formatMoney(e.salary)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
