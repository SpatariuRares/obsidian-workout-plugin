export const WEIGHT_UNITS = ["kg", "lb"] as const;

export type WeightUnit = (typeof WEIGHT_UNITS)[number];

/** Exact international avoirdupois pound */
const KG_PER_LB = 0.45359237;

export function isWeightUnit(value: unknown): value is WeightUnit {
  return value === "kg" || value === "lb";
}

/**
 * Converts a weight between kg and lb, rounded to 2 decimals
 * (1.25 kg / 1.25 lb plates need the hundredths).
 */
export function convertWeight(
  value: number,
  from: WeightUnit,
  to: WeightUnit,
): number {
  if (from === to) return value;
  const converted =
    from === "lb" ? value * KG_PER_LB : value / KG_PER_LB;
  return Math.round(converted * 100) / 100;
}

/**
 * Converts a log's weight and volume together. When volume is reps × weight
 * it is recomputed from the converted weight, so kg→lb→kg round trips don't
 * drift; otherwise it is converted on its own.
 */
export function convertWeightAndVolume(
  reps: number,
  weight: number,
  volume: number,
  from: WeightUnit,
  to: WeightUnit,
): { weight: number; volume: number } {
  if (from === to) return { weight, volume };
  const volumeIsRepsTimesWeight =
    reps > 0 && Math.abs(volume - reps * weight) < 0.01;
  const convertedWeight = convertWeight(weight, from, to);
  return {
    weight: convertedWeight,
    volume: volumeIsRepsTimesWeight
      ? Math.round(reps * convertedWeight * 100) / 100
      : convertWeight(volume, from, to),
  };
}
