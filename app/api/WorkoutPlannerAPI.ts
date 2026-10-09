/**
 * WorkoutPlannerAPI - Public API for Dataview integration
 *
 * This API is exposed globally as window.WorkoutPlannerAPI to enable
 * Dataview users to query workout logs and create custom views.
 */
import {
  WorkoutLogData,
  WorkoutProtocol,
  WorkoutChartsSettings,
} from "@app/types/WorkoutLogData";
import { DataService } from "@app/services/data/DataService";
import { DataFilter } from "@app/services/data/DataFilter";
import { App, TFolder } from "obsidian";
import { StringUtils } from "@app/utils/StringUtils";
import { FrontmatterParser } from "@app/utils/frontmatter/FrontmatterParser";
import type { WeightUnit } from "@app/utils/WeightUnitUtils";

/**
 * Filter options for getWorkoutLogs API
 */
export interface WorkoutLogsFilter {
  /** Filter by exercise name (partial match, case-insensitive) */
  exercise?: string;
  /** Filter by workout/origin name (partial match, case-insensitive) */
  workout?: string;
  /** Filter by date range: { start: "YYYY-MM-DD", end: "YYYY-MM-DD" } */
  dateRange?: {
    start?: string;
    end?: string;
  };
  /** Filter by workout protocol (e.g., "drop_set", "myo_reps") */
  protocol?: string;
  /** Use exact matching instead of partial matching */
  exactMatch?: boolean;
}

/**
 * A workout log entry formatted for Dataview compatibility.
 * All fields are plain values (no Obsidian TFile references).
 */
export interface DataviewWorkoutLog {
  date: string;
  exercise: string;
  reps: number;
  weight: number;
  volume: number;
  workout: string;
  notes: string;
  timestamp: number;
  protocol: string;
  /** Weight as typed, in `enteredUnit`; `weight`/`volume` are in the settings unit */
  enteredWeight?: number;
  enteredUnit?: WeightUnit;
}

/**
 * Filter options for getExercises API
 */
export interface ExercisesFilter {
  /** Filter by tag (reads exercise file frontmatter) */
  tag?: string;
}

/**
 * Exercise statistics returned by getExerciseStats
 */
export interface ExerciseStats {
  /** Total volume (sum of reps × weight for all sets) */
  totalVolume: number;
  /** Maximum weight used for this exercise */
  maxWeight: number;
  /** Total number of sets logged */
  totalSets: number;
  /** Trend indicator: 'up', 'down', or 'stable' based on recent vs older performance */
  trend: "up" | "down" | "stable";
  /** Average weight per set */
  averageWeight: number;
  /** Average reps per set */
  averageReps: number;
  /** Date of the most recent log */
  lastWorkoutDate: string | null;
  /** Personal record weight */
  prWeight: number;
  /** Reps achieved at PR weight */
  prReps: number;
  /** Date when PR was achieved */
  prDate: string | null;
}

/**
 * Public API for Workout Planner plugin.
 * Exposed as window.WorkoutPlannerAPI for Dataview integration.
 */
export class WorkoutPlannerAPI {
  constructor(
    private dataService: DataService,
    private app?: App,
    private settings?: WorkoutChartsSettings,
  ) {}

  /**
   * Get workout logs with optional filtering.
   *
   * @param filter - Optional filter options
   * @returns Promise resolving to array of workout logs compatible with Dataview tables
   *
   * @example
   * // Get all logs
   * const logs = await WorkoutPlannerAPI.getWorkoutLogs();
   *
   * @example
   * // Filter by exercise
   * const squatLogs = await WorkoutPlannerAPI.getWorkoutLogs({ exercise: "Squat" });
   *
   * @example
   * // Filter by date range
   * const recentLogs = await WorkoutPlannerAPI.getWorkoutLogs({
   *   dateRange: { start: "2026-01-01", end: "2026-01-31" }
   * });
   *
   * @example
   * // Filter by protocol
   * const dropSets = await WorkoutPlannerAPI.getWorkoutLogs({ protocol: "drop_set" });
   */
  async getWorkoutLogs(
    filter?: WorkoutLogsFilter,
  ): Promise<DataviewWorkoutLog[]> {
    const rawLogs = await this.dataService.getWorkoutLogData();
    const logs =
      filter?.exercise || filter?.workout
        ? DataFilter.filterRows(rawLogs, {
            exercise: filter.exercise,
            workout: filter.workout,
            exactMatch: filter.exactMatch,
          })
        : rawLogs;

    // Apply additional filters and convert to Dataview-compatible format
    let filteredLogs = this.convertToDataviewFormat(logs);

    // Apply date range filter
    if (filter?.dateRange) {
      filteredLogs = this.applyDateRangeFilter(
        filteredLogs,
        filter.dateRange,
      );
    }

    // Apply protocol filter
    if (filter?.protocol) {
      filteredLogs = this.applyProtocolFilter(
        filteredLogs,
        filter.protocol,
      );
    }

    return filteredLogs;
  }

