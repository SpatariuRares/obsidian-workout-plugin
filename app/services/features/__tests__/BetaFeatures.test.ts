import {
  FEATURES,
  betaFeatures,
  featureEnabled,
} from "@app/services/features/BetaFeatures";
import { DEFAULT_SETTINGS } from "@app/constants/defaults.constants";
import en from "@app/i18n/locales/en.json";

describe("featureEnabled", () => {
  it("keeps a beta feature off by default and on only once turned on", () => {
    const beta = { setSheet: "beta" } as const;
    expect(featureEnabled(DEFAULT_SETTINGS, "setSheet", beta)).toBe(false);
    expect(featureEnabled({ betaFeatures: { setSheet: false } }, "setSheet", beta)).toBe(false);
    expect(featureEnabled({ betaFeatures: { setSheet: true } }, "setSheet", beta)).toBe(true);
  });

  it("treats settings saved before beta features existed as all off", () => {
    expect(featureEnabled({} as never, "setSheet", { setSheet: "beta" })).toBe(false);
  });

  it("turns a stable feature on for everyone, even for someone who had turned it off", () => {
    const stable = { setSheet: "stable" } as const;
    expect(featureEnabled(DEFAULT_SETTINGS, "setSheet", stable)).toBe(true);
    expect(featureEnabled({ betaFeatures: { setSheet: false } }, "setSheet", stable)).toBe(true);
  });
});

describe("betaFeatures", () => {
  it("lists only the features still in beta, so a stable one has no toggle", () => {
    expect(betaFeatures({ setSheet: "beta", old: "stable" })).toEqual(["setSheet"]);
    expect(betaFeatures({ setSheet: "stable" })).toEqual([]);
  });

  it("has a name and a description for every beta feature", () => {
    const texts = en.settings.beta as unknown as Record<string, { name?: string; desc?: string }>;
    for (const feature of betaFeatures(FEATURES)) {
      expect(texts[feature]?.name).toBeTruthy();
      expect(texts[feature]?.desc).toBeTruthy();
    }
  });
});
