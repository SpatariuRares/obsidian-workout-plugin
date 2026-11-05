/**
 * WorkoutPlannerAPI - Public API for Dataview integration
 *
 * This API is exposed globally as window.WorkoutPlannerAPI to enable
 * Dataview users to query workout logs and create custom views.
 */
import { WorkoutLogData } from "@app/types/WorkoutLogData";
import type { WorkoutDataPort } from "@app/types/PluginPorts";
import { DataFilter } from "@app/services/data/DataFilter";
import type { ExerciseLibrary } from "@app/services/exercise/ExerciseLibrary";
import type { WeightUnit } from "@app/utils/WeightUnitUtils";
import { protocolId } from "@app/services/protocols/ProtocolCatalog";
import {
  TrainingHistory,
  trainingDay,
  trendOf,
} from "@app/services/history/TrainingHistory";
import { round2 } from "@app/utils/round2";

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
  /** Best Epley estimate (1–12 reps, excluding warm-up/drop sets), in the settings weight unit; null when unavailable. */
  estimatedOneRepMax: number | null;
}

/**
 * Public API for Workout Planner plugin.
 * Exposed as window.WorkoutPlannerAPI for Dataview integration.
 */
export class WorkoutPlannerAPI {
  constructor(
    private dataService: Pick<WorkoutDataPort, "getWorkoutLogData">,
    private exercises?: Pick<ExerciseLibrary, "pages">,
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
    return this.convertToDataviewFormat(await this.filteredRows(filter));
  }

  /** The log's rows that match the filter, as WorkoutLogFile reads them. */
  private async filteredRows(
    filter?: WorkoutLogsFilter,
  ): Promise<WorkoutLogData[]> {
    const rows = DataFilter.filterRows(
      await this.dataService.getWorkoutLogData(),
      {
        exercise: filter?.exercise,
        workout: filter?.workout,
        exactMatch: filter?.exactMatch,
        protocol: filter?.protocol || undefined,
      },
    );
    return filter?.dateRange
      ? this.applyDateRangeFilter(rows, filter.dateRange)
      : rows;
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
      protocol: protocolId(log.protocol),
      enteredWeight: log.enteredWeight,
      enteredUnit: log.enteredUnit,
    }));
  }

  /**
   * Keep the sets whose training day is within the range, both days
   * included. A boundary that is not a date is ignored; a set whose date
   * can't be read is left out.
   */
  private applyDateRangeFilter(
    logs: WorkoutLogData[],
    dateRange: { start?: string; end?: string },
  ): WorkoutLogData[] {
    const start = dayOf(dateRange.start);
    const end = dayOf(dateRange.end);
    return logs.filter((log) => {
      const day = dayOf(log.date);
      if (day === undefined) return false;
      if (start !== undefined && day < start) return false;
      if (end !== undefined && day > end) return false;
      return true;
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
    const logs = await this.filteredRows({ exercise, exactMatch: true });

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
        estimatedOneRepMax: null,
      };
    }

    const history = new TrainingHistory(logs);
    const totalSets = logs.length;
    const totalWeight = logs.reduce((sum, log) => sum + log.weight, 0);
    const totalReps = logs.reduce((sum, log) => sum + log.reps, 0);

    const pr = history.personalRecord(exercise);
    const prWeight = pr?.weight ?? 0;
    const lastSet = history.lastSet(exercise);

    return {
      totalVolume: history.totalVolume(),
      maxWeight: prWeight,
      totalSets,
      trend:
        trendOf(history.heaviestPerDay(exercise))?.direction ?? "stable",
      averageWeight: round2(totalWeight / totalSets),
      averageReps: round2(totalReps / totalSets),
      lastWorkoutDate: lastSet ? trainingDay(lastSet.date) : null,
      prWeight,
      prReps: pr?.reps ?? 0,
      prDate: pr?.day ?? null,
      estimatedOneRepMax:
        history.bestEstimatedOneRepMax(exercise)?.value ?? null,
    };
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
    const pages = this.exercises?.pages() ?? [];
    if (pages.length === 0) {
      return this.getExercisesFromLogs(filter);
    }

    const tag = filter?.tag?.toLowerCase();
    const names = pages
      .filter(
        (page) =>
          !tag || page.tags.some((t) => t.toLowerCase() === tag),
      )
      .map((page) => page.file.basename);
    return Array.from(new Set(names)).sort();
  }

  /**
   * Unique exercises from the workout log, used when there are no exercise
   * pages. Without pages there are no tags, so a tag filter gives [] (never
   * the unfiltered list).
   */
  private async getExercisesFromLogs(
    filter?: ExercisesFilter,
  ): Promise<string[]> {
    if (filter?.tag) {
      return [];
    }
    const logs = await this.getWorkoutLogs();
    const exerciseSet = new Set<string>();
    for (const log of logs) {
      if (log.exercise) {
        exerciseSet.add(log.exercise);
      }
    }
    return Array.from(exerciseSet).sort();
  }
}

/** The training day of a date, or undefined when it isn't one. */
function dayOf(date: string | undefined): string | undefined {
  if (!date) return undefined;
  const day = trainingDay(date);
  return /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : undefined;
}
