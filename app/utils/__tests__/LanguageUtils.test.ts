import { readdirSync } from "fs";
import { join } from "path";
import * as obsidian from "obsidian";
import { LanguageUtils } from "@app/utils/LanguageUtils";

type MutableObsidian = { getLanguage?: () => string };

const getLanguageMock = obsidian.getLanguage as jest.Mock;
const momentLocaleMock = obsidian.moment
  .locale as unknown as jest.Mock;

describe("LanguageUtils.getUserLanguage", () => {
  afterEach(() => {
    getLanguageMock.mockReset().mockReturnValue("en");
    momentLocaleMock.mockReset().mockReturnValue("en");
  });

  it("reads the app language from Obsidian's getLanguage()", () => {
    getLanguageMock.mockReturnValue("it");

    expect(LanguageUtils.getUserLanguage()).toBe("it");
  });

  it("normalizes a regional code when asked", () => {
    getLanguageMock.mockReturnValue("pt-br");

    expect(LanguageUtils.getUserLanguage(true)).toBe("pt-BR");
  });

  it("falls back to English when getLanguage() returns nothing", () => {
    getLanguageMock.mockReturnValue("");

    expect(LanguageUtils.getUserLanguage()).toBe("en");
  });

  it("falls back to English when getLanguage() throws", () => {
    getLanguageMock.mockImplementation(() => {
      throw new Error("boom");
    });

    expect(LanguageUtils.getUserLanguage()).toBe("en");
  });

  describe("on Obsidian older than 1.8.7 (no getLanguage)", () => {
    const mod = obsidian as unknown as MutableObsidian;
    let original: (() => string) | undefined;

    beforeEach(() => {
      original = mod.getLanguage;
      Object.defineProperty(mod, "getLanguage", {
        value: undefined,
        configurable: true,
        writable: true,
      });
    });

    afterEach(() => {
      Object.defineProperty(mod, "getLanguage", {
        value: original,
        configurable: true,
        writable: true,
      });
    });

    it("uses the locale Obsidian set on moment", () => {
      momentLocaleMock.mockReturnValue("fr");

      expect(LanguageUtils.getUserLanguage()).toBe("fr");
    });

    it.each([
      ["zh-cn", "zh"],
      ["zh-tw", "zh-TW"],
      ["zh-hk", "zh-TW"],
      ["cs", "cz"],
      ["nb", "no"],
      ["pt-br", "pt-BR"],
    ])(
      "maps moment's %s to the plugin's %s locale",
      (momentCode, locale) => {
        momentLocaleMock.mockReturnValue(momentCode);

        expect(LanguageUtils.getUserLanguage(true)).toBe(locale);
      },
    );

    it("maps moment's code even without normalizing", () => {
      momentLocaleMock.mockReturnValue("zh-tw");

      expect(LanguageUtils.getUserLanguage()).toBe("zh-TW");
    });

    it("gives a code for every locale file the plugin ships", () => {
      // moment codes Obsidian sets for the languages we translate
      const momentCodes = [
        "ar",
        "cs",
        "da",
        "de",
        "en",
        "es",
        "fr",
        "hi",
        "id",
        "it",
        "ja",
        "ko",
        "nl",
        "nb",
        "pl",
        "pt-br",
        "pt",
        "ro",
        "ru",
        "sq",
        "tr",
        "uk",
        "zh-tw",
        "zh-cn",
      ];
      const locales = momentCodes.map((code) => {
        momentLocaleMock.mockReturnValue(code);
        return LanguageUtils.getUserLanguage(true);
      });

      const shipped = readdirSync(
        join(__dirname, "../../i18n/locales"),
      )
        .map((file) => file.replace(/\.json$/, ""))
        .sort();
      expect([...locales].sort()).toEqual(shipped);
    });
  });
});
