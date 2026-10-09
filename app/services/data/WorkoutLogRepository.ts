import {
  WorkoutLogData,
  CSVWorkoutLogEntry,
  parseCSVLogFile,
  entriesToCSVContent,
  WorkoutChartsSettings,
} from "@app/types/WorkoutLogData";
import { App, TFile, Notice } from "obsidian";
import type { CSVColumnService } from "@app/services/data/CSVColumnService";
import type { CSVCacheService } from "@app/services/data/CSVCacheService";
import type { WorkoutEventBus } from "@app/services/events/WorkoutEventBus";
import { StringUtils, ErrorUtils, PathUtils } from "@app/utils";
import { t } from "@app/i18n";
import type { WeightUnit } from "@app/utils/WeightUnitUtils";

/**
 * Repository for workout log CRUD operations.
 * Handles adding, updating, deleting, and managing workout log entries in the CSV file.
 */
export class WorkoutLogRepository {
  private readonly MAX_RETRIES = 1;
  private readonly MAX_BACKUPS = 3;

  constructor(
    private app: App,
    private settings: WorkoutChartsSettings,
    private columnService: CSVColumnService,
    private cacheService: CSVCacheService,
    private eventBus: WorkoutEventBus,
  ) {}

  /**
   * Create a new CSV log file with header
   */
  public async createCSVLogFile(): Promise<void> {
    const header =
      "date,exercise,reps,weight,volume,origine,workout,timestamp,notes,protocol";
    const sampleEntry = `2024-01-01T10:00:00.000Z,Sample Exercise,10,50,500,Sample Workout,Sample Workout,1704096000000,`;
    const content = `${header}\n${sampleEntry}`;

    // Ensure parent folder exists
    await PathUtils.ensureFolderExists(
      this.app,
      this.settings.csvLogFilePath,
    );

    await this.app.vault.create(
      this.settings.csvLogFilePath,
      content,
    );
    this.cacheService.clearCache();
  }

  /**
   * Add a new workout log entry to the CSV file
   * @param entry - The workout log entry to add (timestamp will be auto-generated)
   * @param retryCount - Internal retry counter for recursion protection (default: 0)
   */
  public async addWorkoutLogEntry(
    entry: Omit<CSVWorkoutLogEntry, "timestamp">,
    retryCount = 0,
  ): Promise<void> {
    const abstractFile = this.app.vault.getAbstractFileByPath(
      this.settings.csvLogFilePath,
    );

    if (!abstractFile || !(abstractFile instanceof TFile)) {
      if (retryCount >= this.MAX_RETRIES) {
        const errorMsg = t("messages.errors.workoutLogCreateError", { path: this.settings.csvLogFilePath });
        new Notice(errorMsg);
        throw new Error(errorMsg);
      }

      await this.createCSVLogFile();
      return this.addWorkoutLogEntry(entry, retryCount + 1);
    }

    // Ensure any custom field columns exist before writing
    if (entry.customFields) {
      for (const columnName of Object.keys(entry.customFields)) {
        await this.columnService.ensureColumnExists(columnName, () =>
          this.cacheService.clearCache(),
        );
      }
    }

    const csvFile = abstractFile;

    // Get existing custom columns to preserve column order
    const existingCustomColumns =
      await this.columnService.getCustomColumns();

    let generatedTimestamp = Date.now();

    await this.app.vault.process(csvFile, (content) => {
      const csvEntries = parseCSVLogFile(content);

      generatedTimestamp = Date.now();
      const newEntry: CSVWorkoutLogEntry = {
        ...entry,
        weightUnit: entry.weightUnit ?? this.settings.weightUnit,
        timestamp: generatedTimestamp,
      };

      csvEntries.push(newEntry);

      return entriesToCSVContent(csvEntries, existingCustomColumns);
    });

    this.eventBus.emit({
      type: "log:added",
      payload: {
        entry: {
          ...entry,
          timestamp: generatedTimestamp,
        } as WorkoutLogData,
        context: { exercise: entry.exercise, workout: entry.workout },
      },
    });
  }

