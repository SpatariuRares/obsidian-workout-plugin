// Types and utilities for workout log data
import { TFile } from "obsidian";
import { CHART_DATA_TYPE, TimerPresetConfig } from "@app/types";

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
};

/**
 * Parses CSV content and returns an array of CSVWorkoutLogEntry objects
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

      const entry: CSVWorkoutLogEntry = {
        date: values[0]?.trim() || "",
        exercise: values[1]?.trim() || "",
        reps: parseInt(values[2]) || 0,
        weight: parseFloat(values[3]) || 0,
        volume: parseFloat(values[4]) || 0,
        origine: values[5] && values[5].trim() ? values[5].trim() : undefined,
        workout: values[6] && values[6].trim() ? values[6].trim() : undefined,
        timestamp: parseInt(values[7]) || Date.now(),
        notes: values[8] && values[8].trim() ? values[8].trim() : undefined,
      };

      // Validate required fields
      if (entry.exercise && entry.reps > 0 && entry.weight >= 0) {
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
  ];

  return values
    .map((value) => {
      // Escape quotes and wrap in quotes if contains comma, quote, or newline
      const escaped = value.replace(/"/g, '""');
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
    "date,exercise,reps,weight,volume,origine,workout,timestamp,notes";
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
  file: TFile
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
  };
}
