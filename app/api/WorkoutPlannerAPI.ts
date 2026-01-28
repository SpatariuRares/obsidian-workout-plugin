/**
 * WorkoutPlannerAPI - Public API for Dataview integration
 *
 * This API is exposed globally as window.WorkoutPlannerAPI to enable
 * Dataview users to query workout logs and create custom views.
 */
import { WorkoutLogData, WorkoutProtocol } from "@app/types/WorkoutLogData";
import { DataService } from "@app/services/DataService";

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
}

/**
 * Public API for Workout Planner plugin.
 * Exposed as window.WorkoutPlannerAPI for Dataview integration.
 */
export class WorkoutPlannerAPI {
  constructor(private dataService: DataService) {}

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
  async getWorkoutLogs(filter?: WorkoutLogsFilter): Promise<DataviewWorkoutLog[]> {
    // Get logs from DataService with exercise/workout filter
    const logs = await this.dataService.getWorkoutLogData({
      exercise: filter?.exercise,
      workout: filter?.workout,
      exactMatch: filter?.exactMatch,
    });

    // Apply additional filters and convert to Dataview-compatible format
    let filteredLogs = this.convertToDataviewFormat(logs);

    // Apply date range filter
    if (filter?.dateRange) {
      filteredLogs = this.applyDateRangeFilter(filteredLogs, filter.dateRange);
    }

    // Apply protocol filter
    if (filter?.protocol) {
      filteredLogs = this.applyProtocolFilter(filteredLogs, filter.protocol);
    }

    return filteredLogs;
  }

  /**
   * Convert WorkoutLogData to Dataview-compatible format.
   * Removes TFile references and ensures all fields have values.
   */
  private convertToDataviewFormat(logs: WorkoutLogData[]): DataviewWorkoutLog[] {
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
    }));
  }

  /**
   * Filter logs by date range.
   */
  private applyDateRangeFilter(
    logs: DataviewWorkoutLog[],
    dateRange: { start?: string; end?: string }
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
    protocol: string
  ): DataviewWorkoutLog[] {
    const normalizedProtocol = protocol.toLowerCase().trim();
    return logs.filter((log) => {
      const logProtocol = (log.protocol || WorkoutProtocol.STANDARD).toLowerCase();
      return logProtocol === normalizedProtocol;
    });
  }
}