  /**
   * Update an existing workout log entry in the CSV file
   */
  public async updateWorkoutLogEntry(
    originalLog: WorkoutLogData,
    updatedEntry: Omit<CSVWorkoutLogEntry, "timestamp">,
  ): Promise<void> {
    const abstractFile = this.app.vault.getAbstractFileByPath(
      this.settings.csvLogFilePath,
    );

    if (!abstractFile || !(abstractFile instanceof TFile)) {
      throw new Error(t("messages.csvNotFound"));
    }

    // Ensure any custom field columns exist before writing
    if (updatedEntry.customFields) {
      for (const columnName of Object.keys(
        updatedEntry.customFields,
      )) {
        await this.columnService.ensureColumnExists(columnName, () =>
          this.cacheService.clearCache(),
        );
      }
    }

    const csvFile = abstractFile;

    // Get existing custom columns to preserve column order
    const existingCustomColumns =
      await this.columnService.getCustomColumns();

    await this.app.vault.process(csvFile, (content) => {
      const csvEntries = parseCSVLogFile(content);

      // Find the entry to update by matching timestamp (most reliable identifier)
      let entryIndex = csvEntries.findIndex((entry) => {
        return entry.timestamp === originalLog.timestamp;
      });

      // Fallback: if timestamp not found, try matching by date, exercise, reps, and weight
      if (entryIndex === -1) {
        const fallbackIndex = csvEntries.findIndex((entry) => {
          return (
            entry.date === originalLog.date &&
            entry.exercise === originalLog.exercise &&
            entry.reps === originalLog.reps &&
            entry.weight === (originalLog.enteredWeight ?? originalLog.weight)
          );
        });

        if (fallbackIndex !== -1) {
          entryIndex = fallbackIndex;
        }
      }

      if (entryIndex === -1) {
        throw new Error("Original log entry not found in CSV file");
      }

      // Update the entry while preserving the original timestamp
      const updatedEntryWithTimestamp: CSVWorkoutLogEntry = {
        ...updatedEntry,
        weightUnit: updatedEntry.weightUnit ?? this.settings.weightUnit,
        timestamp: csvEntries[entryIndex].timestamp,
      };

      csvEntries[entryIndex] = updatedEntryWithTimestamp;

      return entriesToCSVContent(csvEntries, existingCustomColumns);
    });

    this.eventBus.emit({
      type: "log:updated",
      payload: {
        previous: originalLog,
        updated: {
          ...updatedEntry,
          timestamp: originalLog.timestamp,
        } as WorkoutLogData,
      },
    });
  }

  /**
   * Delete a workout log entry from the CSV file
   */
  public async deleteWorkoutLogEntry(
    logToDelete: WorkoutLogData,
  ): Promise<void> {
    const abstractFile = this.app.vault.getAbstractFileByPath(
      this.settings.csvLogFilePath,
    );

    if (!abstractFile || !(abstractFile instanceof TFile)) {
      throw new Error(t("messages.csvNotFound"));
    }

    const csvFile = abstractFile;

    await this.app.vault.process(csvFile, (content) => {
      const csvEntries = parseCSVLogFile(content);

      // Find the entry to delete by matching timestamp (most reliable identifier)
      let entryIndex = csvEntries.findIndex((entry) => {
        return entry.timestamp === logToDelete.timestamp;
      });

      // Fallback: if timestamp not found, try matching by date, exercise, reps, and weight
      if (entryIndex === -1) {
        entryIndex = csvEntries.findIndex((entry) => {
          return (
            entry.date === logToDelete.date &&
            entry.exercise === logToDelete.exercise &&
            entry.reps === logToDelete.reps &&
            entry.weight === (logToDelete.enteredWeight ?? logToDelete.weight)
          );
        });
      }

      if (entryIndex === -1) {
        throw new Error("Log entry not found in CSV file");
      }

      csvEntries.splice(entryIndex, 1);

      return entriesToCSVContent(csvEntries);
    });

    this.eventBus.emit({
      type: "log:deleted",
      payload: {
        entry: logToDelete,
        context: {
          exercise: logToDelete.exercise,
          workout: logToDelete.workout,
        },
      },
    });
  }

