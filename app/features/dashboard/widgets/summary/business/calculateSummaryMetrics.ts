import { WorkoutLogData } from "@app/types/WorkoutLogData";
import { DateUtils } from "@app/utils/DateUtils";
import { DataAggregation } from "@app/utils/data/DataAggregation";
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
  const totalWorkouts = new TrainingHistory(data).sessions().length;
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

  return {
    totalWorkouts,
    currentStreak,
    totalVolume: Math.round(totalVolume),
    personalRecords: countExercisesWithNewRecord(data, history),
  };
}

/**
 * A set is a record when its weight beats every earlier set of the same
 * exercise. Counts the exercises with at least one record among `shown`;
 * a first session (nothing to beat) and bodyweight sets never count.
 */
function countExercisesWithNewRecord(
  shown: WorkoutLogData[],
  history: WorkoutLogData[],
): number {
  const shownSets = new Set(shown);
  const best = new Map<string, number>();
  const withRecord = new Set<string>();

  const chronological = [...new Set([...history, ...shown])].sort(
    (a, b) => setTime(a) - setTime(b),
  );
  for (const set of chronological) {
    const exercise = StringUtils.normalize(set.exercise);
    const previousBest = best.get(exercise);
    if (
      previousBest !== undefined &&
      set.weight > previousBest &&
      shownSets.has(set)
    ) {
      withRecord.add(exercise);
    }
    if (previousBest === undefined || set.weight > previousBest) {
      best.set(exercise, set.weight);
    }
  }
  return withRecord.size;
}

function setTime(set: WorkoutLogData): number {
  return set.timestamp ?? new Date(set.date).getTime();
}
