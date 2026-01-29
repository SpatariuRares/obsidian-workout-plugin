import { CONSTANTS } from "@app/constants";
import { WorkoutLogData } from "@app/types/WorkoutLogData";
import { DateUtils } from "@app/utils/DateUtils";

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
    valueFn: (_item: T) => number
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
  static aggregateExerciseVolumes(data: WorkoutLogData[]): Map<string, number> {
    return this.aggregateByKey(
      data,
      (d) => d.exercise,
      (d) => d.volume
    );
  }

  /**
   * Aggregate workout data by date, summing volumes
   */
  static aggregateDailyVolumes(data: WorkoutLogData[]): Map<string, number> {
    return this.aggregateByKey(
      data,
      (d) => DateUtils.extractDateOnly(d.date),
      (d) => d.volume
    );
  }

  /**
   * Aggregate workout data by workout name, summing volumes
   */
  static aggregateWorkoutVolumes(data: WorkoutLogData[]): Map<string, number> {
    return this.aggregateByKey(
      data,
      (d) => d.workout || CONSTANTS.WORKOUT.COMMON.DEFAULTS.UNKNOWN,
      (d) => d.volume
    );
  }

  /**
   * Get top N items by value from aggregated data
   */
  static getTopN(
    aggregatedData: Map<string, number>,
    n: number
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
    n: number
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

  /**
   * Find maximum weight for each exercise
   */
  static findMaxWeightsByExercise(data: WorkoutLogData[]): Map<string, number> {
    const maxWeights = new Map<string, number>();
    data.forEach((d) => {
      const currentMax = maxWeights.get(d.exercise) || 0;
      if (d.weight > currentMax) {
        maxWeights.set(d.exercise, d.weight);
      }
    });
    return maxWeights;
  }

  /**
   * Count unique workouts (combination of date and workout name)
   */
  static countUniqueWorkouts(data: WorkoutLogData[]): number {
    const uniqueWorkouts = new Set(
      data.map((d) => {
        const dateOnly = DateUtils.extractDateOnly(d.date);
        return `${dateOnly}-${d.workout}`;
      })
    );
    return uniqueWorkouts.size;
  }

  /**
   * Group workout data by date and workout, aggregating volumes
   */
  static groupByDateAndWorkout(data: WorkoutLogData[]): Map<
    string,
    {
      date: string;
      workout: string | undefined;
      totalVolume: number;
      timestamp: string;
    }
  > {
    const workoutMap = new Map<
      string,
      {
        date: string;
        workout: string | undefined;
        totalVolume: number;
        timestamp: string;
      }
    >();

    data.forEach((d) => {
      const dateOnly = DateUtils.extractDateOnly(d.date);
      const key = `${dateOnly}-${d.workout || "default"}`;
      const existing = workoutMap.get(key);

      if (existing) {
        existing.totalVolume += d.volume;
        // Keep the most recent timestamp
        if (d.date > existing.timestamp) {
          existing.timestamp = d.date;
        }
      } else {
        workoutMap.set(key, {
          date: dateOnly,
          workout: d.workout,
          totalVolume: d.volume,
          timestamp: d.date,
        });
      }
    });

    return workoutMap;
  }
}
