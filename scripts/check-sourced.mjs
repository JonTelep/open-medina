// Build gate: numbers may only be formatted for display inside <Sourced>.
// Fails when a live page or component formats a number any other way.
// Sections listed in GATED stay hidden (see src/lib/sections.ts) until they are converted.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const GATED = ["src/app/people", "src/app/money", "src/app/docket", "src/app/meetings", "src/app/donations", "src/app/legislation/resolutions", "src/app/api"];
const ALLOW = ["src/components/sourced.tsx", "src/components/money-format.tsx"];
const PATTERNS = [
  [/\.toLocaleString\(/, "toLocaleString"],
  [/\bformatMoney\(/, "formatMoney"],
  [/Intl\.NumberFormat/, "Intl.NumberFormat"],
  [/\.toFixed\(/, "toFixed"],
  [/\{[\w.!?]*\.(length|count|total\w*|population|value|moe|record_count)\}/, "raw count in JSX"],
];

const files = [];
(function walk(d) {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.tsx$/.test(p)) files.push(p);
  }
})("src");

const bad = [];
for (const f of files) {
  if (ALLOW.includes(f) || GATED.some((g) => f.startsWith(g + "/"))) continue;
  readFileSync(f, "utf8").split("\n").forEach((line, i) => {
    if (line.includes("sourced-ok")) return;
    for (const [re, why] of PATTERNS) if (re.test(line)) bad.push(`${f}:${i + 1} ${why}: ${line.trim()}`);
  });
}
if (bad.length) {
  console.error("Numbers rendered without <Sourced>:\n" + bad.join("\n"));
  process.exit(1);
}
console.log(`check-sourced: ${files.length} files ok`);
