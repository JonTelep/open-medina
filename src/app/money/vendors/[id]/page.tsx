"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { formatMoney, formatMoneyPrecise } from "@/components/money-format";

interface VendorData {
  vendorName: string;
  payments: Array<{
    id: number;
    amount: number;
    department: string | null;
    description: string | null;
    checkNumber: string | null;
    fund: string | null;
    docketDate: string;
  }>;
  totalAmount: number;
}

export default function VendorDetailPage() {
  const params = useParams();
  const [data, setData] = useState<VendorData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/money/vendors/${params.id}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <p className="text-[var(--muted)]">Loading...</p>;
  if (!data) return <p className="text-[var(--muted)]">Vendor not found</p>;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/money" className="text-sm text-[var(--accent)] hover:underline">
          &larr; Money Flow
        </Link>
        <h1 className="mt-2 text-2xl font-bold">{data.vendorName}</h1>
        <p className="mt-1 text-[var(--muted)]">
          {data.payments.length} payment{data.payments.length !== 1 ? "s" : ""} totaling{" "}
          <span className="font-mono font-semibold">{formatMoney(data.totalAmount)}</span>
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-[var(--border)] bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-gray-50">
              <th className="px-4 py-3 text-left font-medium text-[var(--muted)]">Date</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--muted)]">Description</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--muted)]">Department</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--muted)]">Fund</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--muted)]">Check #</th>
              <th className="px-4 py-3 text-right font-medium text-[var(--muted)]">Amount</th>
            </tr>
          </thead>
          <tbody>
            {data.payments.map((p) => (
              <tr key={p.id} className="border-b border-[var(--border)] last:border-0">
                <td className="px-4 py-3">{p.docketDate}</td>
                <td className="px-4 py-3">{p.description}</td>
                <td className="px-4 py-3">{p.department}</td>
                <td className="px-4 py-3">{p.fund}</td>
                <td className="px-4 py-3">{p.checkNumber}</td>
                <td className="px-4 py-3 text-right font-mono">{formatMoneyPrecise(p.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
