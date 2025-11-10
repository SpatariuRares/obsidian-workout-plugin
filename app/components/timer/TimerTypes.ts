export interface TimerState {
  timerInterval?: number;
  startTime?: number;
  elapsedTime: number;
  isRunning: boolean;
  currentRound: number;
  totalRounds: number;
  intervalTime: number;
  timerType: "countdown" | "stopwatch" | "interval";
  duration: number;
  timerDisplay?: HTMLElement;
  startStopBtn?: HTMLButtonElement;
}

export interface TimerCallbacks {
  onTimerComplete?: () => void;
  onSoundPlay?: () => void;
  onStateChange?: (_state: TimerState) => void;
}