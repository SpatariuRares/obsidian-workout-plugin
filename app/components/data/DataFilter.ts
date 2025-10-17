import {
  findExerciseMatches,
  determineExerciseFilterStrategy,
  filterLogDataByExercise,
  MatchResult,
  ExerciseMatch,
} from "@app/utils/utils";
import { WorkoutLogData } from "@app/types/WorkoutLogData";
import { EmbeddedChartParams, EmbeddedTableParams, FilterResult } from "@app/types";

/**
 * Handles filtering of workout log data based on various criteria.
 * Provides methods for filtering by exercise name, workout name, and other parameters.
 * Supports both exact and fuzzy matching with intelligent search strategies.
 * Now supports AND logic when both exercise and workout parameters are provided.
 */
export class DataFilter {
  /**
   * Filters workout log data based on the provided parameters.
   * @param logData - Array of workout log data to filter
   * @param params - Filter parameters (exercise, workout, chartType, etc.)
   * @param debugMode - Whether to enable debug logging
   * @returns Filtered data with information about the filtering method used
   */
  static filterData(
    logData: WorkoutLogData[],
    params: EmbeddedChartParams | EmbeddedTableParams,
    debugMode: boolean
  ): FilterResult {
    if (!logData || logData.length === 0) {
      return {
        filteredData: [],
        filterMethodUsed: "none",
        titlePrefix: "Workout Data",
      };
    }

    let filteredData = logData;
    let filterMethodUsed = "none";
    let titlePrefix = "Workout Data";

    const hasExercise = params.exercise && params.exercise.trim();
    const hasWorkout = params.workout || params.workoutPath;

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
        debugMode
      );

      filteredData = exerciseResult.filteredData;
      filterMethodUsed = `${workoutResult.filterMethodUsed} + ${exerciseResult.filterMethodUsed}`;
      titlePrefix = `${exerciseResult.titlePrefix} + ${workoutResult.titlePrefix}`;
    } else if (hasExercise) {
      const result = this.filterByExercise(logData, params, debugMode);
      filteredData = result.filteredData;
      filterMethodUsed = result.filterMethodUsed;
      titlePrefix = result.titlePrefix;
    } else if (hasWorkout) {
      const result = this.filterByWorkout(logData, params);
      filteredData = result.filteredData;
      filterMethodUsed = result.filterMethodUsed;
      titlePrefix = result.titlePrefix;
    }

    return { filteredData, filterMethodUsed, titlePrefix };
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
    let titlePrefix = "Workout Data";

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
   * Optimized exercise filtering with improved matching
   */
  private static filterByExercise(
    logData: WorkoutLogData[],
    params: EmbeddedChartParams | EmbeddedTableParams,
    debugMode: boolean
  ): FilterResult {
    let filteredData = logData;
    let filterMethodUsed = "none";
    let titlePrefix = "Workout Data";

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
        const matchesResult = findExerciseMatches(
          logData,
          exerciseName,
          debugMode
        );

        const { bestStrategy, bestPathKey, bestFileMatchesList } =
          determineExerciseFilterStrategy(
            matchesResult.fileNameMatches,
            matchesResult.allExercisePathsAndScores,
            params.exactMatch || false,
            debugMode,
            exerciseName
          );

        filteredData = filterLogDataByExercise(
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
      return `file name (score: ${bestFileMatchesList[0]?.score || "N/A"})`;
    }
    return "No match found";
  }
}
