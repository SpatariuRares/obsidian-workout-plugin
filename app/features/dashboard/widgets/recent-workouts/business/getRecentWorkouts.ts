import { WorkoutLogData } from "@app/types/WorkoutLogData";
import { TrainingHistory } from "@app/services/history/TrainingHistory";

export interface RecentWorkout {
  date: string;
  workout: string | undefined;
  totalVolume: number;
}

/** The latest sessions, most recent first, with their total volume. */
export function getRecentWorkouts(
  data: WorkoutLogData[],
  limit: number,
): RecentWorkout[] {
  return new TrainingHistory(data)
    .sessions()
    .reverse()
    .slice(0, limit)
    .map((session) => ({
      date: session.day,
      workout: session.workout,
      totalVolume: session.sets.reduce((sum, s) => sum + s.volume, 0),
    }));
}
