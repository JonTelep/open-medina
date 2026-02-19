/**
 * Shared HTTP utilities for scrapers.
 * Provides fetch-with-retry and HTML parsing via cheerio.
 */

import * as cheerio from "cheerio";
import type { CheerioAPI } from "cheerio";

const USER_AGENT =
  "MedinaCountyAccountabilityTracker/1.0 (open-source civic data project)";

const DEFAULT_RETRY_COUNT = 3;
const RETRY_DELAY_MS = 2000;

/**
 * Fetch a URL with retry logic, user-agent header, and error handling.
 * Returns the Response object on success.
 */
export async function fetchPage(
  url: string,
  retries = DEFAULT_RETRY_COUNT
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": USER_AGENT,
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        redirect: "follow",
      });

      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status} ${response.statusText} for ${url}`
        );
      }

      return response;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(
        `  Attempt ${attempt}/${retries} failed for ${url}: ${lastError.message}`
      );

      if (attempt < retries) {
        const delay = RETRY_DELAY_MS * attempt;
        console.warn(`  Retrying in ${delay}ms...`);
        await sleep(delay);
      }
    }
  }

  throw new Error(
    `Failed to fetch ${url} after ${retries} attempts: ${lastError?.message}`
  );
}

/**
 * Fetch a URL and parse the HTML with cheerio.
 * Returns a CheerioAPI instance for DOM querying.
 */
export async function fetchHtml(url: string): Promise<CheerioAPI> {
  const response = await fetchPage(url);
  const html = await response.text();
  return cheerio.load(html);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
