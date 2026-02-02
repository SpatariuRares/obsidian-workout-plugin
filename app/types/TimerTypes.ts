export enum TIMER_TYPE {
  COUNTDOWN = "countdown",
  INTERVAL = "interval",
  STOPWATCH = "stopwatch",
}

/**
 * Configuration for a reusable timer preset.
 * Presets allow users to save timer configurations and reference them by name.
 */
export interface TimerPresetConfig {
  name: string;
  type: TIMER_TYPE;
  duration: number; // Duration in seconds (used for all timer types)
  showControls: boolean;
  autoStart: boolean;
  sound: boolean;
  rounds?: number; // Number of rounds (for interval timer)
}

export interface EmbeddedTimerParams {
  duration?: number; // Duration in seconds (used for all timer types)
  type?: TIMER_TYPE;
  autoStart?: boolean;
  showControls?: boolean;
  title?: string;
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
  startStopBtn?: HTMLButtonElement;
}

export interface TimerCallbacks {
  onTimerComplete?: () => void;
  onSoundPlay?: () => void;
  onStateChange?: (_state: TimerState) => void;
}

