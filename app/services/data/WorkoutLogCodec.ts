// Text ⇄ entry conversion for the workout log CSV. Only WorkoutLogFile (and
// the example data generator, which writes a fresh file) should need this.
import type { TFile } from "obsidian";
import {
  WorkoutProtocol,
  type CSVWorkoutLogEntry,
  type LogEntryInput,
  type WorkoutLogData,
} from "@app/types/WorkoutLogData";
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
 * Standard columns, always present and read by position.
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

type StandardCSVColumn = (typeof STANDARD_CSV_COLUMNS)[number];

/**
 * Column holding each row's weight unit. Read by header name and always
 * written last, after the custom columns.
 */
export const WEIGHT_UNIT_COLUMN = "weightUnit";

function isStandardColumn(column: string): boolean {
  return STANDARD_CSV_COLUMNS.includes(column as StandardCSVColumn);
}

export interface ParsedLog {
  /** Non-standard header columns in file order, `weightUnit` included */
  customColumns: string[];
  entries: CSVWorkoutLogEntry[];
}

/**
 * Parses the log CSV.
 *
 * - Standard columns are positional; other columns become customFields,
 *   except `weightUnit`, which is read by name
 * - Rows with NaN reps/weight/volume, negative weight, no exercise, or
 *   reps <= 0 without a positive custom value are skipped
 * - Unknown or missing protocol reads as standard
 */
export function parseLog(content: string): ParsedLog {
  let rows: string[][];
  try {
    rows = parseCsv(content);
  } catch {
    return { customColumns: [], entries: [] };
  }
  if (rows.length === 0) {
    return { customColumns: [], entries: [] };
  }

  const header = rows[0].map((h) => h.trim());
  const customColumns = header.filter(
    (col) => col && !isStandardColumn(col),
  );
  const weightUnitIndex = header.indexOf(WEIGHT_UNIT_COLUMN);
  const customFieldColumns: Array<{ name: string; index: number }> = [];
  header.forEach((col, index) => {
    if (col && !isStandardColumn(col) && col !== WEIGHT_UNIT_COLUMN) {
      customFieldColumns.push({ name: col, index });
    }
  });

  const entries: CSVWorkoutLogEntry[] = [];
  for (let i = 1; i < rows.length; i++) {
    const entry = parseRow(
      rows[i].map(unprotectFormula),
      customFieldColumns,
      weightUnitIndex,
    );
    if (entry) entries.push(entry);
  }
  return { customColumns, entries };
}

function parseRow(
  values: string[],
  customFieldColumns: Array<{ name: string; index: number }>,
  weightUnitIndex: number,
): CSVWorkoutLogEntry | null {
  if (values.length < 6) return null;

  const reps = parseInt(values[2]);
  const weight = parseFloat(values[3]);
  const volume = parseFloat(values[4]);
  const timestamp = parseInt(values[7]);
  if (isNaN(reps) || isNaN(weight) || isNaN(volume)) return null;

  // Non-strength rows have reps 0 but a positive custom value
  const hasValidCustomData = customFieldColumns.some(({ index }) => {
    const value = values[index]?.trim();
    if (!value) return false;
    const numValue = parseFloat(value);
    return !isNaN(numValue) && numValue > 0;
  });
  if (reps <= 0 && !hasValidCustomData) return null;
  if (weight < 0) return null;

  const exercise = values[1]?.trim() || "";
  if (!exercise) return null;

  const protocolValue = StringUtils.normalize(values[9]);
  const protocol = Object.values(WorkoutProtocol).includes(
    protocolValue as WorkoutProtocol,
  )
    ? (protocolValue as WorkoutProtocol)
    : WorkoutProtocol.STANDARD;

  const customFields: Record<string, string | number | boolean> = {};
  for (const { name, index } of customFieldColumns) {
    const value = values[index]?.trim();
    if (value !== undefined && value !== "") {
      customFields[name] = parseCustomFieldValue(value);
    }
  }

  const entry: CSVWorkoutLogEntry = {
    date: values[0]?.trim() || "",
    exercise,
    reps,
    weight,
    volume,
    origine: values[5]?.trim() || undefined,
    workout: values[6]?.trim() || undefined,
    timestamp: isNaN(timestamp) ? Date.now() : timestamp,
    notes: values[8]?.trim() || undefined,
    protocol,
    customFields:
      Object.keys(customFields).length > 0 ? customFields : undefined,
  };
  const unitValue =
    weightUnitIndex >= 0 ? values[weightUnitIndex]?.trim() : undefined;
  if (isWeightUnit(unitValue)) {
    entry.weightUnit = unitValue;
  }
  return entry;
}

