import { defineCodeBlock } from "@app/services/codeblocks/CodeBlockSchema";
import { TIMER_TYPE } from "@app/types/WorkoutConfigTypes";

/**
 * The `workout-timer` code block. Defaults apply last: a preset's values
 * win over them, and the block's own values win over the preset.
 */
export const timerBlock = defineCodeBlock("workout-timer", {
  /** Written by the insert modal so the block can be edited in place */
  id: { kind: "string" },
  /** Name of a saved preset used as the base configuration */
  preset: { kind: "string" },
  type: {
    kind: "enum",
    values: Object.values(TIMER_TYPE),
    default: TIMER_TYPE.COUNTDOWN,
  },
  /** Seconds (the work phase of each round for interval timers) */
  duration: { kind: "number", min: 1, default: 30 },
  /** Interval timers only: seconds of work per round (wins over duration) */
  work: { kind: "number", min: 1 },
  /** Interval timers only: seconds of rest after each round's work */
  rest: { kind: "number", min: 0, default: 0 },
  /** Interval timers only */
  rounds: { kind: "number", min: 1, default: 1 },
  exercise: { kind: "string" },
  workout: { kind: "string" },
  showControls: { kind: "boolean", default: true },
  sound: { kind: "boolean", default: true },
  /** Start as soon as the block renders (once per timer) */
  autoStart: { kind: "boolean", default: false },
  /** Canvas export: this exercise is done back to back with the next one */
  superset: { kind: "boolean" },
});
