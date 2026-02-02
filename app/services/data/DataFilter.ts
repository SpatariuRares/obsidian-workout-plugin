import { CONSTANTS } from "@app/constants";
import {
  ExerciseMatchUtils,
  MatchResult,
  ExerciseMatch,
} from "@app/utils/ExerciseMatchUtils";
import { WorkoutLogData, WorkoutProtocol } from "@app/types/WorkoutLogData";
import {
  EmbeddedChartParams,
  EmbeddedTableParams,
  FilterResult,
} from "@app/types";
import { MuscleTagService } from "@app/services/MuscleTagService";

/**
 * Filter parameters for early filtering in DataService.
 * Used to reduce data processing before more complex filtering operations.
 */
export interface EarlyFilterParams {
  exercise?: string;
  workout?: string;
  exactMatch?: boolean;
}

/**
 * Pre-computed normalized filter values for performance optimization.
 * Avoids redundant string operations on every iteration.
 */
interface NormalizedFilters {
  exerciseName?: string;
  workoutName?: string;
}

/**
 * Handles filtering of workout log data based on various criteria.
 * Provides methods for filtering by exercise name, workout name, protocol, and other parameters.
 * Supports both exact and fuzzy matching with intelligent search strategies.
 * Now supports AND logic when multiple filters are provided.
 *
 * The MuscleTagService can be set via setMuscleTagService() to enable
 * custom muscle tag mappings for muscle-based filtering operations.
 */
export class DataFilter {
  /**
   * Static reference to MuscleTagService for muscle tag lookups.
   * Set via setMuscleTagService() during plugin initialization.
   */
  private static muscleTagService: MuscleTagService | null = null;

  /**
   * Sets the MuscleTagService instance for muscle tag lookups.
   * Should be called during plugin initialization.
   * @param service The MuscleTagService instance
   */
  static setMuscleTagService(service: MuscleTagService): void {
    DataFilter.muscleTagService = service;
  }

  /**
   * Gets the MuscleTagService instance.
   * @returns The MuscleTagService instance or null if not set
   */
  static getMuscleTagService(): MuscleTagService | null {
    return DataFilter.muscleTagService;
  }

  /**
   * Gets the current muscle tag map.
   * Returns the custom tag map from MuscleTagService if available,
   * otherwise returns null (components should fall back to defaults).
   * @returns Map of tag to muscle group, or null if service not set
   */
  static getTagMap(): Map<string, string> | null {
    if (DataFilter.muscleTagService) {
      return DataFilter.muscleTagService.getTagMap();
    }
    return null;
  }

  /**
   * Clears the MuscleTagService reference.
   * Should be called during plugin unload.
   */
  static clearMuscleTagService(): void {
    DataFilter.muscleTagService = null;
  }

  /**
   * Filters workout log data based on the provided parameters.
   * @param logData - Array of workout log data to filter
   * @param params - Filter parameters (exercise, workout, protocol, etc.)
   * @returns Filtered data with information about the filtering method used
   */
  static filterData(
    logData: WorkoutLogData[],
    params: EmbeddedChartParams | EmbeddedTableParams
  ): FilterResult {
    if (!logData || logData.length === 0) {
      return {
        filteredData: [],
        filterMethodUsed: "none",
        titlePrefix: CONSTANTS.WORKOUT.UI.LABELS.WORKOUT_DATA,
      };
    }

    let filteredData = logData;
    let filterMethodUsed = "none";
    let titlePrefix: string = CONSTANTS.WORKOUT.UI.LABELS.WORKOUT_DATA;

    const hasExercise = params.exercise && params.exercise.trim();
    const hasWorkout = params.workout || params.workoutPath;
    const hasProtocol = this.hasProtocolFilter(params);

    if (hasExercise && hasWorkout) {
      // For combined filtering, filter by workout first (usually more restrictive)
      const workoutResult = this.filterByWorkout(logData, params);
      if (workoutResult.filteredData.length === 0) {
        return {
          filteredData: [],
          filterMethodUsed: "No data found for workout",
          titlePrefix: `${params.exercise} + ${params.workout || params.workoutPath
            }`,
        };
      }

      // Then filter the workout results by exercise
      const exerciseResult = this.filterByExercise(
        workoutResult.filteredData,
        params,
      );

      filteredData = exerciseResult.filteredData;
      filterMethodUsed = `${workoutResult.filterMethodUsed} + ${exerciseResult.filterMethodUsed}`;
      titlePrefix = `${exerciseResult.titlePrefix} + ${workoutResult.titlePrefix}`;
    } else if (hasExercise) {
      const result = this.filterByExercise(logData, params);
      filteredData = result.filteredData;
      filterMethodUsed = result.filterMethodUsed;
      titlePrefix = result.titlePrefix;
    } else if (hasWorkout) {
      const result = this.filterByWorkout(logData, params);
      filteredData = result.filteredData;
      filterMethodUsed = result.filterMethodUsed;
      titlePrefix = result.titlePrefix;
    }

    // Apply protocol filter (AND logic with existing filters)
    if (hasProtocol) {
      const protocolResult = this.filterByProtocol(filteredData, params);
      filteredData = protocolResult.filteredData;
      if (filterMethodUsed === "none") {
        filterMethodUsed = protocolResult.filterMethodUsed;
      } else {
        filterMethodUsed = `${filterMethodUsed} + ${protocolResult.filterMethodUsed}`;
      }
    }

    return { filteredData, filterMethodUsed, titlePrefix };
  }

