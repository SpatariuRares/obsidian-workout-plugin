import type { WorkoutChartsSettings } from "@app/types/WorkoutLogData";

/**
 * Features still in beta. On an update each one is off until the user turns
 * it on in Settings → Beta features, so an update never changes how someone
 * trains without them asking; a new install starts with all of them on
 * (`newInstallBetaFeatures`). See "Beta features" in CONTEXT.md.
 *
 * To add one: an id here, its `settings.beta.<id>` name and description in
 * en.json, and a `betaEnabled(settings, id)` check where it shows up (its
 * block, its command). To release it: remove the id and the checks.
 */
// None right now. Write the next one as `["id"] as const` and BetaFeature as
// `(typeof BETA_FEATURES)[number]`, so a check can only name a listed id
export const BETA_FEATURES: readonly string[] = [];

export type BetaFeature = string;

/** Whether the user turned the beta feature on */
export function betaEnabled(
  settings: Pick<WorkoutChartsSettings, "betaFeatures">,
  feature: BetaFeature,
): boolean {
  return settings.betaFeatures?.[feature] === true;
}

/** A new install has no habits to keep, so it starts with every beta on */
export function newInstallBetaFeatures(): Record<BetaFeature, boolean> {
  return Object.fromEntries(
    BETA_FEATURES.map((feature) => [feature, true]),
  );
}
