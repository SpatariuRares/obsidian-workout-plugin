import { parseCsv } from "@app/utils/data/CsvCodec";
import {
  WorkoutProtocol,
  type TimedLogEntryInput,
} from "@app/types/WorkoutLogData";
import type { WeightUnit } from "@app/utils/WeightUnitUtils";

/** The phone apps whose "export workout data" CSV can be imported */
export type ExportSource = "strong" | "hevy";

export interface WorkoutExport {
  source: ExportSource;
  /** One per exported set, in file order */
  sets: TimedLogEntryInput[];
}

/** The app's name, also written as each imported set's origin */
export const SOURCE_NAME: Record<ExportSource, string> = {
  strong: "Strong",
  hevy: "Hevy",
};

const KM_PER_MILE = 1.609344;

/** Column names (lower case) of the apps' CSV exports */
const HEVY = {
  title: "title",
  start: "start_time",
  end: "end_time",
  exercise: "exercise_title",
  notes: "exercise_notes",
  setType: "set_type",
  kg: "weight_kg",
  lbs: "weight_lbs",
  reps: "reps",
  km: "distance_km",
  miles: "distance_miles",
  seconds: "duration_seconds",
  rpe: "rpe",
};

const STRONG = {
  date: "date",
  workout: "workout name",
  exercise: "exercise name",
  setOrder: "set order",
  weightUnit: "weight unit",
  reps: "reps",
  distanceUnit: "distance unit",
  seconds: "seconds",
  rpe: "rpe",
  notes: "notes",
};

const MONTHS = [
  "jan", "feb", "mar", "apr", "may", "jun",
  "jul", "aug", "sep", "oct", "nov", "dec",
];

/** A set as both apps describe it, before it becomes a log row */
interface ExportedSet {
  /** Groups the sets of one workout */
  workoutKey: string;
  start: Date;
  /** Workout end, when the export has it */
  end?: Date;
  workout: string;
  exercise: string;
  protocol: WorkoutProtocol;
  reps: number;
  weight: number;
  weightUnit: WeightUnit;
  distanceKm?: number;
  seconds?: number;
  rpe?: number;
  notes?: string;
}

/**
 * Reads a Strong or Hevy CSV export into log rows: one per set, in the
 * unit the app exported, with the workout's name and start date. Set
 * timestamps are spread over the workout's length so sessions keep their
 * duration. Warm-up and drop sets become those protocols; RPE, distance
 * (km) and duration go to custom fields. Duration is in minutes next to a
 * distance (cardio) and in seconds alone (timed holds).
 *
 * @returns null when the file is neither export
 */
export function readWorkoutExport(
  content: string,
  fallbackUnit: WeightUnit,
): WorkoutExport | null {
  const text = content.replace(/^\uFEFF/, "");
  const firstLine = text.slice(0, text.search(/\r?\n|$/));
  const delimiter =
    count(firstLine, ";") > count(firstLine, ",") ? ";" : ",";
  const [header, ...rows] = parseCsv(text, delimiter);
  if (!header) return null;
  const columns = header.map((name) => name.trim().toLowerCase());

  let source: ExportSource;
  let exported: Array<ExportedSet | null>;
  if (columns.includes(HEVY.exercise) && columns.includes(HEVY.start)) {
    source = "hevy";
    exported = rows.map((row) => readHevyRow(new Row(columns, row)));
  } else if (
    columns.includes(STRONG.exercise) &&
    columns.includes(STRONG.setOrder)
  ) {
    source = "strong";
    exported = rows.map((row) =>
      readStrongRow(new Row(columns, row), fallbackUnit),
    );
  } else {
    return null;
  }

  return {
    source,
    sets: toLogRows(
      exported.filter((set): set is ExportedSet => set !== null),
      SOURCE_NAME[source],
    ),
  };
}

