import { WorkoutLogData } from "@app/types/WorkoutLogData";
import { trainingDay } from "@app/services/history/TrainingHistory";
import { t } from "@app/i18n";

/**
 * Utility class for data aggregation operations
 * Centralizes common aggregation patterns used across the application
 */
export class DataAggregation {
  /**
   * Generic aggregation by key with custom key and value extractors
   */
  static aggregateByKey<T>(
    data: T[],
    keyFn: (_item: T) => string,
    valueFn: (_item: T) => number,
  ): Map<string, number> {
    const result = new Map<string, number>();
    data.forEach((item) => {
      const key = keyFn(item);
      const value = valueFn(item);
      result.set(key, (result.get(key) || 0) + value);
    });
    return result;
  }

  /**
   * Aggregate workout data by exercise name, summing volumes
   */
  static aggregateExerciseVolumes(
    data: WorkoutLogData[],
  ): Map<string, number> {
    return this.aggregateByKey(
      data,
      (d) => d.exercise,
      (d) => d.volume,
    );
  }

  /**
   * Aggregate workout data by date, summing volumes
   */
  static aggregateDailyVolumes(
    data: WorkoutLogData[],
  ): Map<string, number> {
    return this.aggregateByKey(
      data,
      (d) => trainingDay(d.date),
      (d) => d.volume,
    );
  }

  /**
   * Aggregate workout data by workout name, summing volumes
   */
  static aggregateWorkoutVolumes(
    data: WorkoutLogData[],
  ): Map<string, number> {
    return this.aggregateByKey(
      data,
      (d) => d.workout || t("common.unknown"),
      (d) => d.volume,
    );
  }

  /**
   * Get top N items by value from aggregated data
   */
  static getTopN(
    aggregatedData: Map<string, number>,
    n: number,
  ): [string, number][] {
    return Array.from(aggregatedData.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, n);
  }

  /**
   * Get top N exercises by volume
   */
  static getTopExercisesByVolume(
    data: WorkoutLogData[],
    n: number,
  ): [string, number][] {
    const volumes = this.aggregateExerciseVolumes(data);
    return this.getTopN(volumes, n);
  }

  /**
   * Calculate total volume from workout data
   */
  static calculateTotalVolume(data: WorkoutLogData[]): number {
    return data.reduce((sum, d) => sum + d.volume, 0);
  }
}
