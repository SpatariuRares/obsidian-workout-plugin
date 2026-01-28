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
}

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
}

/**
 * Default plugin settings.
 */
export const DEFAULT_SETTINGS: WorkoutChartsSettings = {
  csvLogFilePath: "theGYM/Log/workout_logs.csv",
  exerciseFolderPath: "Esercizi",
  defaultExercise: "",
  chartType: CHART_DATA_TYPE.VOLUME,
  dateRange: 30,
  showTrendLine: true,
  chartHeight: 400,
  defaultExactMatch: true,
  timerPresets: {},
  defaultTimerPreset: null,
  exerciseBlockTemplate: `## {{exercise}}

\`\`\`workout-timer
duration: {{duration}}
preset: {{preset}}
\`\`\`

\`\`\`workout-log
exercise: {{exercise}}
workout: {{workout}}
\`\`\``,
  weightIncrement: 2.5,
  achievedTargets: {},
  customProtocols: [],
  setDuration: 45,
  showQuickLogRibbon: true,
};

/**
 * Parses CSV content and returns an array of CSVWorkoutLogEntry objects
 *
 * Expected CSV format:
 * - Header: date,exercise,reps,weight,volume,origine,workout,timestamp,notes,protocol
 * - Data rows: date,exercise,reps,weight,volume,origine,workout,timestamp,notes,protocol
 * - Protocol column is optional for backward compatibility (defaults to 'standard')
 * - Validates numeric fields for NaN, reps must be > 0, weight must be >= 0
 * - Skips invalid entries with console warnings for debugging
 */
export function parseCSVLogFile(content: string): CSVWorkoutLogEntry[] {
  try {
    const lines = content.split("\n").filter((line) => line.trim());
    if (lines.length === 0) {
      return [];
    }

    // Parse header - currently not used but kept for future validation
    // const header = lines[0].split(",").map((h) => h.trim());

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
 * Converts CSVWorkoutLogEntry to CSV string format
 */
export function entryToCSVLine(entry: CSVWorkoutLogEntry): string {
  const values = [
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

  return values
    .map((value) => {
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
    })
    .join(",");
}

/**
 * Converts array of CSVWorkoutLogEntry to CSV content
 */
export function entriesToCSVContent(entries: CSVWorkoutLogEntry[]): string {
  const header =
    "date,exercise,reps,weight,volume,origine,workout,timestamp,notes,protocol";
  const lines = [header];

  entries.forEach((entry) => {
    lines.push(entryToCSVLine(entry));
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
  };
}
