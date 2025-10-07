import { App, TFile, Notice } from "obsidian";
import {
  WorkoutLogData,
  CSVWorkoutLogEntry,
  parseCSVLogFile,
  entriesToCSVContent,
  convertFromCSVEntry,
  WorkoutChartsSettings,
} from "../types/WorkoutLogData";

export class DataService {
  private logDataCache: WorkoutLogData[] | null = null;
  private lastCacheTime: number = 0;
  private readonly CACHE_DURATION = 5000; // 5 seconds cache

  constructor(
    private app: App,
    private settings: WorkoutChartsSettings
  ) {}

  async getWorkoutLogData(filterParams?: {
    exercise?: string;
    workout?: string;
    exactMatch?: boolean;
  }): Promise<WorkoutLogData[]> {
    const now = Date.now();
    if (this.logDataCache && now - this.lastCacheTime < this.CACHE_DURATION) {
      // If we have cached data and filter params, apply filtering to cached data
      if (filterParams) {
        return this.applyEarlyFiltering(this.logDataCache, filterParams);
      }
      return this.logDataCache;
    }

    // Always use CSV mode
    return this.getCSVWorkoutLogData(filterParams);
  }

  /**
   * Get workout log data from CSV file
   */
  private async getCSVWorkoutLogData(filterParams?: {
    exercise?: string;
    workout?: string;
    exactMatch?: boolean;
  }): Promise<WorkoutLogData[]> {
    const logData: WorkoutLogData[] = [];

    try {
      const abstractFile = this.app.vault.getAbstractFileByPath(
        this.settings.csvLogFilePath
      );

      if (!abstractFile || !(abstractFile instanceof TFile)) {
        return logData;
      }

      const csvFile = abstractFile;

      const content = await this.app.vault.read(csvFile);
      const csvEntries = parseCSVLogFile(content, this.settings.debugMode);

      // Convert CSV entries to WorkoutLogData format
      csvEntries.forEach((entry) => {
        const logEntry = convertFromCSVEntry(entry, csvFile);

        // Apply filtering if specified
        if (filterParams) {
          if (!this.matchesEarlyFilter(logEntry, filterParams)) {
            return;
          }
        }

        logData.push(logEntry);
      });

      // Update cache
      this.logDataCache = logData;
      this.lastCacheTime = Date.now();
    } catch (error) {
      console.error("Error reading CSV workout data:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      new Notice(`Error loading CSV workout data: ${errorMessage}`);
    }

    return logData;
  }

  /**
   * Apply early filtering to reduce data processing
   */
  private applyEarlyFiltering(
    logData: WorkoutLogData[],
    filterParams: {
      exercise?: string;
      workout?: string;
      exactMatch?: boolean;
    }
  ): WorkoutLogData[] {
    return logData.filter((log) => this.matchesEarlyFilter(log, filterParams));
  }

  /**
   * Check if a log entry matches early filtering criteria
   */
  private matchesEarlyFilter(
    log: WorkoutLogData,
    filterParams: {
      exercise?: string;
      workout?: string;
      exactMatch?: boolean;
    }
  ): boolean {
    // Check exercise filter
    if (filterParams.exercise) {
      const exerciseName = filterParams.exercise
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();
      const logExercise = (log.exercise || "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();

      if (filterParams.exactMatch) {
        const exerciseMatch = logExercise === exerciseName;

        if (!exerciseMatch) {
          return false;
        }
      } else {
        // Simple includes check for early filtering
        const exerciseMatch = logExercise.includes(exerciseName);

        if (!exerciseMatch) {
          return false;
        }
      }
    }

    // Check workout filter
    if (filterParams.workout) {
      const workoutName = filterParams.workout
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();
      const logOrigine = (log.origine || log.workout || "")
        .toLowerCase()
        .replace(/\[\[|\]\]/g, "")
        .replace(/\s+/g, " ")
        .trim();

      if (filterParams.exactMatch) {
        const workoutMatch = logOrigine === workoutName;

        if (!workoutMatch) {
          return false;
        }
      } else {
        const workoutMatch = logOrigine.includes(workoutName);

        if (!workoutMatch) {
          return false;
        }
      }
    }

    return true;
  }

  public clearLogDataCache(): void {
    this.logDataCache = null;
    this.lastCacheTime = 0;
  }

  /**
   * Create a new CSV log file with header
   */
  public async createCSVLogFile(): Promise<void> {
    const header = "date,exercise,reps,weight,volume,origine,workout,timestamp,notes";
    const sampleEntry = `2024-01-01T10:00:00.000Z,Sample Exercise,10,50,500,Sample Workout,Sample Workout,1704096000000,`;
    const content = `${header}\n${sampleEntry}`;

    await this.app.vault.create(this.settings.csvLogFilePath, content);
    this.clearLogDataCache();
  }

  /**
   * Add a new workout log entry to the CSV file
   */
  public async addWorkoutLogEntry(
    entry: Omit<CSVWorkoutLogEntry, "timestamp">
  ): Promise<void> {
    try {
      const abstractFile = this.app.vault.getAbstractFileByPath(
        this.settings.csvLogFilePath
      );

      if (!abstractFile || !(abstractFile instanceof TFile)) {
        // Create the file if it doesn't exist
        await this.createCSVLogFile();
        return this.addWorkoutLogEntry(entry); // Retry
      }

      const csvFile = abstractFile;

      const content = await this.app.vault.read(csvFile);
      const csvEntries = parseCSVLogFile(content, this.settings.debugMode);

      // Add new entry with timestamp
      const newEntry: CSVWorkoutLogEntry = {
        ...entry,
        timestamp: Date.now(),
      };

      csvEntries.push(newEntry);

      // Convert back to CSV content
      const newContent = entriesToCSVContent(csvEntries);

      // Write back to file
      await this.app.vault.modify(csvFile, newContent);

      // Clear cache
      this.clearLogDataCache();
    } catch (error) {
      console.error("Error adding workout log entry:", error);
      throw error;
    }
  }

  /**
   * Update an existing workout log entry in the CSV file
   */
  public async updateWorkoutLogEntry(
    originalLog: WorkoutLogData,
    updatedEntry: Omit<CSVWorkoutLogEntry, "timestamp">
  ): Promise<void> {
    try {
      const abstractFile = this.app.vault.getAbstractFileByPath(
        this.settings.csvLogFilePath
      );

      if (!abstractFile || !(abstractFile instanceof TFile)) {
        throw new Error("CSV log file not found");
      }

      const csvFile = abstractFile;

      const content = await this.app.vault.read(csvFile);
      const csvEntries = parseCSVLogFile(content, this.settings.debugMode);

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
        timestamp: csvEntries[entryIndex].timestamp, // Keep original timestamp
      };

      csvEntries[entryIndex] = updatedEntryWithTimestamp;

      // Convert back to CSV content
      const newContent = entriesToCSVContent(csvEntries);

      // Write back to file
      await this.app.vault.modify(csvFile, newContent);

      // Clear cache
      this.clearLogDataCache();
    } catch (error) {
      console.error("Error updating workout log entry:", error);
      throw error;
    }
  }

  /**
   * Delete a workout log entry from the CSV file
   */
  public async deleteWorkoutLogEntry(
    logToDelete: WorkoutLogData
  ): Promise<void> {
    try {
      const abstractFile = this.app.vault.getAbstractFileByPath(
        this.settings.csvLogFilePath
      );

      if (!abstractFile || !(abstractFile instanceof TFile)) {
        throw new Error("CSV log file not found");
      }

      const csvFile = abstractFile;

      const content = await this.app.vault.read(csvFile);
      const csvEntries = parseCSVLogFile(content, this.settings.debugMode);

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

      // Remove the entry
      csvEntries.splice(entryIndex, 1);

      // Convert back to CSV content
      const newContent = entriesToCSVContent(csvEntries);

      // Write back to file
      await this.app.vault.modify(csvFile, newContent);

      // Clear cache
      this.clearLogDataCache();
    } catch (error) {
      console.error("Error deleting workout log entry:", error);
      throw error;
    }
  }
}