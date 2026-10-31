import { Notice, type TFile } from "obsidian";
import type {
  CSVWorkoutLogEntry,
  LogEntryInput,
  WorkoutChartsSettings,
  WorkoutLogData,
} from "@app/types/WorkoutLogData";
import type { LogStorage } from "@app/services/data/LogStorage";
import {
  parseLog,
  serializeLog,
  toWorkoutLogData,
} from "@app/services/data/WorkoutLogCodec";
import type { WorkoutEventBus } from "@app/services/events/WorkoutEventBus";
import type { WeightUnit } from "@app/utils/WeightUnitUtils";
import { StringUtils } from "@app/utils/StringUtils";
import { ErrorUtils } from "@app/utils/ErrorUtils";
import { TrainingHistory } from "@app/services/history/TrainingHistory";
import { t } from "@app/i18n";

const CACHE_DURATION_MS = 5000;
/**
 * Above this many entries the cache is dropped and every read parses the
 * file again, so very large histories don't sit in memory.
 */
const MAX_CACHE_SIZE = 5000;
/** The vault may not have indexed the file yet right after startup */
const LOAD_RETRIES = 3;

const SAMPLE_ENTRY: CSVWorkoutLogEntry = {
  date: "2024-01-01T10:00:00.000Z",
  exercise: "Sample Exercise",
  reps: 10,
  weight: 50,
  volume: 500,
  origine: "Sample Workout",
  workout: "Sample Workout",
  timestamp: 1704096000000,
};

export interface WorkoutLogFileOptions {
  /** Delay between load retries while the file is missing (default 100ms) */
  retryDelayMs?: number;
}

/**
 * The workout log CSV: the single source of truth for every set logged.
 *
 * Owns the file's format (header, column order, weight unit column, volume)
 * and its cache. Every mutation rewrites the file through one path that
 * keeps the column order, clears the cache and emits a `log:*` event.
 */
export class WorkoutLogFile {
  private cache: WorkoutLogData[] | null = null;
  private cacheTime = 0;
  private loading: Promise<WorkoutLogData[]> | null = null;
  private unsubscribers: Array<() => void> = [];
  private readonly retryDelayMs: number;

  constructor(
    private storage: LogStorage,
    private settings: WorkoutChartsSettings,
    private eventBus: WorkoutEventBus,
    options: WorkoutLogFileOptions = {},
  ) {
    this.retryDelayMs = options.retryDelayMs ?? 100;
    this.unsubscribers.push(
      // External refreshes (the deprecated triggerWorkoutLogRefresh) emit
      // log events too, so every log event drops the cache
      eventBus.on("log:added", () => this.clearCache()),
      eventBus.on("log:updated", () => this.clearCache()),
      eventBus.on("log:deleted", () => this.clearCache()),
      eventBus.on("log:bulk-changed", () => this.clearCache()),
      // Weights are converted to the settings unit on read, and the file
      // itself may have moved
      eventBus.on("settings:changed", (payload) => {
        if (
          payload.key === "weightUnit" ||
          payload.key === "csvLogFilePath"
        ) {
          this.clearCache();
        }
      }),
    );
  }

  /** De-register event listeners. Call in plugin.onunload() */
  destroy(): void {
    for (const unsubscribe of this.unsubscribers) unsubscribe();
    this.unsubscribers = [];
    this.clearCache();
  }

  /**
   * Every logged set, weight and volume in the settings unit. Cached for
   * 5 seconds; empty when there is no log file.
   */
  async read(): Promise<WorkoutLogData[]> {
    if (
      this.cache &&
      Date.now() - this.cacheTime < CACHE_DURATION_MS &&
      this.cache.length <= MAX_CACHE_SIZE
    ) {
      return this.cache;
    }
    if (this.loading) return this.loading;

    this.loading = this.load();
    try {
      return await this.loading;
    } finally {
      this.loading = null;
    }
  }

  clearCache(): void {
    this.cache = null;
    this.cacheTime = 0;
    this.loading = null;
  }

  /** The most recent set of an exercise (case/whitespace-insensitive) */
  async findLastForExercise(
    exerciseName: string,
  ): Promise<WorkoutLogData | undefined> {
    if (!exerciseName) return undefined;
    return new TrainingHistory(await this.read()).lastSet(exerciseName);
  }

  /** Create the log file with its header and a sample row */
  async create(): Promise<void> {
    await this.storage.create(serializeLog([SAMPLE_ENTRY]));
    this.clearCache();
  }

  /**
   * Append a set. Creates the file when missing. The timestamp is
   * generated, volume is reps × weight, and the unit defaults to the
   * settings unit.
   */
  async add(entry: LogEntryInput): Promise<void> {
    let file = this.storage.file();
    if (!file) {
      await this.create();
      file = this.storage.file();
    }
    if (!file) {
      const message = t("messages.errors.workoutLogCreateError", {
        path: this.settings.csvLogFilePath,
      });
      new Notice(message);
      throw new Error(message);
    }

    let added!: CSVWorkoutLogEntry;
    let recordIncrease: number | undefined;
    await this.rewrite(file, (entries) => {
      added = { ...this.toRow(entry), timestamp: Date.now() };
      recordIncrease = new TrainingHistory(
        entries.map((row) => this.toLog(row, file)),
      ).recordIncrease(this.toLog(added, file));
      entries.push(added);
    });

    if (recordIncrease !== undefined) {
      new Notice(
        t("modal.notices.newRecord", {
          weight: Number(this.toLog(added, file).weight.toFixed(2)),
          increase: Number(recordIncrease.toFixed(2)),
          unit: this.settings.weightUnit,
        }),
      );
    }

    this.eventBus.emit({
      type: "log:added",
      payload: {
        entry: this.toLog(added, file),
        context: { exercise: added.exercise, workout: added.workout },
      },
    });
  }

