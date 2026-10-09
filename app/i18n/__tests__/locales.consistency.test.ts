/**
 * Guards the machine-translated locale files against the breakages seen in
 * practice: translated placeholders ({{duration}} -> {{doba}}), split
 * markdown, translated code identifiers inside backticks, and stale keys.
 * Keys missing from a locale are allowed: the release job translates them
 * and the plugin falls back to English meanwhile.
 */
import { readdirSync, readFileSync } from "fs";
import { join } from "path";

const LOCALES_DIR = join(process.cwd(), "app/i18n/locales");

type Tree = { [key: string]: string | Tree };

const flatten = (tree: Tree, prefix = ""): Record<string, string> =>
  Object.entries(tree).reduce<Record<string, string>>((out, [key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") out[path] = value;
    else Object.assign(out, flatten(value, path));
    return out;
  }, {});

const load = (file: string) =>
  flatten(JSON.parse(readFileSync(join(LOCALES_DIR, file), "utf8")) as Tree);

const placeholders = (s: string) =>
  (s.match(/\{\{?\s*[\w.]+\s*\}?\}/g) ?? [])
    .map((p) => p.replace(/\s/g, ""))
    .sort();
const codeSpans = (s: string) => s.match(/`[^`]*`/g) ?? [];
const boldMarkers = (s: string) => s.split("**").length - 1;

const en = load("en.json");
const locales = readdirSync(LOCALES_DIR)
  .filter((f) => f.endsWith(".json") && f !== "en.json")
  .sort();

describe.each(locales)("locale %s", (file) => {
  const translated = load(file);
  const keys = Object.keys(translated);

  it("has no keys that en.json no longer has", () => {
    expect(keys.filter((key) => !(key in en))).toEqual([]);
  });

  it("keeps every {placeholder} and {{template}} of the English text", () => {
    const broken = keys.filter(
      (key) =>
        key in en &&
        placeholders(en[key]).join() !== placeholders(translated[key]).join(),
    );
    expect(broken).toEqual([]);
  });

  it("keeps markdown bold markers and code identifiers unchanged", () => {
    const broken = keys.filter(
      (key) =>
        key in en &&
        (boldMarkers(en[key]) !== boldMarkers(translated[key]) ||
          codeSpans(en[key]).join() !== codeSpans(translated[key]).join()),
    );
    expect(broken).toEqual([]);
  });

  it("has no empty translations", () => {
    expect(
      keys.filter((key) => key in en && en[key] && !translated[key].trim()),
    ).toEqual([]);
  });
});
