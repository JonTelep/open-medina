export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  return (
    <div className="mx-auto max-w-xl py-12 text-center">
      <h1 className="text-3xl font-bold text-[var(--navy)]">Medina This Week</h1>
      <p className="mt-4 text-lg">
        {status === "done"
          ? "You are unsubscribed. You will not get any more emails from us."
          : "We could not find that subscription. It may already be removed."}
      </p>
    </div>
  );
}
