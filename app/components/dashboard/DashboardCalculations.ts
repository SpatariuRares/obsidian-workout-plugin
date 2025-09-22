import { WorkoutLogData } from "../../types/WorkoutLogData";

export interface SummaryMetrics {
  totalWorkouts: number;
  currentStreak: number;
  totalVolume: number;
  personalRecords: number;
}

export interface PeriodStats {
  workouts: number;
  volume: number;
  avgVolume: number;
}

export interface VolumeTrendData {
  labels: string[];
  data: number[];
}

export interface RecentWorkout {
  date: string;
  workout: string | undefined;
  totalVolume: number;
}

/**
 * Utility class for dashboard calculations and data processing
 */
export class DashboardCalculations {
  /**
   * Calculate summary metrics for the dashboard
   */
  static calculateSummaryMetrics(data: WorkoutLogData[]): SummaryMetrics {
    const uniqueWorkouts = new Set(data.map((d) => `${d.date}-${d.workout}`))
      .size;
    const totalVolume = data.reduce((sum, d) => sum + d.volume, 0);

    // Calculate current streak (simplified)
    const uniqueDates = [...new Set(data.map((d) => d.date))].sort();
    let currentStreak = 0;
    const today = new Date().toISOString().split("T")[0];

    for (let i = uniqueDates.length - 1; i >= 0; i--) {
      const daysDiff = Math.floor(
        (new Date(today).getTime() - new Date(uniqueDates[i]).getTime()) /
          (1000 * 60 * 60 * 24)
      );

      if (daysDiff === currentStreak) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Calculate personal records (exercises with max weight)
    const exerciseMaxWeights = new Map<string, number>();
    data.forEach((d) => {
      const currentMax = exerciseMaxWeights.get(d.exercise) || 0;
      if (d.weight > currentMax) {
        exerciseMaxWeights.set(d.exercise, d.weight);
      }
    });

    return {
      totalWorkouts: uniqueWorkouts,
      currentStreak,
      totalVolume: Math.round(totalVolume),
      personalRecords: exerciseMaxWeights.size,
    };
  }

  /**
   * Calculate statistics for a specific time period
   */
  static calculatePeriodStats(data: WorkoutLogData[], days: number): PeriodStats {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const periodData = data.filter((d) => new Date(d.date) >= cutoffDate);
    const uniqueWorkouts = new Set(
      periodData.map((d) => `${d.date}-${d.workout}`)
    ).size;
    const totalVolume = periodData.reduce((sum, d) => sum + d.volume, 0);
    const avgVolume = uniqueWorkouts > 0 ? totalVolume / uniqueWorkouts : 0;

    return {
      workouts: uniqueWorkouts,
      volume: Math.round(totalVolume),
      avgVolume: Math.round(avgVolume),
    };
  }

  /**
   * Prepare volume trend data for charting
   */
  static prepareVolumeTrendData(data: WorkoutLogData[], days: number): VolumeTrendData {
    const labels: string[] = [];
    const volumeData: number[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      labels.push(dateStr);

      const dayVolume = data
        .filter((d) => d.date === dateStr)
        .reduce((sum, d) => sum + d.volume, 0);

      volumeData.push(dayVolume);
    }

    return { labels, data: volumeData };
  }

  /**
   * Calculate volume by muscle group (simplified as exercise volume)
   */
  static calculateMuscleGroupVolume(data: WorkoutLogData[]): [string, number][] {
    const exerciseVolumes = new Map<string, number>();

    data.forEach((d) => {
      const current = exerciseVolumes.get(d.exercise) || 0;
      exerciseVolumes.set(d.exercise, current + d.volume);
    });

    return Array.from(exerciseVolumes.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5); // Top 5 exercises by volume
  }

  /**
   * Get recent workouts with aggregated volume
   */
  static getRecentWorkouts(data: WorkoutLogData[], limit: number): RecentWorkout[] {
    const workoutMap = new Map<
      string,
      {
        date: string;
        workout: string | undefined;
        totalVolume: number;
      }
    >();

    data.forEach((d) => {
      const key = `${d.date}-${d.workout || "default"}`;
      const existing = workoutMap.get(key);

      if (existing) {
        existing.totalVolume += d.volume;
      } else {
        workoutMap.set(key, {
          date: d.date,
          workout: d.workout,
          totalVolume: d.volume,
        });
      }
    });

    return Array.from(workoutMap.values())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  }
}