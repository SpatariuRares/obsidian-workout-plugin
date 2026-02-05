import { WorkoutLogData } from "@app/types/WorkoutLogData";
import { DateUtils } from "@app/utils/DateUtils";
import { DataAggregation } from "@app/utils/data/DataAggregation";

export interface VolumeTrendData {
  labels: string[];
  data: number[];
}

export function prepareVolumeTrendData(
  data: WorkoutLogData[],
  days: number,
): VolumeTrendData {
  const labels = DateUtils.getDateRangeForDays(days);
  const dailyVolumes = DataAggregation.aggregateDailyVolumes(data);
  const volumeData = labels.map((dateStr) => dailyVolumes.get(dateStr) || 0);

  return { labels, data: volumeData };
}

export function calculateMuscleGroupVolume(
  data: WorkoutLogData[],
): [string, number][] {
  return DataAggregation.getTopExercisesByVolume(data, 5);
}
