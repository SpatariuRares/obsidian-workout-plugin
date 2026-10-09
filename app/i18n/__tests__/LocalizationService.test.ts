/** @jest-environment jsdom */

import * as path from "path";

const LOCALES_DIR = path.resolve(__dirname, "..", "locales");

type Mod = typeof import("@app/i18n/LocalizationService");

/** Loads a fresh copy of the module so the singleton starts uninitialized. */
const loadFresh = (
  language: string | null,
  virtualLocales: Record<string, unknown> = {},
): Mod => {
  jest.resetModules();
  window.localStorage.clear();
  if (language !== null) window.localStorage.setItem("language", language);
  ["en", "xx", "zz"].forEach((locale) => {
    if (locale in virtualLocales) return;
    jest.doMock(
      path.join(LOCALES_DIR, `${locale}.json`),
      () => {
        throw new Error("missing locale");
      },
      { virtual: true },
    );
  });
  Object.entries(virtualLocales).forEach(([locale, content]) => {
    jest.doMock(
      path.join(LOCALES_DIR, `${locale}.json`),
      () => content,
      { virtual: true },
    );
  });
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require("@app/i18n/LocalizationService") as Mod;
};

const app = {} as never;

const EN = {
  greet: { hello: "Hello {name}!", count: "{n} of {total}", plain: "Plain" },
  onlyEn: "Only in English",
  num: 42,
  group: { child: "x" },
};
const XX = {
  greet: { hello: "Ciao {name}!" },
};

describe("LocalizationService", () => {
  afterEach(() => {
    jest.resetModules();
  });

  describe("before initialization", () => {
    it("should return the key from t() and a safe stub from getInstance()", () => {
      const { t, LocalizationService } = loadFresh("en");
      expect(t("any.key")).toBe("any.key");
      const stub = LocalizationService.getInstance();
      expect(stub.getCurrentLocale()).toBe("en");
      expect(stub.hasKey("any.key")).toBe(false);
      expect(() => {
        stub.reload();
        stub.destroy();
      }).not.toThrow();
    });
  });

  describe("initialize", () => {
    it("should create the singleton only once", () => {
      const { LocalizationService } = loadFresh("en");
      LocalizationService.initialize(app);
      const first = LocalizationService.getInstance();
      window.localStorage.setItem("language", "fr");
      LocalizationService.initialize(app);
      expect(LocalizationService.getInstance()).toBe(first);
      expect(first.getCurrentLocale()).toBe("en");
    });
  });

  describe("key lookup", () => {
    it("should resolve nested keys and return the english text", () => {
      const { LocalizationService, t } = loadFresh("en", { en: EN });
      LocalizationService.initialize(app);
      expect(t("greet.plain")).toBe("Plain");
      expect(t("onlyEn")).toBe("Only in English");
    });

    it("should return the key itself when it does not exist", () => {
      const { LocalizationService, t } = loadFresh("en", { en: EN });
      LocalizationService.initialize(app);
      expect(t("greet.missing")).toBe("greet.missing");
      expect(t("greet.plain.deeper")).toBe("greet.plain.deeper");
      expect(t("nope.at.all")).toBe("nope.at.all");
    });

    it("should stringify non-string leaf values", () => {
      const { LocalizationService, t } = loadFresh("en", { en: EN });
      LocalizationService.initialize(app);
      expect(t("num")).toBe("42");
      expect(t("group")).toBe("[object Object]");
    });
  });

  describe("parameter interpolation", () => {
    it("should replace placeholders with string and number params", () => {
      const { LocalizationService, t } = loadFresh("en", { en: EN });
      LocalizationService.initialize(app);
      expect(t("greet.hello", { name: "Claude" })).toBe("Hello Claude!");
      expect(t("greet.count", { n: 0, total: 5 })).toBe("0 of 5");
    });

    it("should keep placeholders that have no matching param", () => {
      const { LocalizationService, t } = loadFresh("en", { en: EN });
      LocalizationService.initialize(app);
      expect(t("greet.count", { n: 1 })).toBe("1 of {total}");
    });

    it("should leave placeholders untouched when no params are passed", () => {
      const { LocalizationService, t } = loadFresh("en", { en: EN });
      LocalizationService.initialize(app);
      expect(t("greet.hello")).toBe("Hello {name}!");
    });
  });

  describe("language detection and fallback", () => {
    it("should use the locale from localStorage", () => {
      const { LocalizationService, t } = loadFresh("xx", {
        en: EN,
        xx: XX,
      });
      LocalizationService.initialize(app);
      expect(LocalizationService.getInstance().getCurrentLocale()).toBe("xx");
      expect(t("greet.hello", { name: "Z" })).toBe("Ciao Z!");
    });

    it("should default to en when no language is stored", () => {
      const { LocalizationService } = loadFresh(null, { en: EN });
      LocalizationService.initialize(app);
      expect(LocalizationService.getInstance().getCurrentLocale()).toBe("en");
    });

    it("should normalise regional codes", () => {
      const { LocalizationService } = loadFresh("pt-br", { en: EN });
      LocalizationService.initialize(app);
      expect(LocalizationService.getInstance().getCurrentLocale()).toBe(
        "pt-BR",
      );
    });

    it("should fall back to english for keys missing in the current locale", () => {
      const { LocalizationService, t } = loadFresh("xx", {
        en: EN,
        xx: XX,
      });
      LocalizationService.initialize(app);
      expect(t("onlyEn")).toBe("Only in English");
      expect(t("greet.plain")).toBe("Plain");
    });

    it("should fall back to english when the locale file does not exist", () => {
      const { LocalizationService, t } = loadFresh("zz", { en: EN });
      LocalizationService.initialize(app);
      expect(LocalizationService.getInstance().getCurrentLocale()).toBe("zz");
      expect(t("greet.hello", { name: "A" })).toBe("Hello A!");
    });

    it("should return the key when it is missing in both locales", () => {
      const { LocalizationService, t } = loadFresh("xx", {
        en: EN,
        xx: XX,
      });
      LocalizationService.initialize(app);
      expect(t("ghost")).toBe("ghost");
    });
  });

  describe("hasKey", () => {
    it("should report only keys present in the current locale", () => {
      const { LocalizationService } = loadFresh("xx", { en: EN, xx: XX });
      LocalizationService.initialize(app);
      const svc = LocalizationService.getInstance();
      expect(svc.hasKey("greet.hello")).toBe(true);
      expect(svc.hasKey("onlyEn")).toBe(false);
      expect(svc.hasKey("greet.hello.deeper")).toBe(false);
    });
  });

  describe("reload and destroy", () => {
    it("should pick up a language change on reload", () => {
      const { LocalizationService, t } = loadFresh("en", {
        en: EN,
        xx: XX,
      });
      LocalizationService.initialize(app);
      const svc = LocalizationService.getInstance();
      window.localStorage.setItem("language", "xx");
      svc.reload();
      expect(svc.getCurrentLocale()).toBe("xx");
      expect(t("greet.hello", { name: "Q" })).toBe("Ciao Q!");
    });

    it("should clear translations on destroy so keys are returned", () => {
      const { LocalizationService, t } = loadFresh("xx", {
        en: EN,
        xx: XX,
      });
      LocalizationService.initialize(app);
      LocalizationService.getInstance().destroy();
      expect(t("greet.hello")).toBe("greet.hello");
    });
  });
});
