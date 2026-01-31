import { WorkoutLogData } from "@app/types/WorkoutLogData";

/**
 * TargetCalculator - Business logic for target weight/reps calculations
 *
 * Provides pure calculation methods for:
 * - Finding best reps at a target weight
 * - Checking if target has been achieved
 * - Calculating progress percentages
 */
export class TargetCalculator {
  /**
   * Find the best (maximum) reps achieved at a specific weight
   * @param targetWeight - The weight to filter by
   * @param data - Workout log entries
   * @returns Best reps at target weight, or 0 if no entries found
   */
  static calculateBestRepsAtWeight(
    targetWeight: number,
    data: WorkoutLogData[],
  ): number {
    try {
      const entriesAtTargetWeight = data.filter(
        (entry) => entry.weight === targetWeight,
      );

      if (entriesAtTargetWeight.length === 0) {
        return 0;
      }

      return Math.max(...entriesAtTargetWeight.map((entry) => entry.reps));
    } catch {
      return 0;
    }
  }

  /**
   * Check if the target has been achieved (latest entry at target weight meets target reps)
   * @param targetWeight - The target weight
   * @param targetReps - The target reps to achieve
   * @param data - Workout log entries
   * @returns True if target achieved, false otherwise
   */
  static checkTargetAchieved(
    targetWeight: number,
    targetReps: number,
    data: WorkoutLogData[],
  ): boolean {
    try {
      const entriesAtTargetWeight = data.filter(
        (entry) => entry.weight === targetWeight,
      );

      if (entriesAtTargetWeight.length === 0) {
        return false;
      }

      // Sort by timestamp/date to get most recent
      const sortedEntries = entriesAtTargetWeight.sort((a, b) => {
        const dateA = a.timestamp || new Date(a.date).getTime();
        const dateB = b.timestamp || new Date(b.date).getTime();
        return dateB - dateA;
      });

      const latestEntry = sortedEntries[0];
      return latestEntry.reps >= targetReps;
    } catch {
      return false;
    }
  }

  /**
   * Calculate progress percentage towards target reps
   * @param bestReps - Best reps achieved
   * @param targetReps - Target reps
   * @returns Progress percentage (0-100, capped at 100)
   */
  static calculateProgressPercent(bestReps: number, targetReps: number): number {
    if (targetReps <= 0) {
      return 0;
    }
    return Math.min((bestReps / targetReps) * 100, 100);
  }

  /**
   * Get progress level classification based on percentage
   * @param progressPercent - Progress percentage (0-100)
   * @returns Progress level: 'complete' | 'high' | 'medium' | 'low'
   */
  static getProgressLevel(
    progressPercent: number,
  ): "complete" | "high" | "medium" | "low" {
    if (progressPercent >= 100) return "complete";
    if (progressPercent >= 90) return "high";
    if (progressPercent >= 50) return "medium";
    return "low";
  }
}
