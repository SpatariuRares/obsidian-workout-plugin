// Types and utilities for workout log data
import { TFile } from "obsidian";
import {
  CHART_DATA_TYPE,
  TimerPresetConfig,
} from "@app/types/WorkoutConfigTypes";
import { StringUtils } from "@app/utils/StringUtils";
import {
  parseCsv,
  protectFormula,
  stringifyCsvValue,
  unprotectFormula,
} from "@app/utils/data/CsvCodec";
import {
  convertWeightAndVolume,
  isWeightUnit,
  type WeightUnit,
} from "@app/utils/WeightUnitUtils";

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
  protocol?: WorkoutProtocol;
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
  protocol?: WorkoutProtocol;
  /** Custom fields for dynamic exercise type parameters */
  customFields?: Record<string, string | number | boolean>;
  /** Unit of `weight`/`volume` in this row; undefined for legacy rows (settings unit) */
  weightUnit?: WeightUnit;
}

/**
 * Column holding each row's weight unit. Read by header name and appended
 * after custom columns, since standard columns are positional.
 */
export const WEIGHT_UNIT_COLUMN = "weightUnit";

/**
 * Standard column names that are always present in the CSV
 *
 * TODO: Consider removing reps/weight/volume from standard columns in a future
 * breaking change. These are strength-specific parameters and could be moved to
 * customFields like other exercise type parameters (duration, distance, etc.).
 * This would require CSV migration for existing data but would result in a
 * cleaner design where each exercise type only has relevant columns.
 */
export const STANDARD_CSV_COLUMNS = [
  "date",
  "exercise",
  "reps",
  "weight",
  "volume",
  "origine",
  "workout",
  "timestamp",
  "notes",
  "protocol",
] as const;

export type StandardCSVColumn = (typeof STANDARD_CSV_COLUMNS)[number];

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

/**
 * Parses CSV content and returns an array of CSVWorkoutLogEntry objects
 *
 * Expected CSV format:
 * - Header: date,exercise,reps,weight,volume,origine,workout,timestamp,notes,protocol[,customField1,customField2,...]
 * - Data rows: date,exercise,reps,weight,volume,origine,workout,timestamp,notes,protocol[,customValue1,customValue2,...]
 * - Protocol column is optional for backward compatibility (defaults to 'standard')
 * - Custom columns beyond standard columns are mapped to customFields
 * - Validates numeric fields for NaN, reps must be > 0, weight must be >= 0
 * - Skips invalid entries with console warnings for debugging
 */
export function parseCSVLogFile(
  content: string,
): CSVWorkoutLogEntry[] {
  try {
    const rows = parseCsv(content);
    if (rows.length === 0) {
      return [];
    }

    // Parse header to identify columns
    const header = rows[0].map((h) => h.trim());

    // Identify custom columns (columns not in standard set)
    const customColumnNames: string[] = [];
    const customColumnIndices: number[] = [];
    const weightUnitIndex = header.indexOf(WEIGHT_UNIT_COLUMN);
    header.forEach((col, index) => {
      if (
        !STANDARD_CSV_COLUMNS.includes(col as StandardCSVColumn) &&
        col !== WEIGHT_UNIT_COLUMN &&
        col
      ) {
        customColumnNames.push(col);
        customColumnIndices.push(index);
      }
    });

    const entries: CSVWorkoutLogEntry[] = [];

    // Parse data rows
    for (let i = 1; i < rows.length; i++) {
      const values = rows[i].map(unprotectFormula);
      if (values.length < 6) {
        continue;
      }

      const reps = parseInt(values[2]);
      const weight = parseFloat(values[3]);
      const volume = parseFloat(values[4]);
      const timestamp = parseInt(values[7]);

      // Validate numeric fields for NaN
      if (isNaN(reps) || isNaN(weight) || isNaN(volume)) {
        continue;
      }

      // Check if entry has valid custom field data (for non-strength exercises)
      const hasValidCustomData = customColumnIndices.some(
        (colIndex) => {
          const value = values[colIndex]?.trim();
          if (!value) return false;
          const numValue = parseFloat(value);
          return !isNaN(numValue) && numValue > 0;
        },
      );

      // Reject entries where reps <= 0 AND no valid custom field data
      if (reps <= 0 && !hasValidCustomData) {
        continue;
      }

      // Reject entries where weight < 0
      if (weight < 0) {
        continue;
      }

      // Parse protocol field (column 9) - backward compatible, defaults to 'standard'
      const protocolValue = StringUtils.normalize(values[9]);
      const protocol = Object.values(WorkoutProtocol).includes(
        protocolValue as WorkoutProtocol,
      )
        ? (protocolValue as WorkoutProtocol)
        : WorkoutProtocol.STANDARD;

      // Parse custom fields from dynamic columns
      let customFields:
        | Record<string, string | number | boolean>
        | undefined;
      if (customColumnIndices.length > 0) {
        customFields = {};
        customColumnIndices.forEach((colIndex, i) => {
          const value = values[colIndex]?.trim();
          if (value !== undefined && value !== "") {
            // Try to parse as number or boolean
            const parsed = parseCustomFieldValue(value);
            customFields![customColumnNames[i]] = parsed;
          }
        });
        // Only set customFields if there are actual values
        if (Object.keys(customFields).length === 0) {
          customFields = undefined;
        }
      }

      const unitValue =
        weightUnitIndex >= 0 ? values[weightUnitIndex]?.trim() : undefined;

      const entry: CSVWorkoutLogEntry = {
        date: values[0]?.trim() || "",
        exercise: values[1]?.trim() || "",
        reps: reps,
        weight: weight,
        volume: volume,
        origine:
          values[5] && values[5].trim()
            ? values[5].trim()
            : undefined,
        workout:
          values[6] && values[6].trim()
            ? values[6].trim()
            : undefined,
        timestamp: isNaN(timestamp) ? Date.now() : timestamp,
        notes:
          values[8] && values[8].trim()
            ? values[8].trim()
            : undefined,
        protocol: protocol,
        customFields: customFields,
      };
      if (isWeightUnit(unitValue)) {
        entry.weightUnit = unitValue;
      }

      // Validate required fields
      if (entry.exercise) {
        entries.push(entry);
      }
    }

    return entries;
  } catch {
    return [];
  }
}

