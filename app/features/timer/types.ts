import {
  TIMER_TYPE,
  type TimerPresetConfig,
} from "@app/types/WorkoutConfigTypes";

export { TIMER_TYPE };
export type { TimerPresetConfig };

export interface EmbeddedTimerParams {
  id?: string; // Unique identifier for code block replacement
  duration?: number; // Duration in seconds (used for all timer types)
  type?: TIMER_TYPE;
  showControls?: boolean;
  exercise?: string;
  workout?: string;
  rounds?: number; // Number of rounds (for interval timer)
  sound?: boolean;
  preset?: string; // Name of a saved timer preset to use as base configuration
}

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
