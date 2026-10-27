import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import { isSectionLive, liveSections } from "@/lib/sections";
import { sqlite } from "@/db/index";
import { collectSitemapPaths } from "@/lib/sitemap-paths";

export const dynamic = "force-dynamic";

function query(sql: string): string[] {
  try {
    return (sqlite.prepare(sql).all() as { v: string | number | null }[])
      .map((row) => (row.v == null ? "" : String(row.v)))
      .filter((value) => value !== "");
  } catch {
    return [];
  }
}

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = collectSitemapPaths(
    liveSections().map((s) => s.href),
    isSectionLive,
    query,
  );
  return paths.map((p) => ({ url: `${SITE.url}${p === "/" ? "" : p}` }));
}
