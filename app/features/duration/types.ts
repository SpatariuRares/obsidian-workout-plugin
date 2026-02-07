/**
 * Types for the workout duration estimator feature.
 * The duration estimator calculates estimated workout time based on
 * rest periods (from workout-timer blocks) and set durations.
 */

/**
 * Parameters for the workout-duration code block.
 */
export interface EmbeddedDurationParams {
  /** Path to the workout file to analyze (relative or absolute). Defaults to current file. */
  workout?: string;
}

/**
 * Parsed duration data from analyzing a workout file.
 */
export interface DurationAnalysisResult {
  /** Total rest time in seconds (sum of workout-timer durations) */
  totalRestTime: number;
  /** Number of rest periods found */
  restPeriodCount: number;
  /** Number of sets found in workout-log blocks */
  setCount: number;
  /** Total set time in seconds (setCount * setDuration setting) */
  totalSetTime: number;
  /** Total estimated duration in seconds */
  totalDuration: number;
  /** The workout file path that was analyzed */
  workoutPath: string;
  /** Whether the analysis was successful */
  success: boolean;
  /** Error message if analysis failed */
  error?: string;
  /** Duration calculated from historical logs (timestamps), if available */
  historicalDuration?: number;
  /** Date of the last session used for historical calculation */
  lastSessionDate?: string;
}
