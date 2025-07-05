// Types and utilities for workout log data
import { TFile } from "obsidian";

/**
 * Represents a single workout log entry.
 */
export interface WorkoutLogData {
  date: string;
  exercise: string;
  reps: number;
  weight: number;
  volume: number;
  file: TFile;
  origine?: string;
  workout?: string;
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
  timestamp: number; // For sorting and unique identification
}

/**
 * Plugin settings interface.
 */
export interface WorkoutChartsSettings {
  csvLogFilePath: string;
  exerciseFolderPath: string;
  defaultExercise: string;
  chartType: "volume" | "weight" | "reps";
  dateRange: number; // days
  showTrendLine: boolean;
  chartHeight: number;
  debugMode: boolean;
}

/**
 * Default plugin settings.
 */
export const DEFAULT_SETTINGS: WorkoutChartsSettings = {
  csvLogFilePath: "theGYM/Log/workout_logs.csv",
  exerciseFolderPath: "Esercizi",
  defaultExercise: "",
  chartType: "volume",
  dateRange: 30,
  showTrendLine: true,
  chartHeight: 400,
  debugMode: false,
};

/**
 * Parses CSV content and returns an array of CSVWorkoutLogEntry objects
 */
export function parseCSVLogFile(
  content: string,
  debugMode = false
): CSVWorkoutLogEntry[] {
  try {
    if (debugMode) {
      console.log("=== PARSING CSV FILE ===");
      console.log(`Content length: ${content.length}`);
      console.log(`Content preview:`, content.substring(0, 200) + "...");
    }

    const lines = content.split("\n").filter((line) => line.trim());
    if (lines.length === 0) {
      if (debugMode) console.log("No content found in CSV file");
      return [];
    }

    // Parse header
    const header = lines[0].split(",").map((h) => h.trim());
    if (debugMode) {
      console.log("CSV Headers:", header);
    }

    const entries: CSVWorkoutLogEntry[] = [];

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = parseCSVLine(line);
      if (values.length < 6) {
        if (debugMode) console.warn(`Skipping invalid line ${i + 1}: ${line}`);
        continue;
      }

      try {
        const entry: CSVWorkoutLogEntry = {
          date: values[0]?.trim() || "",
          exercise: values[1]?.trim() || "",
          reps: parseInt(values[2]) || 0,
          weight: parseFloat(values[3]) || 0,
          volume: parseFloat(values[4]) || 0,
          origine: values[5]?.trim() || undefined,
          workout: values[6]?.trim() || undefined,
          timestamp: parseInt(values[7]) || Date.now(),
        };

        // Validate required fields
        if (entry.exercise && entry.reps > 0 && entry.weight >= 0) {
          entries.push(entry);
        } else {
          if (debugMode)
            console.warn(`Skipping invalid entry at line ${i + 1}:`, entry);
        }
      } catch (error) {
        if (debugMode) console.warn(`Error parsing line ${i + 1}:`, error);
      }
    }

    if (debugMode) {
      console.log(`Successfully parsed ${entries.length} entries from CSV`);
    }

    return entries;
  } catch (error) {
    if (debugMode) {
      console.error("Error parsing CSV file:", error);
    }
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
  const header = "date,exercise,reps,weight,volume,origine,workout,timestamp";
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
    timestamp: entry.timestamp,
  };
}