  /**
   * Rename an exercise in the CSV file
   * @param oldName The current exercise name
   * @param newName The new exercise name
   * @returns The count of updated entries
   */
  public async renameExercise(
    oldName: string,
    newName: string,
  ): Promise<number> {
    const abstractFile = this.app.vault.getAbstractFileByPath(
      this.settings.csvLogFilePath,
    );

    if (!abstractFile || !(abstractFile instanceof TFile)) {
      throw new Error(t("messages.csvNotFound"));
    }

    const csvFile = abstractFile;
    let updateCount = 0;

    try {
      await this.app.vault.process(csvFile, (content) => {
        const csvEntries = parseCSVLogFile(content);

        const normalizedOldName = StringUtils.normalize(oldName);

        csvEntries.forEach((entry) => {
          const normalizedEntryName = StringUtils.normalize(
            entry.exercise,
          );
          if (normalizedEntryName === normalizedOldName) {
            entry.exercise = newName.trim();
            updateCount++;
          }
        });

        return entriesToCSVContent(csvEntries);
      });

      this.eventBus.emit({
        type: "log:bulk-changed",
        payload: { count: updateCount, operation: "rename" },
      });

      return updateCount;
    } catch (error) {
      const errorMessage = ErrorUtils.getErrorMessage(error);
      throw new Error(`Failed to rename exercise: ${errorMessage}`);
    }
  }

  /**
   * Give rows without a weight unit (written before units were stored per
   * row) the given unit, so later setting changes don't relabel them.
   * Numbers are not touched. Backs up the CSV first; idempotent.
   * @returns The count of stamped entries
   */
  public async stampMissingWeightUnits(unit: WeightUnit): Promise<number> {
    const abstractFile = this.app.vault.getAbstractFileByPath(
      this.settings.csvLogFilePath,
    );

    // No log file yet: nothing to stamp
    if (!abstractFile || !(abstractFile instanceof TFile)) return 0;

    const csvFile = abstractFile;
    const hasMissing = parseCSVLogFile(
      await this.app.vault.read(csvFile),
    ).some((entry) => !entry.weightUnit);
    if (!hasMissing) return 0;

    await this.backupCSVFile(csvFile);

    // Preserve column order and columns that are empty in every row
    const existingCustomColumns =
      await this.columnService.getCustomColumns();

    let updateCount = 0;
    await this.app.vault.process(csvFile, (content) => {
      const csvEntries = parseCSVLogFile(content);

      csvEntries.forEach((entry) => {
        if (entry.weightUnit) return;
        entry.weightUnit = unit;
        updateCount++;
      });

      return entriesToCSVContent(csvEntries, existingCustomColumns);
    });

    this.eventBus.emit({
      type: "log:bulk-changed",
      payload: { count: updateCount, operation: "migrate-unit" },
    });

    return updateCount;
  }

  /**
   * Copy the CSV to `<name>.backup-<ISO timestamp>.csv` in the same folder,
   * then trash older backups beyond MAX_BACKUPS.
   */
  private async backupCSVFile(csvFile: TFile): Promise<void> {
    const prefix = `${csvFile.basename}.backup-`;
    const existingBackups = (csvFile.parent?.children ?? [])
      .filter(
        (file): file is TFile =>
          file instanceof TFile && file.name.startsWith(prefix),
      )
      .sort((a, b) => a.name.localeCompare(b.name));

    const folderPath = csvFile.parent?.path;
    const dir = folderPath && folderPath !== "/" ? `${folderPath}/` : "";
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const content = await this.app.vault.read(csvFile);
    await this.app.vault.create(
      `${dir}${prefix}${stamp}.${csvFile.extension}`,
      content,
    );

    const toTrash = existingBackups.slice(
      0,
      Math.max(0, existingBackups.length - (this.MAX_BACKUPS - 1)),
    );
    for (const file of toTrash) {
      await this.app.fileManager.trashFile(file);
    }
  }
}
