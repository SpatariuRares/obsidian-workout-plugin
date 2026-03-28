import {
  WorkoutLogData,
  CSVWorkoutLogEntry,
  WorkoutChartsSettings,
} from "@app/types/WorkoutLogData";
import { App } from "obsidian";
import { CSVCacheService } from "@app/services/data/CSVCacheService";
import { CSVColumnService } from "@app/services/data/CSVColumnService";
import { WorkoutLogRepository } from "@app/services/data/WorkoutLogRepository";
import { DataFilter, EarlyFilterParams } from "@app/services/data/DataFilter";
import type { WorkoutEventBus } from "@app/services/events/WorkoutEventBus";
import type { LogBulkChangedPayload } from "@app/services/events/WorkoutEventTypes";
import { StringUtils } from "@app/utils";

/**
 * Facade service for workout data operations.
 * Delegates to specialized services while maintaining backward-compatible API.
 */
export class DataService {
  private cacheService: CSVCacheService;
  private columnService: CSVColumnService;
  private repository: WorkoutLogRepository;

  constructor(
    app: App,
    settings: WorkoutChartsSettings,
    private eventBus: WorkoutEventBus,
  ) {
    this.cacheService = new CSVCacheService(app, settings, eventBus);
    this.columnService = new CSVColumnService(app, settings);
    this.repository = new WorkoutLogRepository(
      app,
      settings,
      this.columnService,
      this.cacheService,
      eventBus,
    );
  }

  /**
   * Get workout log data, optionally filtered by exercise/workout.
   */
  async getWorkoutLogData(
    filterParams?: EarlyFilterParams,
  ): Promise<WorkoutLogData[]> {
    const rawData = await this.cacheService.getRawData();

    if (filterParams) {
      return DataFilter.applyEarlyFiltering(rawData, filterParams);
    }

    return rawData;
  }

  /**
   * Clear the log data cache.
   */
  public clearLogDataCache(): void {
    this.cacheService.clearCache();
  }

  /**
   * De-register event bus listeners and release resources.
   * Call in plugin.onunload().
   */
  public destroy(): void {
    this.cacheService.destroy();
  }

  /**
   * Groups multiple mutations into a single coalesced event.
   * All log:* events emitted inside fn() are suppressed; when fn() completes
   * a single log:bulk-changed is emitted instead.
   *
   * Without an eventBus, fn() executes normally (no coalescing).
   *
   * @example
   * await dataService.batchOperation('import', async () => {
   *   for (const entry of entries) await dataService.addWorkoutLogEntry(entry);
   * });
   * // Emits: log:bulk-changed { count: N, operation: 'import' }
   */
  public async batchOperation(
    operation: LogBulkChangedPayload['operation'],
    fn: () => Promise<void>,
  ): Promise<void> {
    await this.eventBus.batch(operation, fn);
  }

  /**
   * Get all column names from the CSV file header.
   */
  public async getCSVColumns(): Promise<string[]> {
    return this.columnService.getCSVColumns();
  }

  /**
   * Ensure a column exists in the CSV file header.
   */
  public async ensureColumnExists(columnName: string): Promise<void> {
    return this.columnService.ensureColumnExists(columnName, () =>
      this.cacheService.clearCache(),
    );
  }

  /**
   * Create a new CSV log file with header.
   */
  public async createCSVLogFile(): Promise<void> {
    return this.repository.createCSVLogFile();
  }

  /**
   * Add a new workout log entry to the CSV file.
   */
  public async addWorkoutLogEntry(
    entry: Omit<CSVWorkoutLogEntry, "timestamp">,
    retryCount = 0,
  ): Promise<void> {
    return this.repository.addWorkoutLogEntry(entry, retryCount);
  }

  /**
   * Update an existing workout log entry.
   */
  public async updateWorkoutLogEntry(
    originalLog: WorkoutLogData,
    updatedEntry: Omit<CSVWorkoutLogEntry, "timestamp">,
  ): Promise<void> {
    return this.repository.updateWorkoutLogEntry(originalLog, updatedEntry);
  }

  /**
   * Delete a workout log entry.
   */
  public async deleteWorkoutLogEntry(
    logToDelete: WorkoutLogData,
  ): Promise<void> {
    return this.repository.deleteWorkoutLogEntry(logToDelete);
  }

  /**
   * Rename an exercise in the CSV file.
   * @returns The count of updated entries
   */
  public async renameExercise(
    oldName: string,
    newName: string,
  ): Promise<number> {
    return this.repository.renameExercise(oldName, newName);
  }

  /**
   * Finds the most recent log entry for a given exercise.
   * @param exerciseName The exercise name to search for
   * @returns The most recent log entry or undefined if not found
   */
  public async findLastEntryForExercise(
    exerciseName: string,
  ): Promise<WorkoutLogData | undefined> {
    if (!exerciseName) {
      return undefined;
    }

    const workoutLogData = await this.getWorkoutLogData();

    if (workoutLogData.length === 0) {
      return undefined;
    }

    // Sort by timestamp descending to get most recent first
    const sortedData = [...workoutLogData].sort((a, b) => {
      const timestampA = a.timestamp || 0;
      const timestampB = b.timestamp || 0;
      return timestampB - timestampA;
    });

    return sortedData.find(
      (log) =>
        StringUtils.normalize(log.exercise) ===
        StringUtils.normalize(exerciseName),
    );
  }
}
