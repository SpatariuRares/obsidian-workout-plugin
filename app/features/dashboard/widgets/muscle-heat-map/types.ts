/**
 * What the heat map measures per muscle:
 * volume = reps × weight, sets = logged rows, reps = total reps.
 * sets/reps make bodyweight and timed work visible (their volume is 0).
 */
export type HeatMapMetric = "volume" | "sets" | "reps";

export interface MuscleHeatMapOptions {
  timeFrame: "week" | "month" | "year";
  view: "front" | "back";
  metric: HeatMapMetric;
}
