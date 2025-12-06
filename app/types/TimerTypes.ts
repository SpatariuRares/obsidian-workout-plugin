export enum TIMER_TYPE {
  COUNTDOWN = "countdown",
  INTERVAL = "interval",
  STOPWATCH = "stopwatch",
}

export interface EmbeddedTimerParams {
  duration?: number; // Duration in seconds
  type?: TIMER_TYPE;
  autoStart?: boolean;
  showControls?: boolean;
  title?: string;
  intervalTime?: number; // For interval timer
  rounds?: number; // For interval timer
  sound?: boolean;
}

export interface TimerState {
  timerInterval?: number;
  startTime?: number;
  elapsedTime: number;
  isRunning: boolean;
  currentRound: number;
  totalRounds: number;
  intervalTime: number;
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

