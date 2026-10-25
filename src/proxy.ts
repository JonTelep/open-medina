import { NextResponse, type NextRequest, type NextFetchEvent } from "next/server";

const BOT_RE = /bot|crawl|spider|slurp|preview|facebookexternalhit|meta-externalagent|headless|lighthouse|pingdom|uptime|monitor|curl|wget|python|go-http|java\/|axios|node-fetch|httpclient|scrapy|semrush|ahrefs|embedly|whatsapp|telegram|discord|slack/i;

function device(ua: string) {
  if (/ipad|tablet/i.test(ua)) return "tablet";
  if (/mobi|iphone|android/i.test(ua)) return "mobile";
  return "desktop";
}

// Counts page views. Nothing personal is stored: no IP, no cookie, no user agent.
export function proxy(req: NextRequest, event: NextFetchEvent) {
  const key = process.env.STATS_PASSWORD;
  const ua = req.headers.get("user-agent") || "";
  const prefetch = req.headers.get("next-router-prefetch") || /prefetch/i.test(req.headers.get("purpose") || req.headers.get("sec-purpose") || "");
  if (key && req.method === "GET" && ua && !BOT_RE.test(ua) && !prefetch) {
    const u = req.nextUrl;
    let referrer_host = "";
    try {
      const h = new URL(req.headers.get("referer") || "").hostname.replace(/^www\./, "");
      if (h && h !== "openmedina.org" && h !== u.hostname) referrer_host = h;
    } catch {}
    const body = {
      path: u.pathname,
      utm_source: u.searchParams.get("utm_source") || "",
      utm_medium: u.searchParams.get("utm_medium") || "",
      utm_campaign: u.searchParams.get("utm_campaign") || "",
      referrer_host,
      device: device(ua),
    };
    event.waitUntil(
      fetch(`http://127.0.0.1:${process.env.PORT || 3000}/api/pv`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-pv-key": key },
        body: JSON.stringify(body),
      }).catch(() => {}),
    );
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|admin|_next|favicon|robots|sitemap|.*\\.[a-z0-9]+$).*)"],
};
