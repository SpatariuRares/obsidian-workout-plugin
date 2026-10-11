import { WorkoutLogData } from "@app/types/WorkoutLogData";
import { TrainingHistory } from "@app/services/history/TrainingHistory";
import { StringUtils } from "@app/utils/StringUtils";

export interface SummaryMetrics {
  totalWorkouts: number;
  currentStreak: number;
  totalVolume: number;
  /** Exercises with a new weight record in the period */
  personalRecords: number;
}

/**
 * @param data The sets shown (the dashboard's period and filters)
 * @param history Every logged set, to judge records against; defaults to
 *   `data`
 */
export function calculateSummaryMetrics(
  data: WorkoutLogData[],
  history: WorkoutLogData[] = data,
): SummaryMetrics {
  const shown = new TrainingHistory(data);

  return {
    totalWorkouts: shown.sessions().length,
    currentStreak: shown.streak(),
    totalVolume: Math.round(shown.totalVolume()),
    personalRecords: countExercisesWithNewRecord(data, history),
  };
}

/**
 * Counts the exercises with at least one new PR among `shown`, judged
 * against every earlier set in `history` (see "Personal record" in CONTEXT.md).
 */
function countExercisesWithNewRecord(
  shown: WorkoutLogData[],
  history: WorkoutLogData[],
): number {
  const shownSets = new Set(shown);
  const all = [...new Set([...history, ...shown])];
  const exercises = new TrainingHistory(all)
    .newRecordSets()
    .filter((set) => shownSets.has(set))
    .map((set) => StringUtils.normalize(set.exercise));
  return new Set(exercises).size;
}
