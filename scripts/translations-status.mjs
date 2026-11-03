// What a release still needs translated: locales missing keys of en.json, and
// README.<LANG>.md files that are missing or older than README.md.
// Used by the translate skill and by the hook that guards the release commit.
//
//   node scripts/translations-status.mjs          # report, exit 1 if anything is out of date
//   node scripts/translations-status.mjs --json   # { missingKeys: { de: [...] }, readmes: { it: {...} } }
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";

const LOCALES = "app/i18n/locales";
const README = "README.md";

const flatten = (tree, prefix = "") =>
  Object.entries(tree).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === "string" ? [path] : flatten(value, path);
  });
const keysOf = (file) => flatten(JSON.parse(readFileSync(`${LOCALES}/${file}`, "utf8")));

// The README of a locale uses its code in upper case: it → README.IT.md, pt-BR → README.PT-BR.md
const readmeFor = (code) => `README.${code.toUpperCase()}.md`;

const enKeys = keysOf("en.json");
const locales = readdirSync(LOCALES)
  .filter((file) => file.endsWith(".json") && file !== "en.json")
  .map((file) => file.slice(0, -".json".length))
  .sort();

const missingKeys = {};
const readmes = {};
for (const code of locales) {
  const have = new Set(keysOf(`${code}.json`));
  const missing = enKeys.filter((key) => !have.has(key));
  if (missing.length) missingKeys[code] = missing;

  const file = readmeFor(code);
  if (!existsSync(file)) {
    readmes[code] = { file, status: "missing" };
    continue;
  }
  // The last commit that changed the translation: README.md changes after it are not in it yet.
  // A translation not committed yet was just written from the current README.md.
  const base = execFileSync("git", ["log", "-1", "--format=%H", "--", file], { encoding: "utf8" }).trim();
  if (!base) continue;
  try {
    execFileSync("git", ["diff", "--quiet", base, "--", README]);
  } catch {
    readmes[code] = { file, status: "stale", since: base };
  }
}

const outOfDate = Object.keys(missingKeys).length + Object.keys(readmes).length > 0;

if (process.argv.includes("--json")) {
  console.log(JSON.stringify({ missingKeys, readmes }, null, 2));
} else if (outOfDate) {
  const locales = Object.entries(missingKeys).map(([code, keys]) => `${code} (${keys.length})`);
  if (locales.length) console.log(`Locales missing keys of en.json: ${locales.join(", ")}`);
  const files = Object.values(readmes).map(({ file, status, since }) =>
    status === "missing" ? `${file} (missing)` : `${file} (${README} changed since ${since.slice(0, 7)})`,
  );
  if (files.length) console.log(`READMEs out of date: ${files.join(", ")}`);
} else {
  console.log("Translations are up to date.");
}
process.exit(outOfDate ? 1 : 0);