  /**
   * Checks if the params contain a protocol filter
   */
  private static hasProtocolFilter(
    params: EmbeddedChartParams | EmbeddedTableParams
  ): boolean {
    const tableParams = params as EmbeddedTableParams;
    if (!tableParams.protocol) return false;
    if (Array.isArray(tableParams.protocol)) {
      return tableParams.protocol.length > 0;
    }
    return typeof tableParams.protocol === "string" && tableParams.protocol.trim() !== "";
  }

  /**
   * Optimized workout filtering with early termination
   */
  private static filterByWorkout(
    logData: WorkoutLogData[],
    params: EmbeddedChartParams | EmbeddedTableParams
  ): FilterResult {
    let filteredData = logData;
    let filterMethodUsed = "none";
    let titlePrefix: string = CONSTANTS.WORKOUT.UI.LABELS.WORKOUT_DATA;

    if (params.workout || params.workoutPath) {
      const workoutName = params.workout || params.workoutPath;
      if (workoutName) {
        titlePrefix = workoutName;

        const workoutNameLower = workoutName
          .toLowerCase()
          .replace(/\s+/g, " ")
          .trim();
        filteredData = logData.filter((log) => {
          const origine = (log.origine || log.workout || "")
            .toLowerCase()
            .replace(/\[\[|\]\]/g, "")
            .replace(/\s+/g, " ")
            .trim();
          return origine.includes(workoutNameLower);
        });

        filterMethodUsed = `campo Origine:: "${workoutName}"`;
      }
    }

    return { filteredData, filterMethodUsed, titlePrefix };
  }

  /**
   * Filters data by protocol type
   * Supports single protocol string or array of protocols (OR logic within protocol filter)
   * @param logData - Array of workout log data to filter
   * @param params - Filter parameters containing protocol field
   * @returns Filtered data with information about the filtering method used
   */
  private static filterByProtocol(
    logData: WorkoutLogData[],
    params: EmbeddedChartParams | EmbeddedTableParams
  ): FilterResult {
    const tableParams = params as EmbeddedTableParams;
    const protocolParam = tableParams.protocol;

    if (!protocolParam) {
      return {
        filteredData: logData,
        filterMethodUsed: "none",
        titlePrefix: CONSTANTS.WORKOUT.UI.LABELS.WORKOUT_DATA,
      };
    }

    // Normalize protocol values to lowercase array
    const protocols: string[] = Array.isArray(protocolParam)
      ? protocolParam.map((p) => p.toLowerCase().trim())
      : [protocolParam.toLowerCase().trim()];

    // Filter data by matching protocol (OR logic within protocols array)
    const filteredData = logData.filter((log) => {
      const logProtocol = (log.protocol || WorkoutProtocol.STANDARD).toLowerCase();
      return protocols.includes(logProtocol);
    });

    const protocolDisplay = protocols.join(", ");
    const filterMethodUsed = `protocol: [${protocolDisplay}]`;

    return {
      filteredData,
      filterMethodUsed,
      titlePrefix: CONSTANTS.WORKOUT.UI.LABELS.WORKOUT_DATA,
    };
  }

