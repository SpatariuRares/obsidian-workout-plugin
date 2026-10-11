import { tableBlock } from "@app/features/tables/tableBlock";
import { generateCodeBlockId } from "@app/utils/IdUtils";

export function generateExerciseLogBlock(
  exercise: string,
  workout: string,
  opts?: { limit?: number; exactMatch?: boolean },
): string {
  return tableBlock.serialize({
    id: generateCodeBlockId(),
    exercise,
    workout,
    limit: opts?.limit ?? 12,
    exactMatch: (opts?.exactMatch ?? true) || undefined,
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
