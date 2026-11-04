import { tableBlock } from "@app/features/tables/tableBlock";
import { setsBlock } from "@app/features/tables/setsBlock";
import { generateCodeBlockId } from "@app/utils/IdUtils";

export function generateExerciseLogBlock(
  exercise: string,
  workout: string,
  opts?: { limit?: number; exactMatch?: boolean; sets?: number },
): string {
  return tableBlock.serialize({
    id: generateCodeBlockId(),
    exercise,
    workout,
    // With sets, the table shows the last two workouts by itself
    limit: opts?.limit ?? (opts?.sets ? undefined : 12),
    exactMatch: (opts?.exactMatch ?? true) || undefined,
    sets: opts?.sets,
  });
}

export function generateExerciseOnlyLogBlock(
  exercise: string,
  limit: number,
): string {
  return tableBlock.serialize({ id: generateCodeBlockId(), exercise, limit });
}

export function generateWorkoutLogBlock(
  workout: string,
  limit: number,
): string {
  return tableBlock.serialize({ id: generateCodeBlockId(), workout, limit });
}

export function generateCombinedLogBlock(
  exercise: string,
  workout: string,
  limit: number,
): string {
  return tableBlock.serialize({
    id: generateCodeBlockId(),
    exercise,
    workout,
    limit,
    exactMatch: true,
  });
}

/** A `workout-sets` block: the table made for logging on the phone */
export function generateSetsBlock(
  exercise: string,
  opts: { workout?: string; sets?: number; targetReps?: number; targetWeight?: number } = {},
): string {
  return setsBlock.serialize({ id: generateCodeBlockId(), exercise, ...opts });
}
