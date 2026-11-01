import type { BlockParams } from "@app/services/codeblocks/CodeBlockSchema";
import type { timerBlock } from "@app/features/timer/timerBlock";
import type { IntervalPhase } from "@app/features/timer/business/intervalSchedule";
import {
  TIMER_TYPE,
  type TimerPresetConfig,
} from "@app/types/WorkoutConfigTypes";

export { TIMER_TYPE };
export type { TimerPresetConfig };

/** Parameters of a `workout-timer` block; the schema is in timerBlock.ts */
export type EmbeddedTimerParams = BlockParams<typeof timerBlock>;

export interface TimerState {
  timerInterval?: number;
  startTime?: number;
  elapsedTime: number;
  isRunning: boolean;
  currentRound: number;
  totalRounds: number;
  timerType: TIMER_TYPE;
  /** Seconds; for interval timers the work phase of each round */
  duration: number;
  /** Interval timers: seconds of rest after each round's work */
  rest: number;
  /** Interval timers: the phase the timer is in */
  phase: IntervalPhase;
  /** Every rendering of the block the timer draws on (see TimerSurface) */
  surfaces: TimerSurface[];
}

/**
 * One rendering of a timer block. A note open in reading and editing view
 * renders the block twice and both share the timer, so it draws on every
 * surface still in the document, not only the last one rendered.
 */
export interface TimerSurface {
  timerDisplay: HTMLElement;
  roundCounterDisplay?: HTMLElement;
  startStopBtn?: HTMLButtonElement;
}

export interface TimerCallbacks {
  onTimerComplete?: () => void;
  onSoundPlay?: () => void;
  onStateChange?: (_state: TimerState) => void;
}
