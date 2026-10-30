// Checks README.md against assets/: every referenced image exists, every file in
// assets/ is used, and every "#anchor" link points at a heading or an explicit id.
// Run by `npm run lint`.
import { existsSync, readdirSync, readFileSync } from "node:fs";

const README = "README.md";
const ASSETS = "assets";
const text = readFileSync(README, "utf8");
const errors = [];

// Headings inside fenced code blocks are not headings
const prose = text.replace(/^(`{3,})[^\n]*\n[\s\S]*?^\1`*\s*$/gm, "");

// GitHub's heading slug: lower case, drop punctuation and emoji, spaces to hyphens
const slug = (heading) =>
  heading
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, "")
    .replace(/\s/g, "-");

const anchors = new Set();
const seen = new Map();
for (const [, heading] of prose.matchAll(/^#{1,6}\s+(.+?)\s*#*\s*$/gm)) {
  const base = slug(heading.replace(/`/g, ""));
  const n = seen.get(base) ?? 0;
  seen.set(base, n + 1);
  anchors.add(n ? `${base}-${n}` : base);
}
for (const [, id] of text.matchAll(/\b(?:id|name)="([^"]+)"/g)) anchors.add(id);

for (const [, target] of prose.matchAll(/(?:\]\(|href=")#([^)"\s]+)/g)) {
  if (!anchors.has(decodeURIComponent(target))) errors.push(`broken link #${target}`);
}

const used = new Set();
for (const [, path] of text.matchAll(/\b(assets\/[^)"'\s]+)/g)) {
  used.add(path);
  if (!existsSync(path)) errors.push(`missing image ${path}`);
}
for (const file of readdirSync(ASSETS)) {
  if (file.startsWith(".")) continue;
  if (!used.has(`${ASSETS}/${file}`)) errors.push(`unused asset ${ASSETS}/${file} (delete it or use it in ${README})`);
}

if (errors.length) {
  console.error(`${README}:\n  ${errors.join("\n  ")}`);
  process.exit(1);
}
