import { defineCodeBlock } from "@app/services/codeblocks/CodeBlockSchema";
import type { BlockParams } from "@app/services/codeblocks/CodeBlockSchema";
import {
  EXERCISE_FIELDS,
  PLAN_FIELDS,
} from "@app/features/tables/exerciseBlockFields";
import { TIMER_TYPE } from "@app/types/WorkoutConfigTypes";
import type { EmbeddedTimerParams } from "@app/features/timer/types";

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
   * Seconds of rest after each set, counted down at the top of the block
   * (with `timer.type: interval`, the work of each round); 0 = no rest
   * timer; unset with no `timer.*` = the section's `workout-timer` (else the
   * default preset)
   */
  rest: { kind: "number", min: 0 },
  /*
   * The rest timer's other options, as a `workout-timer` block writes them
   * (same limits, no defaults: the timer applies them under the preset)
   */
  "timer.preset": { kind: "string" },
  "timer.type": { kind: "enum", values: Object.values(TIMER_TYPE) },
  /** Interval only: seconds of rest after each round's work */
  "timer.rest": { kind: "number", min: 0 },
  /** Interval only */
  "timer.rounds": { kind: "number", min: 1 },
  "timer.showControls": { kind: "boolean" },
  "timer.sound": { kind: "boolean" },
});

export type EmbeddedSetsParams = BlockParams<typeof setsBlock>;

/**
 * The block's own rest timer: `rest` seconds with its `timer.*` options;
 * undefined when it writes neither (or `rest: 0`, no timer at all).
 */
export function blockRest(params: EmbeddedSetsParams): EmbeddedTimerParams | undefined {
  if (params.rest === 0) return undefined;
  const timer: EmbeddedTimerParams = withoutUndefined({
    preset: params["timer.preset"],
    type: params["timer.type"],
    duration: params.rest,
    rest: params["timer.rest"],
    rounds: params["timer.rounds"],
    showControls: params["timer.showControls"],
    sound: params["timer.sound"],
  });
  if (Object.keys(timer).length === 0) return undefined;
  // Seconds alone count down, whatever the default preset is
  if (!timer.type && !timer.preset) timer.type = TIMER_TYPE.COUNTDOWN;
  return timer;
}

/**
 * The block parameters that write a rest timer (the timer form's values),
 * every one of them: unset options are removed from the block.
 */
export function restParams(timer: EmbeddedTimerParams): EmbeddedSetsParams {
  const interval = timer.type === TIMER_TYPE.INTERVAL;
  return {
    rest: timer.work ?? timer.duration,
    "timer.preset": timer.preset,
    "timer.type": timer.type,
    "timer.rest": interval ? timer.rest : undefined,
    "timer.rounds": interval ? timer.rounds : undefined,
    "timer.showControls": timer.showControls,
    "timer.sound": timer.sound,
  };
}

function withoutUndefined<T extends object>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, v]) => v !== undefined),
  ) as T;
}