  /**
   * Replace a set, keeping its timestamp. The set is found by timestamp,
   * or else by date, exercise, reps and entered weight.
   */
  async update(
    original: WorkoutLogData,
    entry: LogEntryInput,
  ): Promise<void> {
    const file = this.requireFile();

    let updated!: CSVWorkoutLogEntry;
    await this.rewrite(file, (entries) => {
      const index = findRowIndex(entries, original);
      if (index === -1) {
        throw new Error("Original log entry not found in CSV file");
      }
      updated = {
        ...this.toRow(entry),
        timestamp: entries[index].timestamp,
      };
      entries[index] = updated;
    });

    this.eventBus.emit({
      type: "log:updated",
      payload: {
        previous: original,
        updated: this.toLog(updated, file),
      },
    });
  }

  /** Remove a set, found the same way as update() */
  async delete(log: WorkoutLogData): Promise<void> {
    const file = this.requireFile();

    await this.rewrite(file, (entries) => {
      const index = findRowIndex(entries, log);
      if (index === -1)
        throw new Error("Log entry not found in CSV file");
      entries.splice(index, 1);
    });

    this.eventBus.emit({
      type: "log:deleted",
      payload: {
        entry: log,
        context: { exercise: log.exercise, workout: log.workout },
      },
    });
  }

  /**
   * Rename every set of an exercise (case/whitespace-insensitive match).
   * @returns How many sets were renamed
   */
  async renameExercise(
    oldName: string,
    newName: string,
  ): Promise<number> {
    const file = this.requireFile();
    const target = StringUtils.normalize(oldName);

    let count = 0;
    try {
      await this.rewrite(file, (entries) => {
        for (const entry of entries) {
          if (StringUtils.normalize(entry.exercise) === target) {
            entry.exercise = newName.trim();
            count++;
          }
        }
      });
    } catch (error) {
      throw new Error(
        `Failed to rename exercise: ${ErrorUtils.getErrorMessage(error)}`,
      );
    }

    this.eventBus.emit({
      type: "log:bulk-changed",
      payload: { count, operation: "rename" },
    });
    return count;
  }

  /**
   * Give rows without a weight unit (written before units were stored per
   * row) the given unit, so later setting changes don't relabel them.
   * Numbers are not touched. Backs up the CSV first; idempotent.
   * @returns How many rows were stamped
   */
  async stampMissingWeightUnits(unit: WeightUnit): Promise<number> {
    const file = this.storage.file();
    if (!file) return 0;

    const { entries } = parseLog(await this.storage.read(file));
    if (!entries.some((entry) => !entry.weightUnit)) return 0;

    await this.storage.backup(file);

    let count = 0;
    await this.rewrite(file, (rows) => {
      for (const row of rows) {
        if (row.weightUnit) continue;
        row.weightUnit = unit;
        count++;
      }
    });

    this.eventBus.emit({
      type: "log:bulk-changed",
      payload: { count, operation: "migrate-unit" },
    });
    return count;
  }

  /**
   * The one write path: parse, let `change` edit the rows in place, write
   * back with the file's column order, drop the cache.
   */
  private async rewrite(
    file: TFile,
    change: (entries: CSVWorkoutLogEntry[]) => void,
  ): Promise<void> {
    await this.storage.process(file, (content) => {
      const { customColumns, entries } = parseLog(content);
      change(entries);
      return serializeLog(entries, customColumns);
    });
    this.clearCache();
  }

  private requireFile(): TFile {
    const file = this.storage.file();
    if (!file) throw new Error(t("messages.csvNotFound"));
    return file;
  }

  private toRow(
    entry: LogEntryInput,
  ): Omit<CSVWorkoutLogEntry, "timestamp"> {
    return {
      ...entry,
      volume: entry.reps * entry.weight,
      weightUnit: entry.weightUnit ?? this.settings.weightUnit,
    };
  }

  private toLog(
    entry: CSVWorkoutLogEntry,
    file: TFile,
  ): WorkoutLogData {
    return toWorkoutLogData(entry, file, this.settings.weightUnit);
  }

  private async load(attempt = 0): Promise<WorkoutLogData[]> {
    try {
      const file = this.storage.file();
      if (!file) {
        if (attempt < LOAD_RETRIES) {
          await new Promise((resolve) =>
            window.setTimeout(resolve, this.retryDelayMs),
          );
          return this.load(attempt + 1);
        }
        return [];
      }

      const { entries } = parseLog(await this.storage.read(file));
      const logs = entries.map((entry) => this.toLog(entry, file));
      this.cache = logs;
      this.cacheTime = Date.now();
      return logs;
    } catch (error) {
      new Notice(
        t("messages.errors.csvLoadError", {
          error: ErrorUtils.getErrorMessage(error),
        }),
      );
      return [];
    }
  }
}

/** Timestamp first; rows from older files may lack a stable one */
function findRowIndex(
  entries: CSVWorkoutLogEntry[],
  log: WorkoutLogData,
): number {
  const byTimestamp = entries.findIndex(
    (entry) => entry.timestamp === log.timestamp,
  );
  if (byTimestamp !== -1) return byTimestamp;
  return entries.findIndex(
    (entry) =>
      entry.date === log.date &&
      entry.exercise === log.exercise &&
      entry.reps === log.reps &&
      entry.weight === (log.enteredWeight ?? log.weight),
  );
}
