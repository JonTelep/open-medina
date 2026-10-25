import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8 py-8">
      <div>
        <h1 className="text-3xl font-bold">About OpenMedina</h1>
        <p className="mt-1 text-[var(--muted)]">openmedina.org</p>
      </div>

      <div className="space-y-4 text-lg leading-relaxed">
        <p>We believe in accountability through transparency.</p>
        <p>
          OpenMedina makes Medina County government data accessible and
          searchable for every resident. Salaries, spending, meeting minutes,
          campaign finance, and state legislation, all in one place.
        </p>
      </div>

      <hr className="border-[var(--border)]" />

      <div className="space-y-2">
        <p className="text-sm text-[var(--muted)]">
          Built by{" "}
          <a
            href="https://www.telep.io"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-[var(--accent)] hover:underline"
          >
            Telep IO LLC
          </a>
        </p>
      </div>
    </div>
  );
}