  /**
   * Convert WorkoutLogData to Dataview-compatible format.
   * Removes TFile references and ensures all fields have values.
   */
  private convertToDataviewFormat(
    logs: WorkoutLogData[],
  ): DataviewWorkoutLog[] {
    return logs.map((log) => ({
      date: log.date,
      exercise: log.exercise,
      reps: log.reps,
      weight: log.weight,
      volume: log.volume,
      workout: log.workout || log.origine || "",
      notes: log.notes || "",
      timestamp: log.timestamp || 0,
      protocol: log.protocol || WorkoutProtocol.STANDARD,
      enteredWeight: log.enteredWeight,
      enteredUnit: log.enteredUnit,
    }));
  }

  /**
   * Filter logs by date range.
   */
  private applyDateRangeFilter(
    logs: DataviewWorkoutLog[],
    dateRange: { start?: string; end?: string },
  ): DataviewWorkoutLog[] {
    return logs.filter((log) => {
      // Parse the log date (expecting ISO format or YYYY-MM-DD)
      const logDate = new Date(log.date);
      if (isNaN(logDate.getTime())) {
        return false;
      }

      // Check start date
      if (dateRange.start) {
        const startDate = new Date(dateRange.start);
        if (!isNaN(startDate.getTime()) && logDate < startDate) {
          return false;
        }
      }

      // Check end date
      if (dateRange.end) {
        const endDate = new Date(dateRange.end);
        // Set end date to end of day for inclusive filtering
        endDate.setHours(23, 59, 59, 999);
        if (!isNaN(endDate.getTime()) && logDate > endDate) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Filter logs by workout protocol.
   */
  private applyProtocolFilter(
    logs: DataviewWorkoutLog[],
    protocol: string,
  ): DataviewWorkoutLog[] {
    const normalizedProtocol = StringUtils.normalize(protocol);
    return logs.filter((log) => {
      const logProtocol = (
        log.protocol || WorkoutProtocol.STANDARD
      ).toLowerCase();
      return logProtocol === normalizedProtocol;
    });
  }

  /**
   * Get statistics for a specific exercise.
   *
   * @param exercise - Exercise name to get stats for
   * @returns Promise resolving to exercise statistics object
   *
   * @example
   * // Get stats for Squat
   * const stats = await WorkoutPlannerAPI.getExerciseStats("Squat");
   * console.log(`Total volume: ${stats.totalVolume}`);
   * console.log(`Max weight: ${stats.maxWeight}`);
   * console.log(`Trend: ${stats.trend}`);
   *
   * @example
   * // Use in Dataview inline query
   * dv.span(`Bench PR: **${(await WorkoutPlannerAPI.getExerciseStats("Bench Press")).prWeight} kg**`);
   */
  async getExerciseStats(exercise: string): Promise<ExerciseStats> {
    // Get logs for the specific exercise
    const logs = await this.getWorkoutLogs({
      exercise,
      exactMatch: true,
    });

    // Default stats for when no logs exist
    if (logs.length === 0) {
      return {
        totalVolume: 0,
        maxWeight: 0,
        totalSets: 0,
        trend: "stable",
        averageWeight: 0,
        averageReps: 0,
        lastWorkoutDate: null,
        prWeight: 0,
        prReps: 0,
        prDate: null,
      };
    }

    // Sort logs by date (most recent first) for trend calculation
    const sortedLogs = [...logs].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;
    });

    // Calculate basic stats
    const totalVolume = logs.reduce(
      (sum, log) => sum + log.volume,
      0,
    );
    const totalSets = logs.length;
    const totalWeight = logs.reduce(
      (sum, log) => sum + log.weight,
      0,
    );
    const totalReps = logs.reduce((sum, log) => sum + log.reps, 0);
    const averageWeight = totalSets > 0 ? totalWeight / totalSets : 0;
    const averageReps = totalSets > 0 ? totalReps / totalSets : 0;

    // Find PR (max weight)
    let prWeight = 0;
    let prReps = 0;
    let prDate: string | null = null;
    for (const log of logs) {
      if (log.weight > prWeight) {
        prWeight = log.weight;
        prReps = log.reps;
        prDate = log.date.split("T")[0];
      }
    }

    // Get last workout date
    const lastWorkoutDate = sortedLogs[0]?.date.split("T")[0] || null;

    // Calculate trend by comparing recent performance (last 30 days) vs older
    const trend = this.calculateTrend(sortedLogs);

    return {
      totalVolume,
      maxWeight: prWeight,
      totalSets,
      trend,
      averageWeight: Math.round(averageWeight * 100) / 100,
      averageReps: Math.round(averageReps * 100) / 100,
      lastWorkoutDate,
      prWeight,
      prReps,
      prDate,
    };
  }

  /**
   * Calculate performance trend based on recent vs older logs.
   * Compares average weight from the last 30 days to the previous period.
   */
  private calculateTrend(
    sortedLogs: DataviewWorkoutLog[],
  ): "up" | "down" | "stable" {
    if (sortedLogs.length < 2) {
      return "stable";
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentLogs: DataviewWorkoutLog[] = [];
    const olderLogs: DataviewWorkoutLog[] = [];

    for (const log of sortedLogs) {
      const logDate = new Date(log.date);
      if (logDate >= thirtyDaysAgo) {
        recentLogs.push(log);
      } else {
        olderLogs.push(log);
      }
    }

    // Need data in both periods to calculate trend
    if (recentLogs.length === 0 || olderLogs.length === 0) {
      return "stable";
    }

    // Compare average weight between periods
    const recentAvgWeight =
      recentLogs.reduce((sum, l) => sum + l.weight, 0) /
      recentLogs.length;
    const olderAvgWeight =
      olderLogs.reduce((sum, l) => sum + l.weight, 0) /
      olderLogs.length;

    // 5% threshold for trend detection
    const percentChange =
      ((recentAvgWeight - olderAvgWeight) / olderAvgWeight) * 100;

    if (percentChange > 5) {
      return "up";
    } else if (percentChange < -5) {
      return "down";
    }
    return "stable";
  }

  /**
   * Get list of available exercises.
   *
   * @param filter - Optional filter options
   * @returns Promise resolving to array of exercise names
   *
   * @example
   * // Get all exercises
   * const exercises = await WorkoutPlannerAPI.getExercises();
   *
   * @example
   * // Filter by tag
   * const chestExercises = await WorkoutPlannerAPI.getExercises({ tag: "chest" });
   *
   * @example
   * // Use in Dataview to list exercises
   * const exercises = await WorkoutPlannerAPI.getExercises({ tag: "compound" });
   * dv.list(exercises);
   */
  async getExercises(filter?: ExercisesFilter): Promise<string[]> {
    // If we have app and settings, try to get exercises from the folder
    if (this.app && this.settings?.exerciseFolderPath) {
      return this.getExercisesFromFolder(filter);
    }

    // Fallback: get unique exercises from workout logs
    return this.getExercisesFromLogs(filter);
  }

  /**
   * Get exercises from the configured exercises folder.
   */
  private async getExercisesFromFolder(
    filter?: ExercisesFilter,
  ): Promise<string[]> {
    if (!this.app || !this.settings) {
      return [];
    }

    const folder = this.app.vault.getAbstractFileByPath(
      this.settings.exerciseFolderPath,
    );
    if (!folder || !(folder instanceof TFolder)) {
      // Fallback to logs if folder doesn't exist
      return this.getExercisesFromLogs(filter);
    }

    // Get all markdown files in the folder
    const exerciseFiles = folder.children.filter(
      (file) => "extension" in file && file.extension === "md",
    );

    // If no tag filter, return all exercise names
    if (!filter?.tag) {
      return exerciseFiles
        .map((file) =>
          "basename" in file
            ? (file as import("obsidian").TFile).basename
            : "",
        )
        .filter(
          (name): name is string =>
            typeof name === "string" && name.length > 0,
        )
        .sort();
    }

    // Filter by tag - read each file's frontmatter
    const tagFilter = filter.tag.toLowerCase();
    const filteredExercises: string[] = [];

    for (const file of exerciseFiles) {
      if (!("path" in file)) continue;
      try {
        const tFile = file as import("obsidian").TFile;
        const content = await this.app.vault.cachedRead(tFile);
        const tags = FrontmatterParser.parseTags(content);

        // Check if any tag matches (case-insensitive)
        const hasMatchingTag = tags.some(
          (tag) => tag.toLowerCase() === tagFilter,
        );

        if (hasMatchingTag) {
          filteredExercises.push(tFile.basename);
        }
      } catch {
        // Skip files that can't be read
      }
    }

    return filteredExercises.sort();
  }

  /**
   * Get unique exercises from workout logs.
   * A tag filter is matched against the frontmatter tags of each exercise's
   * note; when notes can't be resolved the result is empty, never unfiltered.
   */
  private async getExercisesFromLogs(
    filter?: ExercisesFilter,
  ): Promise<string[]> {
    const logs = await this.getWorkoutLogs();
    const exerciseSet = new Set<string>();

    for (const log of logs) {
      if (log.exercise) {
        exerciseSet.add(log.exercise);
      }
    }

    const exercises = Array.from(exerciseSet).sort();
    if (!filter?.tag) {
      return exercises;
    }
    const tag = filter.tag.toLowerCase();
    return exercises.filter((name) =>
      this.getExerciseNoteTags(name).includes(tag),
    );
  }

  /**
   * Lower-cased frontmatter tags (without "#") of the note named like the
   * exercise, or [] if there is no such note.
   */
  private getExerciseNoteTags(exercise: string): string[] {
    const file = this.app?.metadataCache.getFirstLinkpathDest(
      exercise,
      "",
    );
    if (!file) {
      return [];
    }
    return FrontmatterParser.toTagList(
      this.app?.metadataCache.getFileCache(file)?.frontmatter?.tags,
    ).map((tag) => tag.toLowerCase());
  }
}
