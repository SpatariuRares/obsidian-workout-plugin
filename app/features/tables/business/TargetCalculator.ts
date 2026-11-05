import { countsForRecord } from "@app/services/history/TrainingHistory";
import { WorkoutLogData } from "@app/types/WorkoutLogData";

/** Weights are kept to 2 decimals after a kg/lb conversion */
const WEIGHT_TOLERANCE = 0.01;

/**
 * TargetCalculator - Business logic for target weight/reps calculations
 *
 * One rule for the progress and for "reached": the sets that count toward a
 * target are working sets (warm-ups and drop sets don't, like PRs) at the
 * target weight or heavier, since 90kg × 8 also beats 85kg × 8.
 */
export class TargetCalculator {
  /**
   * The most reps done in one working set at the target weight or heavier
   * @param targetWeight - The weight to reach
   * @param data - Workout log entries
   * @returns Best reps, or 0 if no set counts yet
   */
  static calculateBestRepsAtWeight(
    targetWeight: number,
    data: WorkoutLogData[],
  ): number {
    let best = 0;
    for (const entry of data) {
      if (
        countsForRecord(entry) &&
        entry.weight >= targetWeight - WEIGHT_TOLERANCE &&
        entry.reps > best
      ) {
        best = entry.reps;
      }
    }
    return best;
  }

  /**
   * Whether a working set at the target weight or heavier reached the target reps
   * @param targetWeight - The target weight
   * @param targetReps - The target reps to achieve
   * @param data - Workout log entries
   */
  static checkTargetAchieved(
    targetWeight: number,
    targetReps: number,
    data: WorkoutLogData[],
  ): boolean {
    return (
      targetReps > 0 &&
      this.calculateBestRepsAtWeight(targetWeight, data) >= targetReps
    );
  }
}
