import { WorkoutLogData } from "@app/types/WorkoutLogData";
import { DateUtils } from "@app/utils/DateUtils";
import { TrainingHistory } from "@app/services/history/TrainingHistory";

export interface VolumeTrendData {
  labels: string[];
  data: number[];
}

export function prepareVolumeTrendData(
  data: WorkoutLogData[],
  days: number,
): VolumeTrendData {
  const labels = DateUtils.getDateRangeForDays(days);
  const dailyVolumes = new TrainingHistory(data).volumeByDay();
  const volumeData = labels.map(
    (dateStr) => dailyVolumes.get(dateStr) || 0,
  );

  return { labels, data: volumeData };
}

export function calculateMuscleGroupVolume(
  data: WorkoutLogData[],
): [string, number][] {
  return new TrainingHistory(data).topExercisesByVolume(5);
}
