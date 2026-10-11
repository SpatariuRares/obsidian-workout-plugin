import type { BlockParams } from "@app/services/codeblocks/CodeBlockSchema";
import type { timerBlock } from "@app/features/timer/timerBlock";
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
  duration: number;
  timerDisplay?: HTMLElement;
  roundCounterDisplay?: HTMLElement;
  startStopBtn?: HTMLButtonElement;
}

export interface TimerCallbacks {
  onTimerComplete?: () => void;
  onSoundPlay?: () => void;
  onStateChange?: (_state: TimerState) => void;
}
