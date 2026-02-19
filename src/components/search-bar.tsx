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
    <form onSubmit={handleSubmit} className="flex w-full gap-2">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search people, salaries, vendors, meetings..."
        className={`flex-1 rounded-lg border border-[var(--border)] bg-white px-4 focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-light)] ${
          large ? "py-3 text-lg" : "py-2 text-sm"
        }`}
      />
      <button
        type="submit"
        className={`rounded-lg bg-[var(--accent)] font-medium text-white hover:bg-blue-800 ${
          large ? "px-6 py-3 text-lg" : "px-4 py-2 text-sm"
        }`}
      >
        Search
      </button>
    </form>
  );
}