/** A custom value that reads back as a number or boolean becomes one */
function parseCustomFieldValue(value: string): string | number | boolean {
  const lowerValue = value.toLowerCase();
  if (lowerValue === "true") return true;
  if (lowerValue === "false") return false;

  const num = parseFloat(value);
  if (!isNaN(num) && value.trim() === num.toString()) {
    return num;
  }
  return value;
}

/**
 * Custom column order for a rewrite: the file's existing custom columns in
 * their order (kept even when every row is empty), then columns that only
 * the entries have, sorted, then `weightUnit` last.
 */
function orderCustomColumns(
  existingColumns: string[],
  entries: CSVWorkoutLogEntry[],
): string[] {
  const columns = existingColumns.filter(
    (col) => col !== WEIGHT_UNIT_COLUMN,
  );
  const fresh = new Set<string>();
  for (const entry of entries) {
    for (const key of Object.keys(entry.customFields ?? {})) {
      if (!columns.includes(key) && !isStandardColumn(key)) fresh.add(key);
    }
  }
  columns.push(...Array.from(fresh).sort());

  if (
    existingColumns.includes(WEIGHT_UNIT_COLUMN) ||
    entries.some((entry) => entry.weightUnit)
  ) {
    columns.push(WEIGHT_UNIT_COLUMN);
  }
  return columns;
}

/** Protects a value against spreadsheet formula injection, then escapes it */
function sanitizeCSVValue(value: string): string {
  return stringifyCsvValue(protectFormula(value));
}

function entryToCSVLine(
  entry: CSVWorkoutLogEntry,
  customColumns: string[],
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
  for (const column of customColumns) {
    const value =
      column === WEIGHT_UNIT_COLUMN
        ? entry.weightUnit
        : entry.customFields?.[column];
    values.push(value === undefined || value === null ? "" : String(value));
  }
  return values.map(sanitizeCSVValue).join(",");
}

/**
 * Writes the whole log. Pass the file's current custom columns so their
 * order and empty columns survive the rewrite.
 */
export function serializeLog(
  entries: CSVWorkoutLogEntry[],
  existingCustomColumns: string[] = [],
): string {
  const customColumns = orderCustomColumns(existingCustomColumns, entries);
  const header = [...STANDARD_CSV_COLUMNS, ...customColumns].join(",");
  return [
    header,
    ...entries.map((entry) => entryToCSVLine(entry, customColumns)),
  ].join("\n");
}

/** A row as views use it: weight and volume in the settings unit */
export function toWorkoutLogData(
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
    file,
    origine: entry.origine,
    workout: entry.workout,
    notes: entry.notes,
    timestamp: entry.timestamp,
    protocol: entry.protocol,
    customFields: entry.customFields,
  };
}

/**
 * The inverse of toWorkoutLogData: the log as it should be written back,
 * with the weight and unit the user entered (not the converted weight).
 */
export function toLogEntryInput(log: WorkoutLogData): LogEntryInput {
  return {
    date: log.date,
    exercise: log.exercise,
    reps: log.reps,
    weight: log.enteredWeight ?? log.weight,
    weightUnit: log.enteredUnit,
    origine: log.origine,
    workout: log.workout,
    notes: log.notes,
    protocol: log.protocol,
    customFields: log.customFields ? { ...log.customFields } : undefined,
  };
}
