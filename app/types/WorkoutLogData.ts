// Types and utilities for workout log data
import { TFile } from "obsidian";
import { CHART_DATA_TYPE, TimerPresetConfig } from "@app/types";

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
}

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
  /** Show quick log ribbon icon for mobile logging */
  showQuickLogRibbon: boolean;
  /** Recent exercises for quick log modal (max 10 items, most recent first) */
  recentExercises: string[];
  /** Quick weight increment for quick log modal (e.g., 2.5 for +/- 2.5kg buttons) */
  quickWeightIncrement: number;
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
export function parseCSVLogFile(content: string): CSVWorkoutLogEntry[] {
  try {
    const lines = content.split("\n").filter((line) => line.trim());
    if (lines.length === 0) {
      return [];
    }

    // Parse header to identify columns
    const header = parseCSVLine(lines[0]).map((h) => h.trim());

    // Identify custom columns (columns not in standard set)
    const customColumnNames: string[] = [];
    const customColumnIndices: number[] = [];
    header.forEach((col, index) => {
      if (!STANDARD_CSV_COLUMNS.includes(col as StandardCSVColumn) && col) {
        customColumnNames.push(col);
        customColumnIndices.push(index);
      }
    });

    const entries: CSVWorkoutLogEntry[] = [];

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = parseCSVLine(line);
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

      // Reject entries where reps <= 0
      if (reps <= 0) {
        continue;
      }

      // Reject entries where weight < 0
      if (weight < 0) {
        continue;
      }

      // Parse protocol field (column 9) - backward compatible, defaults to 'standard'
      const protocolValue = values[9]?.trim().toLowerCase() || "";
      const protocol = Object.values(WorkoutProtocol).includes(
        protocolValue as WorkoutProtocol,
      )
        ? (protocolValue as WorkoutProtocol)
        : WorkoutProtocol.STANDARD;

      // Parse custom fields from dynamic columns
      let customFields: Record<string, string | number | boolean> | undefined;
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

      const entry: CSVWorkoutLogEntry = {
        date: values[0]?.trim() || "",
        exercise: values[1]?.trim() || "",
        reps: reps,
        weight: weight,
        volume: volume,
        origine: values[5] && values[5].trim() ? values[5].trim() : undefined,
        workout: values[6] && values[6].trim() ? values[6].trim() : undefined,
        timestamp: isNaN(timestamp) ? Date.now() : timestamp,
        notes: values[8] && values[8].trim() ? values[8].trim() : undefined,
        protocol: protocol,
        customFields: customFields,
      };

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
function parseCustomFieldValue(value: string): string | number | boolean {
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
 * Sanitizes a CSV value for formula injection and proper escaping
 */
function sanitizeCSVValue(value: string): string {
  /**
   * CSV Formula Injection Protection
   *
   * Prefix values starting with formula characters (=, +, -, @) with a single quote
   * to prevent formula injection attacks when CSV is opened in spreadsheet applications.
   *
   * Without this protection, malicious values like "=1+1" or "@SUM(A1:A10)" would be
   * executed as formulas in Excel, LibreOffice, Google Sheets, etc., potentially leading
   * to security issues or data exfiltration.
   *
   * The single quote prefix makes spreadsheet applications treat the value as text
   * rather than a formula.
   */
  let sanitized = value;
  if (/^[=+\-@]/.test(value)) {
    sanitized = "'" + value;
  }

  // Escape quotes and wrap in quotes if contains comma, quote, or newline
  const escaped = sanitized.replace(/"/g, '""');
  if (
    escaped.includes(",") ||
    escaped.includes('"') ||
    escaped.includes("\n")
  ) {
    return `"${escaped}"`;
  }
  return escaped;
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
      const value = entry.customFields?.[colName];
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
export function collectCustomColumns(entries: CSVWorkoutLogEntry[]): string[] {
  const customColumnSet = new Set<string>();
  for (const entry of entries) {
    if (entry.customFields) {
      for (const key of Object.keys(entry.customFields)) {
        customColumnSet.add(key);
      }
    }
  }
  // Return sorted for consistent ordering
  return Array.from(customColumnSet).sort();
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
        ...newCustomColumns.filter((c) => !existingCustomColumns.includes(c)),
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
 * Parses a single CSV line, handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      // End of field
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  // Add the last field
  values.push(current);

  return values;
}

/**
 * Converts CSVWorkoutLogEntry to WorkoutLogData (for backward compatibility)
 */
export function convertFromCSVEntry(
  entry: CSVWorkoutLogEntry,
  file: TFile,
): WorkoutLogData {
  return {
    date: entry.date,
    exercise: entry.exercise,
    reps: entry.reps,
    weight: entry.weight,
    volume: entry.volume,
    file: file,
    origine: entry.origine,
    workout: entry.workout,
    notes: entry.notes,
    timestamp: entry.timestamp,
    protocol: entry.protocol,
    customFields: entry.customFields,
  };
}
