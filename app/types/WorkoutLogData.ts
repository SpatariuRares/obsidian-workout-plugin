// Types for workout log data. Reading and writing the CSV is WorkoutLogFile's job.
import { TFile } from "obsidian";
import {
  CHART_DATA_TYPE,
  TimerPresetConfig,
} from "@app/types/WorkoutConfigTypes";
import type { WeightUnit } from "@app/utils/WeightUnitUtils";

/**
 * Workout protocol enum for specialized training techniques.
 * Used to track different training methods applied to sets.
 */
export enum WorkoutProtocol {
  STANDARD = "standard",
  DROP_SET = "drop_set",
  MYO_REPS = "myo_reps",
  REST_PAUSE = "rest_pause",
  SUPERSET = "superset",
  TWENTYONE = "twentyone",
}

/**
 * A protocol id as logged: a built-in WorkoutProtocol or the id of a custom
 * protocol from the settings. Resolve names and colors with ProtocolCatalog.
 */
export type ProtocolId = WorkoutProtocol | (string & {});

/**
 * Configuration for a custom workout protocol.
 * Allows users to define their own training techniques beyond built-in protocols.
 */
export interface CustomProtocolConfig {
  /** Unique identifier for the protocol (lowercase, no spaces) */
  id: string;
  /** Display name for the protocol */
  name: string;
  /** Short abbreviation for badge display (max 3 characters) */
  abbreviation: string;
  /** CSS color for badge background (hex format, e.g., #FF5733) */
  color: string;
}

/**
 * Represents a single workout log entry.
 */
export interface WorkoutLogData {
  date: string;
  exercise: string;
  reps: number;
  weight: number;
  volume: number;
  file?: TFile;
  origine?: string;
  workout?: string;
  notes?: string;
  timestamp?: number;
  protocol?: ProtocolId;
  /** Custom fields for dynamic exercise type parameters */
  customFields?: Record<string, string | number | boolean>;
  /**
   * Weight as typed by the user, in `enteredUnit`. `weight`/`volume` are
   * converted to the settings unit when the CSV is read.
   */
  enteredWeight?: number;
  enteredUnit?: WeightUnit;
}

/**
 * CSV-based workout log entry (without file reference)
 */
export interface CSVWorkoutLogEntry {
  date: string;
  exercise: string;
  reps: number;
  weight: number;
  volume: number;
  origine?: string;
  workout?: string;
  notes?: string;
  timestamp: number; // For sorting and unique identification
  protocol?: ProtocolId;
  /** Custom fields for dynamic exercise type parameters */
  customFields?: Record<string, string | number | boolean>;
  /** Unit of `weight`/`volume` in this row; undefined for legacy rows (settings unit) */
  weightUnit?: WeightUnit;
}

/**
 * A set as callers hand it to WorkoutLogFile to add or update: the file
 * generates the timestamp and computes volume as reps × weight.
 */
export type LogEntryInput = Omit<CSVWorkoutLogEntry, "timestamp" | "volume">;

/**
 * Plugin settings interface.
 */
export interface WorkoutChartsSettings {
  csvLogFilePath: string;
  exerciseFolderPath: string;
  defaultExercise: string;
  chartType: CHART_DATA_TYPE;
  dateRange: number; // days
  showTrendLine: boolean;
  chartHeight: number;
  defaultExactMatch: boolean;
  timerPresets: Record<string, TimerPresetConfig>;
  defaultTimerPreset: string | null;
  exerciseBlockTemplate: string;
  weightIncrement: number;
  achievedTargets: Record<string, number>;
  customProtocols: CustomProtocolConfig[];
  /** Default duration per set in seconds for workout duration estimation */
  setDuration: number;
  /** Duration per repetition in seconds. Used when reps are detected. */
  repDuration: number;
  /** Default number of reps per set. Used when reps are not detected but rep-based calculation is preferred. */
  defaultRepsPerSet: number;
  /** Recent exercises for create/edit log chips (max 10 items, most recent first) */
  recentExercises: string[];
  /** Weight increment for +/- buttons in create/edit log forms */
  quickWeightIncrement: number;
  /** Weight unit for the application (kg or lb) */
  weightUnit: WeightUnit;
  /** Show the dumbbell ribbon icon that opens the create log modal */
  showRibbonIcon: boolean;
}

/**
 * Default plugin settings.
 * Re-exported from defaults.constants.ts for backward compatibility.
 */
export { DEFAULT_SETTINGS } from "@app/constants/defaults.constants";
