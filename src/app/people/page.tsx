"use client";

import { SearchBar } from "@/components/search-bar";
import { DataTable } from "@/components/data-table";
import Link from "next/link";
import { useEffect, useState } from "react";

interface Person {
  id: number;
  displayName: string;
  type: string;
  department: string | null;
  title: string | null;
}

const PAGE_SIZE = 50;

export default function PeoplePage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (department) params.set("department", department);
    params.set("limit", String(PAGE_SIZE));
    params.set("offset", String(page * PAGE_SIZE));

    fetch(`/api/people?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setPeople(data.people);
        setDepartments(data.departments);
        setTotal(data.total);
      })
      .finally(() => setLoading(false));
  }, [search, department, page]);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [search, department]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">People Directory</h1>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by name..."
            className="w-full rounded-lg border border-[var(--border)] bg-white px-4 py-2 text-sm focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-light)]"
          />
        </div>
        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="rounded-lg border border-[var(--border)] bg-white px-4 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
        >
          <option value="">All departments</option>
          {departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-[var(--muted)]">Loading...</p>
      ) : (
        <>
          <p className="text-sm text-[var(--muted)]">
            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
          </p>
          <DataTable
            data={people}
            emptyMessage="No people found"
            onRowClick={(row) => {
              window.location.href = `/people/${row.id}`;
            }}
            columns={[
              {
                key: "displayName",
                header: "Name",
                render: (row) => (
                  <Link
                    href={`/people/${row.id}`}
                    className="font-medium text-[var(--accent)] hover:underline"
                  >
                    {row.displayName}
                  </Link>
                ),
              },
              { key: "title", header: "Title" },
              { key: "department", header: "Department" },
              {
                key: "type",
                header: "Type",
                render: (row) => (
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      row.type === "person"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {row.type}
                  </span>
                ),
              },
            ]}
          />
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm text-[var(--muted)]">
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