function readHevyRow(row: Row): ExportedSet | null {
  const start = parseHevyDate(row.text(HEVY.start));
  const exercise = row.text(HEVY.exercise);
  if (!start || !exercise) return null;

  const miles = row.number(HEVY.miles);
  const setType = row.text(HEVY.setType).toLowerCase();
  return {
    workoutKey: `${row.text(HEVY.start)}|${row.text(HEVY.title)}`,
    start,
    end: parseHevyDate(row.text(HEVY.end)),
    workout: row.text(HEVY.title),
    exercise,
    protocol: protocolFor(setType === "warmup", setType === "dropset"),
    reps: row.number(HEVY.reps) ?? 0,
    weight: row.number(HEVY.kg) ?? row.number(HEVY.lbs) ?? 0,
    weightUnit: row.has(HEVY.lbs) ? "lb" : "kg",
    distanceKm:
      miles !== undefined ? miles * KM_PER_MILE : row.number(HEVY.km),
    seconds: row.number(HEVY.seconds),
    rpe: row.number(HEVY.rpe),
    notes: row.text(HEVY.notes),
  };
}

function readStrongRow(
  row: Row,
  fallbackUnit: WeightUnit,
): ExportedSet | null {
  const start = parseStrongDate(row.text(STRONG.date));
  const exercise = row.text(STRONG.exercise);
  // Besides set numbers, Strong marks warm-up (W), drop (D) and failure (F)
  // sets; other rows (rest timers) are not sets
  const order = row.text(STRONG.setOrder).toUpperCase();
  if (!start || !exercise || !/^(\d+|W|D|F)$/.test(order)) return null;

  const weightColumn = row.find(/^weight( \((kg|lbs?)\))?$/);
  const distanceColumn = row.find(/^distance( \(.+\))?$/);
  const duration = row.find(/^(workout )?duration( \(sec\))?$/);
  const seconds = duration ? parseDuration(row.text(duration)) : undefined;

  const distance = distanceColumn ? row.number(distanceColumn) : undefined;
  const distanceUnit =
    distanceColumn?.match(/\((.+)\)/)?.[1] ?? row.text(STRONG.distanceUnit);

  return {
    workoutKey: `${row.text(STRONG.date)}|${row.text(STRONG.workout)}`,
    start,
    end:
      seconds !== undefined
        ? new Date(start.getTime() + seconds * 1000)
        : undefined,
    workout: row.text(STRONG.workout),
    exercise,
    protocol: protocolFor(order === "W", order === "D"),
    reps: row.number(STRONG.reps) ?? 0,
    weight: weightColumn ? (row.number(weightColumn) ?? 0) : 0,
    weightUnit: unitOf(
      weightColumn?.match(/\((.+)\)/)?.[1] ?? row.text(STRONG.weightUnit),
      fallbackUnit,
    ),
    distanceKm:
      distance === undefined ? undefined : toKm(distance, distanceUnit),
    seconds: row.number(STRONG.seconds),
    rpe: row.number(STRONG.rpe),
    notes: row.text(STRONG.notes),
  };
}

/** Log rows for the sets that record something, workout by workout */
function toLogRows(
  sets: ExportedSet[],
  origine: string,
): TimedLogEntryInput[] {
  const workouts = new Map<string, ExportedSet[]>();
  for (const set of sets) {
    const workout = workouts.get(set.workoutKey) ?? [];
    workout.push(set);
    workouts.set(set.workoutKey, workout);
  }

  const rows: TimedLogEntryInput[] = [];
  for (const workout of workouts.values()) {
    const recorded = workout.filter(
      (set) =>
        set.weight >= 0 &&
        (set.reps > 0 || (set.seconds ?? 0) > 0 || (set.distanceKm ?? 0) > 0),
    );
    recorded.forEach((set, index) => {
      rows.push({
        date: set.start.toISOString(),
        timestamp: setTime(set, index, recorded.length),
        exercise: set.exercise,
        reps: Math.round(set.reps),
        weight: set.weight,
        weightUnit: set.weightUnit,
        workout: set.workout || undefined,
        origine,
        notes: set.notes || undefined,
        protocol: set.protocol,
        customFields: customFields(set),
      });
    });
  }
  // Optional keys left undefined are dropped, so rows compare cleanly
  return rows.map(
    (row) =>
      Object.fromEntries(
        Object.entries(row).filter(([, value]) => value !== undefined),
      ) as TimedLogEntryInput,
  );
}

