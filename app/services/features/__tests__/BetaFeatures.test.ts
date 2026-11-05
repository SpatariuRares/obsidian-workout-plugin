import {
  BETA_FEATURES,
  betaEnabled,
  newInstallBetaFeatures,
  type BetaFeature,
} from "@app/services/features/BetaFeatures";
import { DEFAULT_SETTINGS } from "@app/constants/defaults.constants";
import en from "@app/i18n/locales/en.json";

/** No feature is in beta right now: the checks are tested on a made-up id */
const feature = "someFeature" as BetaFeature;

describe("betaEnabled", () => {
  it("is off by default and on only once turned on", () => {
    expect(betaEnabled(DEFAULT_SETTINGS, feature)).toBe(false);
    expect(betaEnabled({ betaFeatures: { someFeature: false } }, feature)).toBe(false);
    expect(betaEnabled({ betaFeatures: { someFeature: true } }, feature)).toBe(true);
  });

  it("treats settings saved before beta features existed as all off", () => {
    expect(betaEnabled({} as never, feature)).toBe(false);
  });

  it("turns every beta feature on for a new install", () => {
    const betaFeatures = newInstallBetaFeatures();
    for (const id of BETA_FEATURES) {
      expect(betaEnabled({ betaFeatures }, id)).toBe(true);
    }
  });

  it("has a name and a description for every beta feature", () => {
    const beta = en.settings.beta as unknown as Record<string, { name?: string; desc?: string }>;
    for (const id of BETA_FEATURES as readonly string[]) {
      expect(beta[id]?.name).toBeTruthy();
      expect(beta[id]?.desc).toBeTruthy();
    }
  });
});
