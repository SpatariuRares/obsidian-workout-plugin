import {
  EmbeddedChartParams,
  EmbeddedTableParams,
  FilterResult,
} from "./types";
import {
  findExerciseMatches,
  determineExerciseFilterStrategy,
  filterLogDataByExercise,
} from "../utils/utils";
import { WorkoutLogData } from "../types/WorkoutLogData";

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
        titlePrefix: "Dati Allenamento",
      };
    }

    let filteredData = logData;
    let filterMethodUsed = "none";
    let titlePrefix = "Dati Allenamento";
    const filterMethods: string[] = [];

    const hasExercise = params.exercise && params.exercise.trim();
    const hasWorkout = params.workout || params.workoutPath;

    if (debugMode) {
      console.log("DataFilter: Starting filtering process", {
        totalData: logData.length,
        hasExercise,
        hasWorkout,
        exercise: params.exercise,
        workout: params.workout || params.workoutPath,
      });
    }

    if (hasExercise && hasWorkout) {
      const exerciseResult = this.filterByExercise(logData, params, debugMode);
      const workoutResult = this.filterByWorkout(
        exerciseResult.filteredData,
        params
      );

      filteredData = workoutResult.filteredData;
      filterMethodUsed = `${exerciseResult.filterMethodUsed} + ${workoutResult.filterMethodUsed}`;
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
    } else {
      if (debugMode) {
        console.log("DataFilter: No filters applied, returning all data");
      }
    }

    if (debugMode) {
      console.log("DataFilter: Filtering completed", {
        originalCount: logData.length,
        filteredCount: filteredData.length,
        filterMethodUsed,
        titlePrefix,
      });
    }

    return { filteredData, filterMethodUsed, titlePrefix };
  }

  /**
   * Filters data by workout name or path.
   * @param logData - Array of workout log data to filter
   * @param params - Filter parameters containing workout or workoutPath
   * @returns Filtered data with information about the filtering method used
   */
  private static filterByWorkout(
    logData: WorkoutLogData[],
    params: EmbeddedChartParams | EmbeddedTableParams
  ): FilterResult {
    let filteredData = logData;
    let filterMethodUsed = "none";
    let titlePrefix = "Dati Allenamento";

    if (params.workout || params.workoutPath) {
      const workoutName = params.workout || params.workoutPath;
      if (workoutName) {
        titlePrefix = workoutName;
        filteredData = logData.filter((log) => {
          const origine = log.origine || log.workout || "";
          return origine.toLowerCase().includes(workoutName.toLowerCase());
        });
        filterMethodUsed = `campo Origine:: "${workoutName}"`;
      }
    }

    return { filteredData, filterMethodUsed, titlePrefix };
  }

  /**
   * Filters data by exercise name using intelligent search strategies.
   * @param logData - Array of workout log data to filter
   * @param params - Filter parameters containing exercise name and matching options
   * @param debugMode - Whether to enable debug logging
   * @returns Filtered data with information about the filtering method used
   */
  private static filterByExercise(
    logData: WorkoutLogData[],
    params: EmbeddedChartParams | EmbeddedTableParams,
    debugMode: boolean
  ): FilterResult {
    let filteredData = logData;
    let filterMethodUsed = "none";
    let titlePrefix = "Dati Allenamento";

    if (params.exercise && params.exercise.trim()) {
      const matchesResult = findExerciseMatches(
        logData,
        params.exercise,
        debugMode
      );

      const { bestStrategy, bestPathKey, bestFileMatchesList } =
        determineExerciseFilterStrategy(
          matchesResult.fileNameMatches,
          matchesResult.allExercisePathsAndScores,
          params.exactMatch || false,
          debugMode,
          params.exercise
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
      titlePrefix = params.exercise;
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
    matchesResult: any,
    bestFileMatchesList: any[]
  ): string {
    if (bestStrategy === "field") {
      const bestPathScore =
        matchesResult.allExercisePathsAndScores.get(bestPathKey) || 0;
      return `campo Esercizio:: "${bestPathKey}" (score: ${bestPathScore})`;
    } else if (bestStrategy === "filename") {
      return `nome file (score: ${bestFileMatchesList[0]?.score || "N/D"})`;
    }
    return "Nessuna corrispondenza trovata";
  }
}
