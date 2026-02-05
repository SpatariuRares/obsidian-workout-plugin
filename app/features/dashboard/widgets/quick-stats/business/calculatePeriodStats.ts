import { WorkoutLogData } from "@app/types/WorkoutLogData";
import { DateUtils } from "@app/utils/DateUtils";
import { DataAggregation } from "@app/utils/data/DataAggregation";

export interface PeriodStats {
  workouts: number;
  volume: number;
  avgVolume: number;
}

export function calculatePeriodStats(
  data: WorkoutLogData[],
  days: number,
): PeriodStats {
  const periodData = DateUtils.filterByDaysAgo(data, days);

  const uniqueWorkouts = DataAggregation.countUniqueWorkouts(periodData);

  const totalVolume = DataAggregation.calculateTotalVolume(periodData);
  const avgVolume = uniqueWorkouts > 0 ? totalVolume / uniqueWorkouts : 0;

  return {
    workouts: uniqueWorkouts,
    volume: Math.round(totalVolume),
    avgVolume: Math.round(avgVolume),
  };
}
