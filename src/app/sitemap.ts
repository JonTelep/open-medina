import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import { liveSections } from "@/lib/sections";
import { sqlite } from "@/db/index";

export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ["/", ...liveSections().map((s) => s.href), "/contact"];
  let bills: { id: number }[] = [];
  try {
    bills = sqlite.prepare("SELECT id FROM bills ORDER BY id").all() as { id: number }[];
  } catch {
    bills = [];
  }
  return [...new Set(paths)].map((p) => ({ url: `${SITE.url}${p === "/" ? "" : p}` })).concat(bills.map((b) => ({ url: `${SITE.url}/legislation/bills/${b.id}` })));
}
