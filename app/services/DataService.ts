import { CONSTANTS } from "@app/constants";
import {
  WorkoutLogData,
  CSVWorkoutLogEntry,
  parseCSVLogFile,
  entriesToCSVContent,
  convertFromCSVEntry,
  WorkoutChartsSettings,
} from "@app/types/WorkoutLogData";
import { App, TFile, Notice } from "obsidian";

export class DataService {
  // Cache stores RAW (unfiltered) data only
  private logDataCache: WorkoutLogData[] | null = null;
  private lastCacheTime: number = 0;
  private readonly CACHE_DURATION = 5000; // 5 seconds cache

  // Lock to prevent parallel CSV loading (race condition fix)
  private loadingPromise: Promise<WorkoutLogData[]> | null = null;

  // Maximum retry attempts for CSV creation
  private readonly MAX_RETRIES = 1;

  /**
   * Maximum cache size to prevent excessive memory consumption.
   * For users with large workout histories (10,000+ entries), we limit the cache
   * to 5,000 entries. This balances performance (avoiding repeated CSV parsing)
   * with memory consumption (preventing browser slowdowns/crashes).
   */
  private readonly MAX_CACHE_SIZE = 5000;

  constructor(
    private app: App,
    private settings: WorkoutChartsSettings,
  ) {}

  async getWorkoutLogData(filterParams?: {
    exercise?: string;
    workout?: string;
    exactMatch?: boolean;
  }): Promise<WorkoutLogData[]> {
    // Get raw data (from cache or CSV)
    const rawData = await this.getRawData();

    // Apply filtering if needed
    if (filterParams) {
      return this.applyEarlyFiltering(rawData, filterParams);
    }

    return rawData;
  }

  /**
   * Get raw (unfiltered) data from cache or CSV
   * Uses a loading lock to prevent parallel CSV reads
   */
  private async getRawData(): Promise<WorkoutLogData[]> {
    const now = Date.now();
 
    // Check if cache is valid and within size limits
    const cacheValid = this.logDataCache &&
                       now - this.lastCacheTime < this.CACHE_DURATION &&
                       this.logDataCache.length <= this.MAX_CACHE_SIZE;

    if (cacheValid) {
       
      return this.logDataCache!;
    }

    // Cache miss or exceeded size limit - clear if needed
    if (this.logDataCache && this.logDataCache.length > this.MAX_CACHE_SIZE) {
      this.logDataCache = null;
      this.lastCacheTime = 0;
    } 

    // If already loading, wait for that promise (race condition prevention)
    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    // Start loading with lock
    this.loadingPromise = this.loadCSVData();

    try {
      const data = await this.loadingPromise;
      return data;
    } finally {
      this.loadingPromise = null;
    }
  }

  /**
   * Load all data from CSV file (no filtering)
   */
  private async loadCSVData(retryCount = 0): Promise<WorkoutLogData[]> {
    const logData: WorkoutLogData[] = [];
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 100; // ms

    try {
      const abstractFile = this.app.vault.getAbstractFileByPath(
        this.settings.csvLogFilePath,
      );

      if (!abstractFile || !(abstractFile instanceof TFile)) {
        // Retry if vault might not be fully loaded yet
        if (retryCount < MAX_RETRIES) {
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
          return this.loadCSVData(retryCount + 1);
        }
        return logData;
      }

      const csvFile = abstractFile;
      const content = await this.app.vault.read(csvFile);
      const csvEntries = parseCSVLogFile(content);

      // Convert ALL CSV entries to WorkoutLogData format (no filtering here!)
      csvEntries.forEach((entry) => {
        const logEntry = convertFromCSVEntry(entry, csvFile);
        logData.push(logEntry);
      });

      // Update cache with RAW (unfiltered) data
      this.logDataCache = logData;
      this.lastCacheTime = Date.now();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      new Notice(`Error loading CSV workout data: ${errorMessage}`);
    }

    return logData;
  }

  /**
   * Apply early filtering to reduce data processing
   *
   * Performance optimization: Pre-compute normalized filter values before the filter loop
   * to avoid redundant string operations (toLowerCase, replace, trim) on every iteration.
   * For large datasets (1000+ entries), this reduces O(n * m) operations to O(n),
   * where n is the number of entries and m is the cost of string normalization.
   */
  private applyEarlyFiltering(
    logData: WorkoutLogData[],
    filterParams: {
      exercise?: string;
      workout?: string;
      exactMatch?: boolean;
    },
  ): WorkoutLogData[] {
    // Pre-compute normalized filter values outside the loop
    const normalizedFilters: {
      exerciseName?: string;
      workoutName?: string;
    } = {};

    if (filterParams.exercise) {
      normalizedFilters.exerciseName = filterParams.exercise
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();
    }

    if (filterParams.workout) {
      normalizedFilters.workoutName = filterParams.workout
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();
    }

    return logData.filter((log) =>
      this.matchesEarlyFilter(log, filterParams, normalizedFilters)
    );
  }

