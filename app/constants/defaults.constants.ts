/**
 * Default Values Constants
 *
 * This file contains all default configuration values used throughout the plugin:
 * - Chart configuration defaults (date range, limits)
 * - Table configuration defaults (limits, visible columns, button text)
 * - Timer configuration defaults (duration, interval, rounds)
 * - Plugin settings defaults (paths, preferences)
 *
 * These defaults provide sensible starting values and are used when
 * no user configuration is specified. Each default includes JSDoc
 * documentation explaining its purpose and typical use case.
 */

import { CHART_DATA_TYPE } from "@app/features/charts/types";

import type { WorkoutChartsSettings } from "@app/types/WorkoutLogData";

/**
 * Default plugin settings used when the plugin is first installed
 * or when settings are reset. These provide sensible defaults for
 * typical workout tracking use cases.
 */
export const DEFAULT_SETTINGS: WorkoutChartsSettings = {
  /** Default path for the CSV log file containing workout data */
  csvLogFilePath: "theGYM/Log/workout_logs.csv",
  /** Default folder path for exercise pages */
  exerciseFolderPath: "Esercizi",
  /** Default exercise name (empty means no default) */
  defaultExercise: "",
  /** Default chart data type to display */
  chartType: CHART_DATA_TYPE.VOLUME,
  /** Default date range in days for charts and data filtering */
  dateRange: 30,
  /** Whether to show trend lines on charts by default */
  showTrendLine: true,
  /** Default chart height in pixels */
  chartHeight: 400,
  /** Whether exercise filtering uses exact matching by default */
  defaultExactMatch: true,
  /** Saved timer presets (empty by default) */
  timerPresets: {},
  /** Default timer preset to use (null means no default) */
  defaultTimerPreset: null,
  /** Template for exercise blocks inserted via modal */
  exerciseBlockTemplate: `## {{exercise}}

\`\`\`workout-timer
duration: {{duration}}
preset: {{preset}}
\`\`\`

\`\`\`workout-log
exercise: {{exercise}}
workout: {{workout}}
\`\`\``,
  /** Default weight increment for progressive overload suggestions */
  weightIncrement: 2.5,
  /** Record of targets the user has achieved (exercise -> weight) */
  achievedTargets: {},
  /** User-defined custom protocols */
  customProtocols: [],
  /** Default set duration for workout time estimation (45 seconds) */
  setDuration: 45,
  /** Show quick log button in ribbon for easy mobile logging */
  showQuickLogRibbon: true,
  /** Recent exercises used in quick log modal */
  recentExercises: [],
  /** Weight increment for quick adjustment buttons in quick log */
  quickWeightIncrement: 2.5,
};

/**
 * Default chart configuration values used in chart modals
 * and code block processing when not specified.
 */
export const DEFAULT_CHART_CONFIG = {
  /** Default date range for chart data (180 days / ~6 months) */
  DATE_RANGE: 180,
  /** Minimum allowed date range */
  DATE_RANGE_MIN: 1,
  /** Maximum allowed date range (1 year) */
  DATE_RANGE_MAX: 365,
  /** Default data point limit for charts */
  LIMIT: 100,
  /** Minimum data point limit */
  LIMIT_MIN: 1,
  /** Maximum data point limit */
  LIMIT_MAX: 1000,
} as const;

/**
 * Default table configuration values used in table modals
 * and code block processing when not specified.
 */
export const DEFAULT_TABLE_CONFIG = {
  /** Default number of rows to display in tables */
  LIMIT: 50,
  /** Minimum rows allowed */
  LIMIT_MIN: 1,
  /** Maximum rows allowed */
  LIMIT_MAX: 1000,
  /** Default columns visible in workout log tables */
  VISIBLE_COLUMNS: ["Date", "Reps", "Weight", "Volume", "Notes"],
  /** Default text for the add log button */
  BUTTON_TEXT: "➕ Add Log",
  /** Default exact match setting for table filtering */
  EXACT_MATCH: true,
  /** Default limit specifically for modal inserts (12 rows) */
  MODAL_INSERT_LIMIT: 12,
} as const;

/**
 * Default timer configuration values used in timer modals
 * and code block processing when not specified.
 */
export const DEFAULT_TIMER_CONFIG = {
  /** Default countdown duration in seconds (90 seconds / 1.5 minutes) */
  DURATION: 90,
  /** Minimum duration allowed */
  DURATION_MIN: 1,
  /** Maximum duration allowed (1 hour) */
  DURATION_MAX: 3600,
  /** Default interval time for interval timers */
  INTERVAL: 30,
  /** Minimum interval time */
  INTERVAL_MIN: 1,
  /** Maximum interval time (1 hour) */
  INTERVAL_MAX: 3600,
  /** Default number of rounds for interval timers */
  ROUNDS: 5,
  /** Minimum rounds */
  ROUNDS_MIN: 1,
  /** Maximum rounds */
  ROUNDS_MAX: 100,
} as const;

/**
 * Default date key used when date parsing fails
 */
export const DEFAULT_DATE_KEY = {
  /** Key used for invalid dates in table grouping */
  INVALID: "invalid-date",
} as const;

/**
 * Aggregated defaults export for convenient access
 * Groups all default configurations by domain
 */
export const DEFAULTS = {
  SETTINGS: DEFAULT_SETTINGS,
  CHART: DEFAULT_CHART_CONFIG,
  TABLE: DEFAULT_TABLE_CONFIG,
  TIMER: DEFAULT_TIMER_CONFIG,
  DATE_KEY: DEFAULT_DATE_KEY,
} as const;
