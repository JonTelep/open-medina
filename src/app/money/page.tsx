"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatMoney } from "@/components/money-format";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";

interface MoneyData {
  byDepartment: Array<{
    department: string | null;
    totalAmount: number;
    itemCount: number;
  }>;
  topVendors: Array<{
    vendorName: string;
    personId: number | null;
    totalAmount: number;
    paymentCount: number;
  }>;
  timeline: Array<{
    month: string;
    totalAmount: number;
    itemCount: number;
  }>;
  totalSpending: number;
  departments: string[];
}

export default function MoneyPage() {
  const [data, setData] = useState<MoneyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/money")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-[var(--muted)]">Loading...</p>;
  if (!data) return <p className="text-[var(--muted)]">Failed to load data</p>;

  const deptChartData = data.byDepartment
    .filter((d) => d.department)
    .slice(0, 15)
    .map((d) => ({
      name: d.department!.length > 20 ? d.department!.slice(0, 18) + "..." : d.department!,
      fullName: d.department!,
      amount: Math.round(d.totalAmount),
    }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Money Flow</h1>
        <p className="mt-1 text-[var(--muted)]">
          Total tracked spending: <span className="font-mono font-semibold">{formatMoney(data.totalSpending)}</span>
        </p>
      </div>

      {/* Department Spending Chart */}
      {deptChartData.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Spending by Department</h2>
          <div className="rounded-lg border border-[var(--border)] bg-white p-4">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={deptChartData} layout="vertical" margin={{ left: 140 }}>
                <XAxis
                  type="number"
                  tickFormatter={(v: number) => formatMoney(v)}
                />
                <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 12 }} />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <Tooltip
                  formatter={(value: any) => formatMoney(Number(value))}
                  labelFormatter={(label: any) => {
                    const item = deptChartData.find((d) => d.name === label);
                    return item?.fullName ?? label;
                  }}
                />
                <Bar dataKey="amount" fill="#1d4ed8" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {data.byDepartment
              .filter((d) => d.department)
              .map((d) => (
                <Link
                  key={d.department}
                  href={`/money/departments/${encodeURIComponent(d.department!)}`}
                  className="rounded-full border border-[var(--border)] px-3 py-1 text-xs hover:bg-gray-50"
                >
                  {d.department}
                </Link>
              ))}
          </div>
        </section>
      )}

      {/* Spending Timeline */}
      {data.timeline.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Spending Timeline</h2>
          <div className="rounded-lg border border-[var(--border)] bg-white p-4">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.timeline}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(v: number) => formatMoney(v)} />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <Tooltip formatter={(value: any) => formatMoney(Number(value))} />
                <Line
                  type="monotone"
                  dataKey="totalAmount"
                  stroke="#1d4ed8"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Spending"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* Top Vendors */}
      {data.topVendors.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Top Vendors</h2>
          <div className="overflow-x-auto rounded-lg border border-[var(--border)] bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-gray-50">
                  <th className="px-4 py-3 text-left font-medium text-[var(--muted)]">#</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--muted)]">Vendor</th>
                  <th className="px-4 py-3 text-right font-medium text-[var(--muted)]">Payments</th>
                  <th className="px-4 py-3 text-right font-medium text-[var(--muted)]">Total</th>
                </tr>
              </thead>
              <tbody>
                {data.topVendors.map((v, i) => (
                  <tr key={v.vendorName} className="border-b border-[var(--border)] last:border-0">
                    <td className="px-4 py-3 text-[var(--muted)]">{i + 1}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/money/vendors/${encodeURIComponent(v.vendorName)}`}
                        className="font-medium text-[var(--accent)] hover:underline"
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
    </div>
  );
}
