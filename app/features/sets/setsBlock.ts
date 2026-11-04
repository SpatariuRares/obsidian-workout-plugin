import { defineCodeBlock } from "@app/services/codeblocks/CodeBlockSchema";
import type { BlockParams } from "@app/services/codeblocks/CodeBlockSchema";

/**
 * The `workout-sets` code block: today's sets of one exercise as rows to fill
 * in and tick, made for the phone. See "Set sheet" in CONTEXT.md.
 */
/** Most rows a block can plan */
export const MAX_PLANNED_SETS = 20;

export const setsBlock = defineCodeBlock("workout-sets", {
  /** Written by the insert modal so the block can be edited in place */
  id: { kind: "string" },
  exercise: { kind: "string" },
  /** Unset: the note's name */
  workout: { kind: "string" },
  /** Rows to fill in; unset: as many as last time (at least one) */
  sets: { kind: "number", min: 1, max: MAX_PLANNED_SETS },
  targetReps: { kind: "number", min: 0 },
  targetWeight: { kind: "number", min: 0 },
});

export type EmbeddedSetsParams = BlockParams<typeof setsBlock>;
