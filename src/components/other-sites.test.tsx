import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { OtherSites } from "./other-sites";

const EXPECTED: { href: string; label: string }[] = [
  { href: "https://telep.io/", label: "telep.io websites for small businesses" },
  { href: "https://bloomer.news/", label: "Bloomer News, positive AI news" },
  { href: "https://starterloot.com/", label: "StarterLoot, free AI tools for game devs" },
  { href: "https://publaish.com/", label: "Publaish, AI search visibility tracker" },
  { href: "https://letstalkstatistics.com/", label: "Let's Talk Statistics, official figures with sources" },
  { href: "https://minesswept.com/", label: "minesSwept, shared giant minesweeper" },
  { href: "https://memes.telep.io/", label: "telep.io memes" },
  { href: "https://white.telep.io/", label: "white.telep.io, filming light and camera test" },
  { href: "https://seo.telep.io/", label: "AskMentions, see if AI answers mention you" },
];

describe("Our other sites", () => {
  const html = renderToStaticMarkup(<OtherSites />).replace(/&#x27;|&apos;/g, "'");

  test("shows a visible row with descriptive plain links", () => {
    expect(html).toContain("Our other sites:");
    expect(html).not.toMatch(/\u2013|\u2014/);
    expect(html).not.toMatch(/nofollow|sponsored|ugc/);
    expect(html).not.toContain("hidden");
    expect(html).not.toContain("display:none");
    expect(html).not.toContain("openmedina.org");
    expect(html).toContain("https://telep.io/");

    const anchors = [...html.matchAll(/<a\b([^>]*)>(.*?)<\/a>/g)];
    expect(anchors.map(([, attrs, label]) => ({ attrs, label }))).toEqual(
      EXPECTED.map((site) => ({
        attrs: ` href="${site.href}" class="hover:text-white hover:underline"`,
        label: site.label,
      })),
    );
  });
});
