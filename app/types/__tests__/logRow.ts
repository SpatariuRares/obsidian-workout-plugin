import type { WorkoutLogData } from "@app/types/WorkoutLogData";

/**
 * A logged set as the log reads it back, for tests: 8 × 80 of Bench Press on
 * 15 January 2024, with whatever `fields` say (a field given as undefined
 * stays undefined). `volume` is `reps × weight` unless given, as the log
 * computes it.
 */
export function logRow(fields: Partial<WorkoutLogData> = {}): WorkoutLogData {
  const row = {
    date: "2024-01-15",
    exercise: "Bench Press",
    reps: 8,
    weight: 80,
    ...fields,
  };
  return {
    ...row,
    volume: "volume" in fields ? (fields.volume as number) : row.reps * row.weight,
  };
}