/**
 * Parses a custom field value, attempting to convert to number or boolean
 */
function parseCustomFieldValue(
  value: string,
): string | number | boolean {
  // Check for boolean
  const lowerValue = value.toLowerCase();
  if (lowerValue === "true") return true;
  if (lowerValue === "false") return false;

  // Check for number
  const num = parseFloat(value);
  if (!isNaN(num) && value.trim() === num.toString()) {
    return num;
  }

  // Return as string
  return value;
}

/**
 * Protects a value against spreadsheet formula injection, then escapes it
 */
function sanitizeCSVValue(value: string): string {
  return stringifyCsvValue(protectFormula(value));
}

/**
 * Converts CSVWorkoutLogEntry to CSV string format
 * @param entry The entry to convert
 * @param customColumns Optional array of custom column names to include in order
 */
export function entryToCSVLine(
  entry: CSVWorkoutLogEntry,
  customColumns?: string[],
): string {
  const values: string[] = [
    entry.date,
    entry.exercise,
    entry.reps.toString(),
    entry.weight.toString(),
    entry.volume.toString(),
    entry.origine || "",
    entry.workout || "",
    entry.timestamp.toString(),
    entry.notes || "",
    entry.protocol || WorkoutProtocol.STANDARD,
  ];

  // Add custom field values in the order specified by customColumns
  if (customColumns && customColumns.length > 0) {
    for (const colName of customColumns) {
      const value =
        colName === WEIGHT_UNIT_COLUMN
          ? entry.weightUnit
          : entry.customFields?.[colName];
      if (value === undefined || value === null) {
        values.push("");
      } else if (typeof value === "boolean") {
        values.push(value.toString());
      } else {
        values.push(String(value));
      }
    }
  }

  return values.map(sanitizeCSVValue).join(",");
}

/**
 * Collects all unique custom column names from entries
 */
export function collectCustomColumns(
  entries: CSVWorkoutLogEntry[],
): string[] {
  const customColumnSet = new Set<string>();
  for (const entry of entries) {
    if (entry.customFields) {
      for (const key of Object.keys(entry.customFields)) {
        customColumnSet.add(key);
      }
    }
  }
  // Return sorted for consistent ordering; the unit column goes last
  const columns = Array.from(customColumnSet).sort();
  if (entries.some((entry) => entry.weightUnit)) {
    columns.push(WEIGHT_UNIT_COLUMN);
  }
  return columns;
}

/**
 * Converts array of CSVWorkoutLogEntry to CSV content
 * Dynamically includes custom columns based on entry customFields
 * @param entries The entries to convert
 * @param existingCustomColumns Optional existing custom columns to preserve (for column order consistency)
 */
export function entriesToCSVContent(
  entries: CSVWorkoutLogEntry[],
  existingCustomColumns?: string[],
): string {
  // Collect all custom columns from entries
  const newCustomColumns = collectCustomColumns(entries);

  // Merge with existing columns, preserving existing order and adding new ones
  const customColumns = existingCustomColumns
    ? [
        ...existingCustomColumns,
        ...newCustomColumns.filter(
          (c) => !existingCustomColumns.includes(c),
        ),
      ]
    : newCustomColumns;

  // Build header
  const standardHeader =
    "date,exercise,reps,weight,volume,origine,workout,timestamp,notes,protocol";
  const header =
    customColumns.length > 0
      ? `${standardHeader},${customColumns.join(",")}`
      : standardHeader;

  const lines = [header];

  entries.forEach((entry) => {
    lines.push(entryToCSVLine(entry, customColumns));
  });

  return lines.join("\n");
}

/**
 * Converts CSVWorkoutLogEntry to WorkoutLogData, with weight and volume in
 * the settings unit
 */
export function convertFromCSVEntry(
  entry: CSVWorkoutLogEntry,
  file: TFile,
  settingsUnit: WeightUnit,
): WorkoutLogData {
  const enteredUnit = entry.weightUnit ?? settingsUnit;
  const { weight, volume } = convertWeightAndVolume(
    entry.reps,
    entry.weight,
    entry.volume,
    enteredUnit,
    settingsUnit,
  );
  return {
    date: entry.date,
    exercise: entry.exercise,
    reps: entry.reps,
    weight,
    volume,
    enteredWeight: entry.weight,
    enteredUnit,
    file: file,
    origine: entry.origine,
    workout: entry.workout,
    notes: entry.notes,
    timestamp: entry.timestamp,
    protocol: entry.protocol,
    customFields: entry.customFields,
  };
}
