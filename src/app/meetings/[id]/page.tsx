"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface MeetingDetail {
  meeting: {
    id: number;
    date: string;
    title: string | null;
    body: string | null;
    source: string;
  };
  mentions: Array<{
    id: number;
    meetingId: number;
    personId: number | null;
    rawName: string;
    context: string | null;
    personName: string | null;
  }>;
}

function highlightMentions(body: string, mentionNames: string[]): string {
  if (mentionNames.length === 0) return body;

  // Escape special regex chars in names, sort longest first for greedy matching
  const sorted = [...mentionNames].sort((a, b) => b.length - a.length);
  const escaped = sorted.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const pattern = new RegExp(`(${escaped.join("|")})`, "gi");
  return body.replace(pattern, '<mark class="bg-yellow-200 rounded px-0.5">$1</mark>');
}

export default function MeetingDetailPage() {
  const params = useParams();
  const [data, setData] = useState<MeetingDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/meetings/${params.id}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <p className="text-[var(--muted)]">Loading...</p>;
  if (!data?.meeting) return <p className="text-[var(--muted)]">Meeting not found</p>;

  const { meeting, mentions } = data;
  const mentionNames = mentions.map((m) => m.rawName);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/meetings"
          className="text-sm text-[var(--accent)] hover:underline"
        >
          &larr; Meeting Minutes
        </Link>
        <h1 className="mt-2 text-2xl font-bold">
          {meeting.title ?? `Meeting ${meeting.date}`}
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">{meeting.date}</p>
      </div>

      {/* Mentions */}
      {mentions.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">
            People Mentioned ({mentions.length})
          </h2>
          <div className="flex flex-wrap gap-2">
            {mentions.map((m) => (
              <span key={m.id}>
                {m.personId ? (
                  <Link
                    href={`/people/${m.personId}`}
                    className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800 hover:bg-blue-200"
                  >
                    {m.personName ?? m.rawName}
                  </Link>
                ) : (
                  <span className="inline-block rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                    {m.rawName}
                  </span>
                )}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Full Text */}
      {meeting.body && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Full Text</h2>
          <div
            className="prose max-w-none rounded-lg border border-[var(--border)] bg-white p-6 text-sm leading-relaxed whitespace-pre-wrap"
            dangerouslySetInnerHTML={{
              __html: highlightMentions(meeting.body, mentionNames),
            }}
          />
        </section>
      )}
    </div>
  );
}