  /**
   * Optimized exercise filtering with improved matching
   */
  private static filterByExercise(
    logData: WorkoutLogData[],
    params: EmbeddedChartParams | EmbeddedTableParams,
  ): FilterResult {
    let filteredData = logData;
    let filterMethodUsed = "none";
    let titlePrefix: string = CONSTANTS.WORKOUT.UI.LABELS.WORKOUT_DATA;

    if (params.exercise && params.exercise.trim()) {
      const exerciseName = params.exercise.trim();
      titlePrefix = exerciseName;

      if (params.exactMatch) {
        const exerciseNameLower = exerciseName
          .toLowerCase()
          .replace(/\s+/g, " ")
          .trim();
        filteredData = logData.filter((log) => {
          const exerciseField = (log.exercise || "")
            .toLowerCase()
            .replace(/\s+/g, " ")
            .trim();
          return exerciseField === exerciseNameLower;
        });
        filterMethodUsed = `exact match on exercise field: "${exerciseName}"`;
      } else {
        const matchesResult = ExerciseMatchUtils.findExerciseMatches(logData, exerciseName);
        
        const { bestStrategy, bestPathKey, bestFileMatchesList } =
          ExerciseMatchUtils.determineExerciseFilterStrategy(
            matchesResult.fileNameMatches,
            matchesResult.allExercisePathsAndScores,
            params.exactMatch || false,
            exerciseName
          );

        filteredData = ExerciseMatchUtils.filterLogDataByExercise(
          logData,
          bestStrategy,
          bestPathKey,
          bestFileMatchesList
        );

        filterMethodUsed = this.getFilterMethodDescription(
          bestStrategy,
          bestPathKey,
          matchesResult,
          bestFileMatchesList
        );
      }
    }

    return { filteredData, filterMethodUsed, titlePrefix };
  }

  /**
   * Generates a human-readable description of the filtering method used.
   * @param bestStrategy - The strategy used for filtering (field, filename, etc.)
   * @param bestPathKey - The key used for filtering
   * @param matchesResult - Results from the matching process
   * @param bestFileMatchesList - List of best file matches
   * @returns Human-readable description of the filtering method
   */
  private static getFilterMethodDescription(
    bestStrategy: string,
    bestPathKey: string,
    matchesResult: MatchResult,
    bestFileMatchesList: ExerciseMatch[]
  ): string {
    if (bestStrategy === "field") {
      const bestPathScore =
        matchesResult.allExercisePathsAndScores.get(bestPathKey) || 0;
      return `Exercise field:: "${bestPathKey}" (score: ${bestPathScore})`;
    } else if (bestStrategy === "filename") {
      return `file name (score: ${bestFileMatchesList[0]?.score || CONSTANTS.WORKOUT.LABELS.TABLE.NOT_AVAILABLE})`;
    }
    return "No match found";
  }

  /**
   * Apply early filtering to reduce data processing.
   *
   * Performance optimization: Pre-compute normalized filter values before the filter loop
   * to avoid redundant string operations (toLowerCase, replace, trim) on every iteration.
   * For large datasets (1000+ entries), this reduces O(n * m) operations to O(n),
   * where n is the number of entries and m is the cost of string normalization.
   *
   * @param logData - Array of workout log data to filter
   * @param filterParams - Filter parameters for exercise and workout
   * @returns Filtered array of workout log data
   */
  static applyEarlyFiltering(
    logData: WorkoutLogData[],
    filterParams: EarlyFilterParams,
  ): WorkoutLogData[] {
    // Pre-compute normalized filter values outside the loop
    const normalizedFilters: NormalizedFilters = {};

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
   * Check if a log entry matches early filtering criteria.
   * @param log The workout log entry to check
   * @param filterParams The filter parameters
   * @param normalizedFilters Pre-computed normalized filter values for performance
   */
  private static matchesEarlyFilter(
    log: WorkoutLogData,
    filterParams: EarlyFilterParams,
    normalizedFilters?: NormalizedFilters,
  ): boolean {
    // Check exercise filter
    if (filterParams.exercise) {
      const exerciseName =
        normalizedFilters?.exerciseName ||
        filterParams.exercise.toLowerCase().replace(/\s+/g, " ").trim();

      const logExercise = (log.exercise || "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();

      if (filterParams.exactMatch) {
        if (logExercise !== exerciseName) {
          return false;
        }
      } else {
        if (!logExercise.includes(exerciseName)) {
          return false;
        }
      }
    }

    // Check workout filter
    if (filterParams.workout) {
      const workoutName =
        normalizedFilters?.workoutName ||
        filterParams.workout.toLowerCase().replace(/\s+/g, " ").trim();

      const logOrigine = (log.origine || log.workout || "")
        .toLowerCase()
        .replace(/\[\[|\]\]/g, "")
        .replace(/\s+/g, " ")
        .trim();

      if (filterParams.exactMatch) {
        if (logOrigine !== workoutName) {
          return false;
        }
      } else {
        if (!logOrigine.includes(workoutName)) {
          return false;
        }
      }
    }

    return true;
  }
}
