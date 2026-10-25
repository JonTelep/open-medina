"use client";
import { useEffect } from "react";

// Remembers the landing utm tags for this tab only (sessionStorage, not a cookie)
// so a newsletter signup can be attributed to the campaign that brought the visit.
export function UtmKeeper() {
  useEffect(() => {
    try {
      if (sessionStorage.getItem("om_utm")) return;
      const p = new URLSearchParams(location.search);
      const v = { utm_source: p.get("utm_source") || "", utm_medium: p.get("utm_medium") || "", utm_campaign: p.get("utm_campaign") || "" };
      sessionStorage.setItem("om_utm", JSON.stringify(v));
    } catch {}
  }, []);
  return null;
}

export function landingUtm(): Record<string, string> {
  try {
    return JSON.parse(sessionStorage.getItem("om_utm") || "{}");
  } catch {
    return {};
  }
}
