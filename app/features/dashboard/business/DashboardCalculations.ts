import { WorkoutLogData } from "@app/types/WorkoutLogData";
import {
  calculateSummaryMetrics,
  SummaryMetrics,
} from "@app/features/dashboard/widgets/summary/business/calculateSummaryMetrics";
import {
  calculatePeriodStats,
  PeriodStats,
} from "@app/features/dashboard/widgets/quick-stats/business/calculatePeriodStats";
import {
  prepareVolumeTrendData,
  calculateMuscleGroupVolume,
  VolumeTrendData,
} from "@app/features/dashboard/widgets/volume-analytics/business/volumeAnalyticsData";
import {
  getRecentWorkouts,
  RecentWorkout,
} from "@app/features/dashboard/widgets/recent-workouts/business/getRecentWorkouts";

export type { SummaryMetrics, PeriodStats, VolumeTrendData, RecentWorkout };

/**
 * Utility class for dashboard calculations and data processing
 */
export class DashboardCalculations {
  static calculateSummaryMetrics(data: WorkoutLogData[]): SummaryMetrics {
    return calculateSummaryMetrics(data);
  }

  static calculatePeriodStats(data: WorkoutLogData[], days: number): PeriodStats {
    return calculatePeriodStats(data, days);
  }

  static prepareVolumeTrendData(data: WorkoutLogData[], days: number): VolumeTrendData {
    return prepareVolumeTrendData(data, days);
  }

  static calculateMuscleGroupVolume(data: WorkoutLogData[]): [string, number][] {
    return calculateMuscleGroupVolume(data);
  }

  static getRecentWorkouts(data: WorkoutLogData[], limit: number): RecentWorkout[] {
    return getRecentWorkouts(data, limit);
  }
}
