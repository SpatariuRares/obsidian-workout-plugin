import { CONSTANTS } from "@app/constants";
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
import { StringUtils, ErrorUtils, PathUtils } from "@app/utils";
import { t } from "@app/i18n";

/**
 * Repository for workout log CRUD operations.
 * Handles adding, updating, deleting, and managing workout log entries in the CSV file.
 */
export class WorkoutLogRepository {
  private readonly MAX_RETRIES = 1;

  constructor(
    private app: App,
    private settings: WorkoutChartsSettings,
    private columnService: CSVColumnService,
    private cacheService: CSVCacheService,
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
    await PathUtils.ensureFolderExists(this.app, this.settings.csvLogFilePath);

    await this.app.vault.create(this.settings.csvLogFilePath, content);
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
        const errorMsg = `Failed to create CSV file at path: ${this.settings.csvLogFilePath}. Please check the path in settings.`;
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
    const existingCustomColumns = await this.columnService.getCustomColumns();

    await this.app.vault.process(csvFile, (content) => {
      const csvEntries = parseCSVLogFile(content);

      const newEntry: CSVWorkoutLogEntry = {
        ...entry,
        timestamp: Date.now(),
      };

      csvEntries.push(newEntry);

      return entriesToCSVContent(csvEntries, existingCustomColumns);
    });

    this.cacheService.clearCache();
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
      for (const columnName of Object.keys(updatedEntry.customFields)) {
        await this.columnService.ensureColumnExists(columnName, () =>
          this.cacheService.clearCache(),
        );
      }
    }

    const csvFile = abstractFile;

    // Get existing custom columns to preserve column order
    const existingCustomColumns = await this.columnService.getCustomColumns();

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
            entry.weight === originalLog.weight
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
        timestamp: csvEntries[entryIndex].timestamp,
      };

      csvEntries[entryIndex] = updatedEntryWithTimestamp;

      return entriesToCSVContent(csvEntries, existingCustomColumns);
    });

    this.cacheService.clearCache();
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
            entry.weight === logToDelete.weight
          );
        });
      }

      if (entryIndex === -1) {
        throw new Error("Log entry not found in CSV file");
      }

      csvEntries.splice(entryIndex, 1);

      return entriesToCSVContent(csvEntries);
    });

    this.cacheService.clearCache();
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
          const normalizedEntryName = StringUtils.normalize(entry.exercise);
          if (normalizedEntryName === normalizedOldName) {
            entry.exercise = newName.trim();
            updateCount++;
          }
        });

        return entriesToCSVContent(csvEntries);
      });

      this.cacheService.clearCache();

      return updateCount;
    } catch (error) {
      const errorMessage =
        ErrorUtils.getErrorMessage(error);
      throw new Error(`Failed to rename exercise: ${errorMessage}`);
    }
  }
}
