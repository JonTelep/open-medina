"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { formatMoney, formatMoneyPrecise } from "@/components/money-format";

interface DocketDetail {
  docket: {
    id: number;
    date: string;
    title: string | null;
    totalAmount: number | null;
  };
  items: Array<{
    id: number;
    rawVendorName: string;
    department: string | null;
    description: string | null;
    amount: number;
    checkNumber: string | null;
    fund: string | null;
  }>;
}

export default function DocketDetailPage() {
  const params = useParams();
  const [data, setData] = useState<DocketDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/dockets/${params.id}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <p className="text-[var(--muted)]">Loading...</p>;
  if (!data?.docket) return <p className="text-[var(--muted)]">Docket not found</p>;

  const { docket, items } = data;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/docket" className="text-sm text-[var(--accent)] hover:underline">
          &larr; Docket List
        </Link>
        <h1 className="mt-2 text-2xl font-bold">{docket.title ?? `Docket ${docket.date}`}</h1>
        <div className="mt-1 flex gap-4 text-sm text-[var(--muted)]">
          <span>{docket.date}</span>
          {docket.totalAmount != null && (
            <span className="font-mono font-semibold">{formatMoney(docket.totalAmount)}</span>
          )}
          <span>{items.length} line items</span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-[var(--border)] bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-gray-50">
              <th className="px-4 py-3 text-left font-medium text-[var(--muted)]">Vendor</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--muted)]">Description</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--muted)]">Department</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--muted)]">Fund</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--muted)]">Check #</th>
              <th className="px-4 py-3 text-right font-medium text-[var(--muted)]">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-[var(--border)] last:border-0">
                <td className="px-4 py-3">
                  <Link
                    href={`/money/vendors/${encodeURIComponent(item.rawVendorName)}`}
                    className="text-[var(--accent)] hover:underline"
                  >
                    {item.rawVendorName}
                  </Link>
                </td>
                <td className="px-4 py-3">{item.description}</td>
                <td className="px-4 py-3">
                  {item.department && (
                    <Link
                      href={`/money/departments/${encodeURIComponent(item.department)}`}
                      className="text-[var(--accent)] hover:underline"
                    >
                      {item.department}
                    </Link>
                  )}
                </td>
                <td className="px-4 py-3">{item.fund}</td>
                <td className="px-4 py-3">{item.checkNumber}</td>
                <td className="px-4 py-3 text-right font-mono">{formatMoneyPrecise(item.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
