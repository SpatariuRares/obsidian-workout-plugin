/**
 * Default Values Constants
 *
 * This file contains all default configuration values used throughout the plugin:
 * - Chart configuration defaults (date range, limits)
 * - Table configuration defaults (limits, visible columns)
 * - Timer configuration defaults (duration, interval, rounds)
 * - Plugin settings defaults (paths, preferences)
 *
 * These defaults provide sensible starting values and are used when
 * no user configuration is specified. Each default includes JSDoc
 * documentation explaining its purpose and typical use case.
 */

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
  /** Whether exercise filtering uses exact matching by default */
  defaultExactMatch: true,
  /** Saved timer presets (empty by default) */
  timerPresets: {},
  /** False until Tabata and EMOM are added to the list on first load */
  timerPresetDefaultsAdded: false,
  /** Default timer preset to use (null means no default) */
  defaultTimerPreset: null,
  keepScreenAwake: true,
  vibrateOnCompletion: false,
  /** Default weight increment for progressive overload suggestions */
  weightIncrement: 2.5,
  /** Record of targets the user has achieved (exercise -> weight) */
  achievedTargets: {},
  /** User-defined custom protocols */
  customProtocols: [],
  /** False until the built-in protocols are added to the list on first load */
  protocolDefaultsAdded: false,
  /** Default set duration for fallback estimation (45 seconds) */
  setDuration: 45,
  /** Default duration per repetition (5 seconds) */
  repDuration: 5,
  /** Default reps per set (0 means use setDuration fallback if not found) */
  defaultRepsPerSet: 0,
  /** Recent exercises shown as chips in create/edit modals */
  recentExercises: [],
  /** Weight increment for +/- buttons in create/edit log forms */
  quickWeightIncrement: 2.5,
  /** Default weight unit */
  weightUnit: "kg",
  /** Show the dumbbell ribbon icon that opens the create log modal */
  showRibbonIcon: true,
  /** Any week with a session keeps the streak */
  weeklyGoal: 1,
  /** The welcome modal was shown */
  welcomeShown: false,
  /** Set on the first load; the notes of later versions show once after an update */
  lastSeenVersion: "",
  /** Every beta feature off: updates don't change anything until the user opts in */
  betaFeatures: {},
  /** Only the built-in types (ExerciseTypeCatalog) until the user makes one */
  exerciseTypes: [],
};

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
  /** Default exact match setting for table filtering */
  EXACT_MATCH: false,
} as const;
