import type { WorkoutChartsSettings } from "@app/types/WorkoutLogData";

/**
 * Features still in beta. Each one is off until the user turns it on in
 * Settings → Beta features, so an update never changes how someone trains
 * without them asking. See "Beta features" in CONTEXT.md.
 *
 * To add one: an id here, its `settings.beta.<id>` name and description in
 * en.json, and a `betaEnabled(settings, id)` check where it shows up (its
 * block, its command). To release it: remove the id and the checks.
 */
export const BETA_FEATURES = [
  /** The `workout-sets` block (rows to fill in on the phone, rest timer) */
  "setSheet",
] as const;

export type BetaFeature = (typeof BETA_FEATURES)[number];

/** Whether the user turned the beta feature on */
export function betaEnabled(
  settings: Pick<WorkoutChartsSettings, "betaFeatures">,
  feature: BetaFeature,
): boolean {
  return settings.betaFeatures?.[feature] === true;
}