/** The workout's start, plus the share of its length this set is into it */
function setTime(set: ExportedSet, index: number, count: number): number {
  const start = set.start.getTime();
  const length = (set.end?.getTime() ?? start) - start;
  if (length <= 0 || count < 2) return start + index * 1000;
  return start + Math.round((length * index) / (count - 1));
}

function customFields(
  set: ExportedSet,
): Record<string, number> | undefined {
  const fields: Record<string, number> = {};
  if (set.rpe !== undefined && set.rpe > 0) fields.rpe = set.rpe;
  const seconds = set.seconds ?? 0;
  if (set.distanceKm !== undefined && set.distanceKm > 0) {
    fields.distance = round2(set.distanceKm);
    if (seconds > 0) fields.duration = round2(seconds / 60);
  } else if (seconds > 0) {
    fields.duration = seconds;
  }
  return Object.keys(fields).length > 0 ? fields : undefined;
}

function protocolFor(warmup: boolean, drop: boolean): WorkoutProtocol {
  if (warmup) return WorkoutProtocol.WARMUP;
  if (drop) return WorkoutProtocol.DROP_SET;
  return WorkoutProtocol.STANDARD;
}

function unitOf(raw: string, fallback: WeightUnit): WeightUnit {
  const unit = raw.trim().toLowerCase();
  if (unit === "kg" || unit === "kgs") return "kg";
  if (unit === "lb" || unit === "lbs") return "lb";
  return fallback;
}

function toKm(distance: number, unit: string): number {
  const name = unit.trim().toLowerCase();
  if (name === "m" || name === "meters" || name === "metres") {
    return distance / 1000;
  }
  if (name === "mi" || name === "miles") return distance * KM_PER_MILE;
  return distance;
}

/** "3900", "1h 5m", "45m", "30s" → seconds */
function parseDuration(raw: string): number | undefined {
  if (/^\d+(\.\d+)?$/.test(raw)) return Number(raw);
  const part = (suffix: string) =>
    Number(raw.match(new RegExp(`(\\d+)\\s*${suffix}`))?.[1] ?? 0);
  const seconds = part("h") * 3600 + part("m") * 60 + part("s");
  return seconds > 0 ? seconds : undefined;
}

/** "2024-03-05 07:30:00" in local time */
function parseStrongDate(raw: string): Date | undefined {
  const match = raw.match(
    /^(\d{4})-(\d{2})-(\d{2})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?/,
  );
  if (!match) return undefined;
  const [, y, mo, d, h, mi, s] = match;
  return new Date(+y, +mo - 1, +d, +h, +mi, +(s ?? 0));
}

/** "17 Jan 2024, 18:02" in local time */
function parseHevyDate(raw: string): Date | undefined {
  const match = raw.match(
    /^(\d{1,2}) ([A-Za-z]{3})[A-Za-z]* (\d{4}),? (\d{1,2}):(\d{2})/,
  );
  if (!match) return undefined;
  const [, d, mon, y, h, mi] = match;
  const month = MONTHS.indexOf(mon.toLowerCase());
  if (month === -1) return undefined;
  return new Date(+y, month, +d, +h, +mi);
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function count(text: string, char: string): number {
  return text.split(char).length - 1;
}

/** One CSV row, read by (lower-case) column name */
class Row {
  constructor(
    private columns: string[],
    private values: string[],
  ) {}

  has(column: string): boolean {
    return this.columns.includes(column);
  }

  /** The first column whose name matches */
  find(pattern: RegExp): string | undefined {
    return this.columns.find((column) => pattern.test(column));
  }

  text(column: string): string {
    const index = this.columns.indexOf(column);
    return index === -1 ? "" : (this.values[index] ?? "").trim();
  }

  /** Accepts "1,102.5" and a decimal comma ("102,5"); empty is undefined */
  number(column: string): number | undefined {
    const text = this.text(column);
    const raw = text.includes(".")
      ? text.replace(/,/g, "")
      : text.replace(",", ".");
    if (raw === "") return undefined;
    const value = Number(raw);
    return Number.isFinite(value) ? value : undefined;
  }
}
