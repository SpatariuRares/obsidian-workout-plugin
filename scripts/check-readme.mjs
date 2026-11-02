// Checks README.md and every translation (README.<lang>.md) against assets/: every
// referenced image exists, every file in assets/ is used by some README, and every
// "#anchor" link points at a heading or an explicit id. A translation must also keep
// README.md's structure (same headings, code blocks and images in the same count), so
// it fails when README.md changes and the translation is left behind.
// Run by `npm run lint`.
import { existsSync, readdirSync, readFileSync } from "node:fs";

const README = "README.md";
const ASSETS = "assets";
const FENCED = /^(`{3,})[^\n]*\n[\s\S]*?^\1`*\s*$/gm;

// GitHub's heading slug: lower case, drop punctuation and emoji, spaces to hyphens
const slug = (heading) =>
  heading
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}\s_-]/gu, "")
    .replace(/\s/g, "-");

const files = [README, ...readdirSync(".").filter((f) => /^README\.[A-Za-z-]+\.md$/.test(f)).sort()];
const used = new Set();
const errors = [];
const shape = {};

for (const file of files) {
  const text = readFileSync(file, "utf8");
  const found = [];
  // Headings inside fenced code blocks are not headings
  const prose = text.replace(FENCED, "");

  const anchors = new Set();
  const seen = new Map();
  let headings = 0;
  for (const [, heading] of prose.matchAll(/^#{1,6}\s+(.+?)\s*#*\s*$/gm)) {
    headings++;
    const base = slug(heading.replace(/`/g, ""));
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    anchors.add(n ? `${base}-${n}` : base);
  }
  for (const [, id] of text.matchAll(/\b(?:id|name)="([^"]+)"/g)) anchors.add(id);

  for (const [, target] of prose.matchAll(/(?:\]\(|href=")#([^)"\s]+)/g)) {
    if (!anchors.has(decodeURIComponent(target))) found.push(`broken link #${target}`);
  }

  const images = [];
  for (const [, path] of text.matchAll(/\b(assets\/[^)"'\s]+)/g)) {
    used.add(path);
    images.push(path);
    if (!existsSync(path)) found.push(`missing image ${path}`);
  }

  shape[file] = { headings, blocks: [...text.matchAll(FENCED)].length, images: images.join("\n") };
  if (file !== README) {
    const base = shape[README];
    for (const key of ["headings", "blocks"]) {
      if (shape[file][key] !== base[key]) {
        found.push(`${key}: ${shape[file][key]}, but ${README} has ${base[key]} (out of date?)`);
      }
    }
    if (shape[file].images !== base.images) found.push(`images differ from ${README} (order or set)`);
  }
  if (found.length) errors.push(`${file}:\n  ${found.join("\n  ")}`);
}

for (const file of readdirSync(ASSETS)) {
  if (file.startsWith(".")) continue;
  if (!used.has(`${ASSETS}/${file}`)) errors.push(`unused asset ${ASSETS}/${file} (delete it or use it in ${README})`);
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
