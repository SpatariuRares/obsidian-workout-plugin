import { WorkoutLogData } from "@app/types/WorkoutLogData";
import { DateUtils } from "@app/utils/DateUtils";
import { DataAggregation } from "@app/utils/DataAggregation";

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
    // Count unique workouts using DataAggregation utility
    const totalWorkouts = DataAggregation.countUniqueWorkouts(data);

    // Calculate total volume using DataAggregation utility
    const totalVolume = DataAggregation.calculateTotalVolume(data);

    // Calculate current streak (weekly)
    const uniqueDates = DateUtils.getUniqueDates(data);
    const weeks = DateUtils.groupDatesByWeek(uniqueDates);
    const sortedWeeks = Array.from(weeks).sort((a, b) => a - b);

    // Count consecutive weeks starting from current week (0)
    let currentStreak = 0;
    for (let i = 0; i < sortedWeeks.length; i++) {
      if (sortedWeeks[i] === i) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Calculate personal records (exercises with max weight)
    const exerciseMaxWeights = DataAggregation.findMaxWeightsByExercise(data);

    return {
      totalWorkouts,
      currentStreak,
      totalVolume: Math.round(totalVolume),
      personalRecords: exerciseMaxWeights.size,
    };
  }

  /**
   * Calculate statistics for a specific time period
   */
  static calculatePeriodStats(data: WorkoutLogData[], days: number): PeriodStats {
    // Filter data by time period using DateUtils
    const periodData = DateUtils.filterByDaysAgo(data, days);

    // Count unique workouts using DataAggregation utility
    const uniqueWorkouts = DataAggregation.countUniqueWorkouts(periodData);

    // Calculate total volume using DataAggregation utility
    const totalVolume = DataAggregation.calculateTotalVolume(periodData);
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
    // Get date range using DateUtils
    const labels = DateUtils.getDateRangeForDays(days);

    // Aggregate daily volumes using DataAggregation
    const dailyVolumes = DataAggregation.aggregateDailyVolumes(data);

    // Map labels to volume data (0 if no data for that day)
    const volumeData = labels.map((dateStr) => dailyVolumes.get(dateStr) || 0);

    return { labels, data: volumeData };
  }

  /**
   * Calculate volume by muscle group (simplified as exercise volume)
   */
  static calculateMuscleGroupVolume(data: WorkoutLogData[]): [string, number][] {
    // Get top 5 exercises by volume using DataAggregation utility
    return DataAggregation.getTopExercisesByVolume(data, 5);
  }

  /**
   * Get recent workouts with aggregated volume
   */
  static getRecentWorkouts(data: WorkoutLogData[], limit: number): RecentWorkout[] {
    // Group workouts by date and name using DataAggregation utility
    const workoutMap = DataAggregation.groupByDateAndWorkout(data);

    // Sort by timestamp (most recent first) and limit results
    return Array.from(workoutMap.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }
}