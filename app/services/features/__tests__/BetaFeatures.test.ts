import {
  BETA_FEATURES,
  betaEnabled,
  newInstallBetaFeatures,
} from "@app/services/features/BetaFeatures";
import { DEFAULT_SETTINGS } from "@app/constants/defaults.constants";
import en from "@app/i18n/locales/en.json";

describe("betaEnabled", () => {
  it("is off by default and on only once turned on", () => {
    expect(betaEnabled(DEFAULT_SETTINGS, "setSheet")).toBe(false);
    expect(betaEnabled({ betaFeatures: { setSheet: false } }, "setSheet")).toBe(false);
    expect(betaEnabled({ betaFeatures: { setSheet: true } }, "setSheet")).toBe(true);
  });

  it("treats settings saved before beta features existed as all off", () => {
    expect(betaEnabled({} as never, "setSheet")).toBe(false);
  });

  it("turns every beta feature on for a new install", () => {
    const betaFeatures = newInstallBetaFeatures();
    for (const feature of BETA_FEATURES) {
      expect(betaEnabled({ betaFeatures }, feature)).toBe(true);
    }
  });

  it("has a name and a description for every beta feature", () => {
    const beta = en.settings.beta as unknown as Record<string, { name?: string; desc?: string }>;
    for (const feature of BETA_FEATURES) {
      expect(beta[feature]?.name).toBeTruthy();
      expect(beta[feature]?.desc).toBeTruthy();
    }
  });
});
