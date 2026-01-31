import { WorkoutLogData } from "@app/types/WorkoutLogData";
import type WorkoutChartsPlugin from "main";

export class LogDataService {
  private workoutLogData: WorkoutLogData[] = [];

  constructor(private plugin: WorkoutChartsPlugin) {}

  /**
   * Loads workout log data.
   */
  async loadWorkoutLogData(): Promise<void> {
    try {
      this.workoutLogData = await this.plugin.getWorkoutLogData();
    } catch {
      this.workoutLogData = [];
    }
  }

  /**
   * Finds the most recent log entry for a given exercise.
   * @param exerciseName The exercise name to search for
   * @returns The most recent log entry or undefined if not found
   */
  findLastEntryForExercise(exerciseName: string): WorkoutLogData | undefined {
    if (!exerciseName || this.workoutLogData.length === 0) {
      return undefined;
    }

    // Normalize exercise name for comparison
    const normalizedExercise = exerciseName.toLowerCase().trim();

    // Sort by timestamp descending to get most recent first
    // Note: Assuming this.workoutLogData is not guaranteed to be sorted
    const sortedData = [...this.workoutLogData].sort((a, b) => {
      const timestampA = a.timestamp || 0;
      const timestampB = b.timestamp || 0;
      return timestampB - timestampA;
    });

    return sortedData.find(
      (log) => log.exercise.toLowerCase().trim() === normalizedExercise
    );
  }
}
