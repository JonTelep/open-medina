// Cross-links to Jon's other sites. Plain anchors, visible, descriptive text.
// openmedina.org is this site, so it is left off the list.
const OTHER_SITES: { href: string; label: string }[] = [
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

export function OtherSites() {
  return (
    <nav aria-label="Our other sites" className="other-sites border-t border-white/10">
      <p className="mx-auto max-w-7xl px-4 py-3 text-xs leading-relaxed text-blue-200 sm:px-6 lg:px-8">
        Our other sites:{" "}
        {OTHER_SITES.map((site, i) => (
          <span key={site.href}>
            {i > 0 ? " · " : null}
            <a href={site.href} className="hover:text-white hover:underline">
              {site.label}
            </a>
          </span>
        ))}
      </p>
    </nav>
  );
}
