import type { FieldSpec } from "@app/services/codeblocks/CodeBlockSchema";

/**
 * Parameters `workout-log` and `workout-sets` share, so both blocks read and
 * write them the same way (and a guided session plans from either).
 */
export const EXERCISE_FIELDS = {
  exercise: { kind: "string" },
  workout: { kind: "string" },
} as const satisfies Record<string, FieldSpec>;

/** The exercise's plan: planned sets and the targets of progressive overload */
export const PLAN_FIELDS = {
  /** Sets planned for this exercise; the workout-session block counts them */
  sets: { kind: "number", min: 1 },
  targetWeight: { kind: "number", min: 0 },
  targetReps: { kind: "number", min: 0 },
} as const satisfies Record<string, FieldSpec>;

/** Most sets the insert and edit forms offer to plan */
export const MAX_PLANNED_SETS = 20;
