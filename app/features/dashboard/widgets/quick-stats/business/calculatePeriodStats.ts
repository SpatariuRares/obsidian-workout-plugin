import { WorkoutLogData } from "@app/types/WorkoutLogData";
import { DateUtils } from "@app/utils/DateUtils";
import { TrainingHistory } from "@app/services/history/TrainingHistory";

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

  const period = new TrainingHistory(periodData);
  const uniqueWorkouts = period.sessions().length;
  const totalVolume = period.totalVolume();
  const avgVolume =
    uniqueWorkouts > 0 ? totalVolume / uniqueWorkouts : 0;

  return {
    workouts: uniqueWorkouts,
    volume: Math.round(totalVolume),
    avgVolume: Math.round(avgVolume),
  };
}
