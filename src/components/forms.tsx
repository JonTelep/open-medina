"use client";
import { useState } from "react";

const input = "w-full rounded-lg border border-[var(--border-soft)] px-3 py-2 focus:border-[var(--royal)] focus:outline-none";
const hp = { position: "absolute" as const, left: "-10000px", width: 1, height: 1, overflow: "hidden" };

async function post(url: string, data: Record<string, string>) {
  const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || "Something went wrong.");
}

export function ContactForm({ item = "" }: { item?: string }) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [err, setErr] = useState("");
  if (state === "sent") return <p className="rounded-lg bg-[var(--accent-light)] p-4">Thanks. Your message was sent and we will look into it.</p>;
  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setErr("");
        setState("sending");
        try {
          await post("/api/contact", Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>);
          setState("sent");
        } catch (x) {
          setErr((x as Error).message);
          setState("idle");
        }
      }}
    >
      <div style={hp} aria-hidden="true">
        <label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <label className="block text-sm font-medium">Name<input name="name" required maxLength={120} className={input} /></label>
      <label className="block text-sm font-medium">Email<input name="email" type="email" required className={input} /></label>
      <label className="block text-sm font-medium">Page or item<input name="item" defaultValue={item} maxLength={300} className={input} placeholder="For example: Local Government, Wadsworth council" /></label>
      <label className="block text-sm font-medium">Message<textarea name="message" required minLength={5} maxLength={5000} rows={6} className={input} /></label>
      {err && <p className="text-sm text-red-700">{err}</p>}
      <button disabled={state === "sending"} className="rounded-lg bg-[var(--royal)] px-5 py-2 font-semibold text-white hover:bg-[var(--navy)] disabled:opacity-60">
        {state === "sending" ? "Sending..." : "Send"}
      </button>
    </form>
  );
}

export function NewsletterForm({ dark = false }: { dark?: boolean }) {
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  if (done) return <p className={dark ? "text-sm text-blue-50" : "text-sm"}>You are subscribed to Medina This Week.</p>;
  return (
    <form
      className="flex flex-col gap-2 sm:flex-row"
      onSubmit={async (e) => {
        e.preventDefault();
        setErr("");
        try {
          await post("/api/subscribe", Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>);
          setDone(true);
        } catch (x) {
          setErr((x as Error).message);
        }
      }}
    >
      <div style={hp} aria-hidden="true"><input name="website" tabIndex={-1} autoComplete="off" /></div>
      <label className="sr-only" htmlFor="nl-email">Email</label>
      <input id="nl-email" name="email" type="email" required placeholder="you@example.com" className="min-w-0 flex-1 rounded-lg border border-[var(--border-soft)] bg-white px-3 py-2 text-gray-900" />
      <button className="rounded-lg bg-[var(--gold)] px-4 py-2 font-semibold text-[var(--navy)] hover:brightness-95">Subscribe</button>
      {err && <p className={`text-sm ${dark ? "text-yellow-200" : "text-red-700"}`}>{err}</p>}
    </form>
  );
}

export function ReportLink({ item }: { item: string }) {
  return (
    <a href={`/contact?item=${encodeURIComponent(item)}`} className="text-xs text-[var(--muted)] underline hover:text-[var(--royal)]">
      Report an error
    </a>
  );
}
