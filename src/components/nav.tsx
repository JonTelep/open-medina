"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Logo } from "./logo";

const links = [
  { href: "/search", label: "Ask Medina" },
  { href: "/local", label: "Local" },
  { href: "/people", label: "People" },
  { href: "/money", label: "Money" },
  { href: "/docket", label: "Docket" },
  { href: "/meetings", label: "Meetings" },
  { href: "/donations", label: "Donations" },
  { href: "/legislation", label: "Legislation" },
  { href: "/about", label: "About" },
];

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b-2 border-[var(--gold)] bg-[var(--navy)] text-white">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:text-[var(--navy)]">
        Skip to content
      </a>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <Logo size={40} className="rounded-lg" />
          <span className="leading-tight">
            <span className="block text-lg font-bold tracking-tight">
              Open<span className="text-[var(--gold)]">Medina</span>
            </span>
            <span className="hidden text-xs text-blue-100 sm:block">Medina County, Ohio</span>
          </span>
        </Link>

        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex gap-1">
            {links.map((link) => {
              const active = pathname.startsWith(link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      active ? "bg-[var(--gold)] text-[var(--navy)]" : "text-blue-50 hover:bg-white/10"
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <button
          type="button"
          className="rounded-md border border-white/30 px-3 py-2 text-sm font-medium lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      {open && (
        <nav id="mobile-nav" aria-label="Main" className="border-t border-white/15 lg:hidden">
          <ul className="mx-auto grid max-w-7xl grid-cols-2 gap-1 px-4 py-3">
            {links.map((link) => {
              const active = pathname.startsWith(link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={`block rounded-md px-3 py-2.5 text-base font-medium ${
                      active ? "bg-[var(--gold)] text-[var(--navy)]" : "text-blue-50 hover:bg-white/10"
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </header>
  );
}
