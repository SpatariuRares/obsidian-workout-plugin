export enum CHART_TYPE {
  EXERCISE = "exercise",
  WORKOUT = "workout",
  COMBINED = "combined",
  ALL = "all",
  NONE = "NONE",
}

export enum CHART_DATA_TYPE {
  // Strength exercise types
  VOLUME = "volume",
  WEIGHT = "weight",
  REPS = "reps",
  // Timed/Distance/Cardio exercise types
  DURATION = "duration",
  DISTANCE = "distance",
  PACE = "pace",
  HEART_RATE = "heartRate",
}

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
  duration: number;
  showControls: boolean;
  sound: boolean;
  rounds?: number;
}
