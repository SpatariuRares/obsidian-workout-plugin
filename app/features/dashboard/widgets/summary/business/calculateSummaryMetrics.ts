import { WorkoutLogData } from "@app/types/WorkoutLogData";
import { DateUtils } from "@app/utils/DateUtils";
import { DataAggregation } from "@app/utils/data/DataAggregation";

export interface SummaryMetrics {
  totalWorkouts: number;
  currentStreak: number;
  totalVolume: number;
  personalRecords: number;
}

export function calculateSummaryMetrics(data: WorkoutLogData[]): SummaryMetrics {
  const totalWorkouts = DataAggregation.countUniqueWorkouts(data);
  const totalVolume = DataAggregation.calculateTotalVolume(data);

  const uniqueDates = DateUtils.getUniqueDates(data);
  const weeks = DateUtils.groupDatesByWeek(uniqueDates);
  const sortedWeeks = Array.from(weeks).sort((a, b) => a - b);

  let currentStreak = 0;
  for (let i = 0; i < sortedWeeks.length; i++) {
    if (sortedWeeks[i] === i) {
      currentStreak++;
    } else {
      break;
    }
  }

  const exerciseMaxWeights = DataAggregation.findMaxWeightsByExercise(data);

  return {
    totalWorkouts,
    currentStreak,
    totalVolume: Math.round(totalVolume),
    personalRecords: exerciseMaxWeights.size,
  };
}
