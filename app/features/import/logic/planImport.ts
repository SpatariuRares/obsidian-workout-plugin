import type {
  TimedLogEntryInput,
  WorkoutLogData,
} from "@app/types/WorkoutLogData";
import { trainingDay } from "@app/services/history/TrainingHistory";
import { StringUtils } from "@app/utils/StringUtils";

/** What an import would add, shown before anything is written */
export interface ImportPlan {
  /** Sets not already in the log, in file order */
  toAdd: TimedLogEntryInput[];
  /** Sets skipped because the log already has them */
  duplicates: number;
  /** Exercises to add that have no exercise page, each named once */
  newExercises: string[];
  /** First and last training day of the sets to add */
  firstDay?: string;
  lastDay?: string;
}

/**
 * Plans an import against the log. A set is already logged when the log
 * has one with the same date, exercise (case/spacing ignored), reps and
 * entered weight and unit. Identical sets of one workout are counted, so
 * importing a file twice adds nothing and a set done twice is kept twice.
 */
export function planImport(
  sets: TimedLogEntryInput[],
  existing: WorkoutLogData[],
  hasPage: (exercise: string) => boolean,
): ImportPlan {
  const logged = new Map<string, number>();
  for (const log of existing) {
    const key = setKey(
      log.date,
      log.exercise,
      log.reps,
      log.enteredWeight ?? log.weight,
      log.enteredUnit,
    );
    logged.set(key, (logged.get(key) ?? 0) + 1);
  }

  const toAdd: TimedLogEntryInput[] = [];
  for (const set of sets) {
    const key = setKey(
      set.date,
      set.exercise,
      set.reps,
      set.weight,
      set.weightUnit,
    );
    const remaining = logged.get(key) ?? 0;
    if (remaining > 0) {
      logged.set(key, remaining - 1);
    } else {
      toAdd.push(set);
    }
  }

  const newExercises = new Map<string, string>();
  for (const { exercise } of toAdd) {
    const key = StringUtils.normalize(exercise);
    if (!newExercises.has(key) && !hasPage(exercise)) {
      newExercises.set(key, exercise);
    }
  }

  const days = toAdd.map((set) => trainingDay(set.date)).sort();
  return {
    toAdd,
    duplicates: sets.length - toAdd.length,
    newExercises: [...newExercises.values()],
    firstDay: days[0],
    lastDay: days[days.length - 1],
  };
}

function setKey(
  date: string,
  exercise: string,
  reps: number,
  weight: number,
  unit: string | undefined,
): string {
  return [date, StringUtils.normalize(exercise), reps, weight, unit].join(
    "|",
  );
}
