import type { CanonicalMuscleGroup } from "@app/constants/muscles.constants";

/**
 * Heat map zones: each one is a `data-muscle="<zoneId>"` group in
 * BodyViewSvg, colored from a weighted sum of muscle group volumes.
 *
 * Adding a muscle to the drawing = a `data-muscle` group in the SVG plus an
 * entry here. Weights below 1 spread a broad tag over several zones
 * (e.g. "chest" over upper/mid/lower chest). Limb and shoulder zones carry
 * 0.5 because each side of the body shows half of the trained volume.
 */
export const HEAT_MAP_ZONES = {
  // Chest
  upperChest: { chest: 0.4, upper_chest: 1 },
  middleChest: { chest: 0.4, mid_chest: 1 },
  lowerChest: { chest: 0.2, lower_chest: 1 },

  // Shoulders (a broad "shoulders" tag lights front and lateral deltoid)
  frontShoulders: { shoulders: 0.5, front_delts: 0.5 },
  sideShoulders: { shoulders: 0.5, side_delts: 0.5 },
  rearShoulders: { rear_delts: 0.5 },

  // Back
  traps: { traps: 1 },
  trapsMiddle: { traps: 0.5 },
  rhomboids: { rhomboids: 1 },
  lats: { back: 1, lats: 1 },
  lowerBack: { back: 0.3, lower_back: 1 },

  // Arms
  biceps: { biceps: 0.5 },
  triceps: { triceps: 0.5 },
  forearms: { forearms: 0.5 },

  // Legs
  quads: { quads: 0.5 },
  hamstrings: { hamstrings: 0.5 },
  glutes: { glutes: 0.5 },
  calves: { calves: 0.5 },

  // Core
  abs: { abs: 1 },
  obliques: { core: 0.5, obliques: 1 },
  serratus: { serratus: 1 },
} as const satisfies Record<
  string,
  Partial<Record<CanonicalMuscleGroup, number>>
>;

export type HeatMapZoneId = keyof typeof HEAT_MAP_ZONES;

export type ZoneValues = Record<HeatMapZoneId, number>;

/**
 * Value of every zone for the given per-muscle-group totals.
 */
export function calculateZoneValues(
  muscleVolume: (group: CanonicalMuscleGroup) => number,
): ZoneValues {
  const values = {} as ZoneValues;
  for (const [zone, sources] of Object.entries(HEAT_MAP_ZONES)) {
    values[zone as HeatMapZoneId] = Object.entries(sources).reduce(
      (sum, [group, weight]) =>
        sum + muscleVolume(group as CanonicalMuscleGroup) * weight,
      0,
    );
  }
  return values;
}

/**
 * Value the busiest zone reaches; at least 1 to avoid dividing by zero.
 */
export function maxZoneValue(values: ZoneValues): number {
  return Math.max(...Object.values(values), 1);
}
