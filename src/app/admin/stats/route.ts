import { timingSafeEqual } from "crypto";
import { stats } from "@/lib/analytics";

export const dynamic = "force-dynamic";

const esc = (v: unknown) => String(v ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

function authed(req: Request) {
  const pw = process.env.STATS_PASSWORD;
  const h = req.headers.get("authorization") || "";
  if (!pw || !h.startsWith("Basic ")) return false;
  const given = Buffer.from(Buffer.from(h.slice(6), "base64").toString().split(":").slice(1).join(":"));
  const want = Buffer.from(pw);
  return given.length === want.length && timingSafeEqual(given, want);
}

function table(title: string, rows: Record<string, unknown>[], cols: string[]) {
  const body = rows.length
    ? rows.map((r) => `<tr>${cols.map((c) => `<td>${esc(r[c])}</td>`).join("")}</tr>`).join("")
    : `<tr><td colspan="${cols.length}">No data yet</td></tr>`;
  return `<h2>${title}</h2><table><tr>${cols.map((c) => `<th>${c}</th>`).join("")}</tr>${body}</table>`;
}

// Private stats page. HTTP Basic auth (any username, password = STATS_PASSWORD). No cookies.
export async function GET(req: Request) {
  const headers = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" };
  if (!authed(req))
    return new Response("Authentication required", { status: 401, headers: { ...headers, "WWW-Authenticate": 'Basic realm="OpenMedina stats"' } });
  const s = stats();
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><meta name="viewport" content="width=device-width,initial-scale=1"><title>OpenMedina stats</title>
<style>body{font-family:system-ui,sans-serif;max-width:900px;margin:2rem auto;padding:0 1rem;color:#0b1f4d}table{border-collapse:collapse;width:100%;margin-bottom:1.5rem}td,th{border-bottom:1px solid #ddd;padding:.35rem .5rem;text-align:left}.k{display:flex;gap:2rem}.k div{font-size:1.6rem;font-weight:700}.k span{display:block;font-size:.8rem;font-weight:400;color:#555}</style></head><body>
<h1>OpenMedina stats</h1><p>Times in UTC. Last 7 days unless noted. No cookies, IPs, or user agents are stored.</p>
<div class="k"><div>${s.today}<span>views today (UTC)</span></div><div>${s.week}<span>views, 7 days</span></div><div>${s.signupsWeek}<span>signups, 7 days</span></div></div>
${table("Views by day", s.daily, ["day", "views"])}
${table("Views and signups by utm_source / campaign", s.sources, ["s", "c", "views", "signups"]).replace("<th>s</th><th>c</th>", "<th>utm_source</th><th>utm_campaign</th>")}
${table("Top pages", s.pages, ["path", "views"])}
${table("Referrers", s.referrers, ["host", "views"])}
${table("Devices", s.devices, ["device", "views"])}
</body></html>`;
  return new Response(html, { headers: { ...headers, "Content-Type": "text/html; charset=utf-8" } });
}
