import type { WorkoutChartsSettings } from "@app/types/WorkoutLogData";

/**
 * Where a feature is in its release. "beta": off until the user turns it on
 * in Settings → Beta features. "stable": on for everyone, with no toggle.
 */
export type FeatureStage = "beta" | "stable";

/**
 * Every feature that shipped behind a toggle, with its stage. See "Beta
 * features" in CONTEXT.md.
 *
 * To add one: its id here as "beta", its `settings.beta.<id>` name and
 * description in en.json, and a `featureEnabled(settings, id)` check where
 * it shows up (its block, its commands).
 * To release it: change "beta" to "stable". It is then on for everyone and
 * its toggle is gone; the checks and its texts can be removed later.
 */
export const FEATURES = {
  /** The `workout-sets` block (rows to fill in on the phone, rest timer) */
  setSheet: "beta",
} as const satisfies Record<string, FeatureStage>;

export type Feature = keyof typeof FEATURES;

/** The features still in beta, which get a toggle in the settings */
export function betaFeatures(
  features: Record<string, FeatureStage> = FEATURES,
): Feature[] {
  return (Object.keys(features) as Feature[]).filter(
    (feature) => features[feature] === "beta",
  );
}

/** Whether the feature is on: always once stable, else when the user turned it on */
export function featureEnabled(
  settings: Pick<WorkoutChartsSettings, "betaFeatures">,
  feature: Feature,
  features: Record<string, FeatureStage> = FEATURES,
): boolean {
  return features[feature] === "stable" || settings.betaFeatures?.[feature] === true;
}
