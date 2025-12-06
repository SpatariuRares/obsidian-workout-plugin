/* eslint-disable no-unused-vars */
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
  debug?: boolean;
}
