import fs from "fs";
import path from "path";
import { packLocale } from "@app/i18n/packLocale";
import { unpackLocale } from "@app/i18n/packedLocale";
import en from "@app/i18n/locales/en.json";

const localesDir = path.join(__dirname, "..", "locales");

describe("packedLocale", () => {
  it("unpacks every locale to the translations it was packed from", () => {
    for (const file of fs.readdirSync(localesDir)) {
      const locale = JSON.parse(
        fs.readFileSync(path.join(localesDir, file), "utf8"),
      ) as Record<string, unknown>;
      expect(unpackLocale(en, packLocale(en, locale))).toEqual(
        locale,
      );
    }
  });

  it("leaves out the keys a locale lacks, so they fall back to English", () => {
    const english = { a: "A", group: { b: "B", c: "C" } };
    const unpacked = unpackLocale(
      english,
      packLocale(english, { group: { c: "Ç" } }),
    );
    expect(unpacked).toEqual({ group: { c: "Ç" } });
  });

  it("keeps text outside Latin-1 intact", () => {
    const english = { a: "A", b: "B" };
    const locale = { a: "नमस्ते {count}", b: "你好 **ok**" };
    expect(
      unpackLocale(english, packLocale(english, locale)),
    ).toEqual(locale);
  });

  it("ignores keys that English does not have", () => {
    const unpacked = unpackLocale(
      { a: "A" },
      packLocale({ a: "A" }, { a: "Á", extra: "X" }),
    );
    expect(unpacked).toEqual({ a: "Á" });
  });
});