  /**
   * Check if a log entry matches early filtering criteria
   * @param log The workout log entry to check
   * @param filterParams The filter parameters
   * @param normalizedFilters Pre-computed normalized filter values for performance
   */
  private matchesEarlyFilter(
    log: WorkoutLogData,
    filterParams: {
      exercise?: string;
      workout?: string;
      exactMatch?: boolean;
    },
    normalizedFilters?: {
      exerciseName?: string;
      workoutName?: string;
    },
  ): boolean {
    // Check exercise filter
    if (filterParams.exercise) {
      // Performance optimization: Use pre-computed normalized exercise name
      // instead of normalizing on every iteration
      const exerciseName = normalizedFilters?.exerciseName ||
        filterParams.exercise.toLowerCase().replace(/\s+/g, " ").trim();

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
      // Performance optimization: Use pre-computed normalized workout name
      // instead of normalizing on every iteration
      const workoutName = normalizedFilters?.workoutName ||
        filterParams.workout.toLowerCase().replace(/\s+/g, " ").trim();

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
    this.loadingPromise = null;
  }

  /**
   * Create a new CSV log file with header
   */
  public async createCSVLogFile(): Promise<void> {
    const header =
      "date,exercise,reps,weight,volume,origine,workout,timestamp,notes";
    const sampleEntry = `2024-01-01T10:00:00.000Z,Sample Exercise,10,50,500,Sample Workout,Sample Workout,1704096000000,`;
    const content = `${header}\n${sampleEntry}`;

    await this.app.vault.create(this.settings.csvLogFilePath, content);
    this.clearLogDataCache();
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
      // Recursion protection: prevent infinite retry loop
      if (retryCount >= this.MAX_RETRIES) {
        const errorMsg = `Failed to create CSV file at path: ${this.settings.csvLogFilePath}. Please check the path in settings.`;
        new Notice(errorMsg);
        throw new Error(errorMsg);
      }

      // Create the file if it doesn't exist
      await this.createCSVLogFile();
      return this.addWorkoutLogEntry(entry, retryCount + 1); // Retry with incremented counter
    }

    const csvFile = abstractFile;

    await this.app.vault.process(csvFile, (content) => {
      const csvEntries = parseCSVLogFile(content);

      // Add new entry with timestamp
      const newEntry: CSVWorkoutLogEntry = {
        ...entry,
        timestamp: Date.now(),
      };

      csvEntries.push(newEntry);

      // Convert back to CSV content
      return entriesToCSVContent(csvEntries);
    });

    // Clear cache
    this.clearLogDataCache();
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
      throw new Error(CONSTANTS.WORKOUT.MESSAGES.ERRORS.CSV_NOT_FOUND);
    }

    const csvFile = abstractFile;

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
        timestamp: csvEntries[entryIndex].timestamp, // Keep original timestamp
      };

      csvEntries[entryIndex] = updatedEntryWithTimestamp;

      // Convert back to CSV content
      return entriesToCSVContent(csvEntries);
    });

    // Clear cache
    this.clearLogDataCache();
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
      throw new Error(CONSTANTS.WORKOUT.MESSAGES.ERRORS.CSV_NOT_FOUND);
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

      // Remove the entry
      csvEntries.splice(entryIndex, 1);

      // Convert back to CSV content
      return entriesToCSVContent(csvEntries);
    });

    // Clear cache
    this.clearLogDataCache();
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
      throw new Error(CONSTANTS.WORKOUT.MESSAGES.ERRORS.CSV_NOT_FOUND);
    }

    const csvFile = abstractFile;
    let updateCount = 0;

    try {
      await this.app.vault.process(csvFile, (content) => {
        const csvEntries = parseCSVLogFile(content);

        // Normalize names for comparison (trim whitespace, case-insensitive)
        const normalizedOldName = oldName.trim().toLowerCase();

        // Update all matching entries
        csvEntries.forEach((entry) => {
          const normalizedEntryName = entry.exercise.trim().toLowerCase();
          if (normalizedEntryName === normalizedOldName) {
            entry.exercise = newName.trim();
            updateCount++;
          }
        });

        // Convert back to CSV content
        return entriesToCSVContent(csvEntries);
      });

      // Clear cache to reflect changes
      this.clearLogDataCache();

      return updateCount;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to rename exercise: ${errorMessage}`);
    }
  }
}
