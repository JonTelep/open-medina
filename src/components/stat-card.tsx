export function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--royal)] border-t-4 border-t-[var(--gold)] bg-white p-4">
      <p className="text-sm text-[var(--muted)]">{label}</p>
      <div className="mt-1 text-2xl font-bold text-[var(--navy)]">{value}</div>
      {sub && <p className="mt-0.5 text-xs text-[var(--muted)]">{sub}</p>}
    </div>
  );
}
