"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function SearchBar({ defaultValue = "", large = false }: { defaultValue?: string; large?: boolean }) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultValue);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-2 sm:flex-row">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search people, salaries, vendors, meetings..."
        className={`min-w-0 flex-1 rounded-lg border-2 border-[var(--royal)] bg-white px-4 text-base focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-light)] ${
          large ? "py-3 text-lg" : "py-2"
        }`}
      />
      <button
        type="submit"
        className={`rounded-lg bg-[var(--royal)] font-semibold text-white hover:bg-[var(--navy)] ${
          large ? "px-6 py-3 text-lg" : "px-4 py-2 text-sm"
        }`}
      >
        Search
      </button>
    </form>
  );
}
