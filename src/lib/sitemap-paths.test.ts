import { describe, expect, test } from "bun:test";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { collectSitemapPaths } from "./sitemap-paths";

// Confirmation page, and the bills index which redirects to /legislation.
const EXCLUDED = new Set(["/unsubscribe", "/legislation/bills"]);

function pageRoutes(dir: string, prefix = ""): string[] {
  const routes: string[] = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      if (name === "api" || name === "admin") continue;
      routes.push(...pageRoutes(path, `${prefix}/${name}`));
    } else if (name === "page.tsx") {
      routes.push(prefix || "/");
    }
  }
  return routes;
}

function query(sql: string): string[] {
  if (sql.includes("raw_donor_name") || sql.includes("raw_vendor_name") || sql.includes("department")) return ["A B"];
  return ["7"];
}

const sample: Record<string, string> = {
  "/legislation/bills/[id]": "/legislation/bills/7",
  "/legislation/legislators/[id]": "/legislation/legislators/7",
  "/people/[id]": "/people/7",
  "/meetings/[id]": "/meetings/7",
  "/docket/[id]": "/docket/7",
  "/donations/campaigns/[id]": "/donations/campaigns/7",
  "/donations/donors/[name]": `/donations/donors/${encodeURIComponent("A B")}`,
  "/money/departments/[slug]": `/money/departments/${encodeURIComponent("A B")}`,
  "/money/vendors/[id]": `/money/vendors/${encodeURIComponent("A B")}`,
};

describe("sitemap paths", () => {
  const routes = pageRoutes(join(import.meta.dir, "../app"));
  const liveHrefs = routes.filter((route) => !route.includes("[") && !EXCLUDED.has(route) && route !== "/" && route !== "/contact" && route !== "/legislation/resolutions");

  test("covers every public page", () => {
    const paths = collectSitemapPaths(liveHrefs, () => true, query);
    for (const route of routes) {
      if (EXCLUDED.has(route)) {
        expect(paths).not.toContain(route);
        continue;
      }
      const expected = route.includes("[") ? sample[route] : route;
      if (!expected) throw new Error(`No sitemap sample for ${route}`);
      expect(paths).toContain(expected);
    }
    expect(paths).toContain("/");
    expect(paths).toContain("/contact");
    expect(paths.some((path) => path.startsWith("http"))).toBe(false);
  });

  test("omits detail pages while their section is hidden", () => {
    const paths = collectSitemapPaths(["/search", "/about"], () => false, query);
    expect(paths).toEqual(["/", "/search", "/about", "/contact"]);
  });

  test("includes resolutions only when that section is live", () => {
    const live = (href: string) => href === "/legislation/resolutions";
    const paths = collectSitemapPaths(["/legislation"], live, query);
    expect(paths).toContain("/legislation/resolutions");
    expect(paths).not.toContain("/legislation/bills/7");
    expect(paths).not.toContain("/legislation/legislators/7");
  });

  test("encodes donor, vendor, and department names", () => {
    const paths = collectSitemapPaths([], (href) => href === "/donations" || href === "/money", query);
    expect(paths).toContain(`/donations/donors/${encodeURIComponent("A B")}`);
    expect(paths).toContain(`/money/vendors/${encodeURIComponent("A B")}`);
    expect(paths).toContain(`/money/departments/${encodeURIComponent("A B")}`);
  });
});
