import { defineCodeBlock } from "@app/services/codeblocks/CodeBlockSchema";
import type { BlockParams } from "@app/services/codeblocks/CodeBlockSchema";
import {
  EXERCISE_FIELDS,
  PLAN_FIELDS,
} from "@app/features/tables/exerciseBlockFields";

/**
 * The `workout-sets` code block, the `workout-log` table made for logging on
 * the phone: today's sets of one exercise as rows to fill in and tick. Its
 * parameters are the table's exercise and plan ones: `workout` unset means
 * the note's name, `sets` unset as many rows as last time (at least one).
 * See "Set sheet" in CONTEXT.md.
 */
export const setsBlock = defineCodeBlock("workout-sets", {
  /** Written by the insert modal so the block can be edited in place */
  id: { kind: "string" },
  ...EXERCISE_FIELDS,
  ...PLAN_FIELDS,
  /**
   * Seconds of rest after each set, counted down at the top of the block;
   * 0 = no rest timer; unset = the section's `workout-timer` (else the
   * default preset)
   */
  rest: { kind: "number", min: 0 },
});

export type EmbeddedSetsParams = BlockParams<typeof setsBlock>;
