import { CodeGenerator } from "@app/features/modals/components/CodeGenerator";
import { TABLE_TYPE } from "@app/features/tables/types";

export function generateExerciseLogBlock(
  exercise: string,
  workout: string,
  opts?: { limit?: number; exactMatch?: boolean },
): string {
  return CodeGenerator.generateTableCode({
    tableType: TABLE_TYPE.COMBINED,
    exercise,
    workout,
    limit: opts?.limit ?? 12,
    showAddButton: true,
    searchByName: false,
    exactMatch: opts?.exactMatch ?? true,
  });
}

export function generateExerciseOnlyLogBlock(
  exercise: string,
  limit: number,
): string {
  return CodeGenerator.generateTableCode({
    tableType: TABLE_TYPE.EXERCISE,
    exercise,
    workout: "",
    limit,
    showAddButton: true,
    searchByName: false,
    exactMatch: false,
  });
}

export function generateWorkoutLogBlock(
  workout: string,
  limit: number,
): string {
  return CodeGenerator.generateTableCode({
    tableType: TABLE_TYPE.WORKOUT,
    exercise: "",
    workout,
    limit,
    showAddButton: true,
    searchByName: false,
    exactMatch: false,
  });
}

export function generateCombinedLogBlock(
  exercise: string,
  workout: string,
  limit: number,
): string {
  return CodeGenerator.generateTableCode({
    tableType: TABLE_TYPE.COMBINED,
    exercise,
    workout,
    limit,
    showAddButton: true,
    searchByName: false,
    exactMatch: true,
  });
}
