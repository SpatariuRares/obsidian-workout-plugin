import { WorkoutLogData } from "@app/types/WorkoutLogData";
import { DataAggregation } from "@app/utils/data/DataAggregation";

export interface RecentWorkout {
  date: string;
  workout: string | undefined;
  totalVolume: number;
}

export function getRecentWorkouts(
  data: WorkoutLogData[],
  limit: number,
): RecentWorkout[] {
  const workoutMap = DataAggregation.groupByDateAndWorkout(data);

  return Array.from(workoutMap.values())
    .sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )
    .slice(0, limit);
}
