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
      // For combined filtering, filter by workout first (usually more restrictive)
      const workoutResult = this.filterByWorkout(logData, params);
      if (workoutResult.filteredData.length === 0) {
        return {
          filteredData: [],
          filterMethodUsed: "Nessun dato trovato per allenamento",
          titlePrefix: `${params.exercise} + ${
            params.workout || params.workoutPath
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
   * Optimized workout filtering with early termination
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

        // Use more efficient filtering with early termination
        const workoutNameLower = workoutName.toLowerCase();
        filteredData = logData.filter((log) => {
          const origine = log.origine || log.workout || "";
          return origine.toLowerCase().includes(workoutNameLower);
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
    let titlePrefix = "Dati Allenamento";

    if (params.exercise && params.exercise.trim()) {
      const exerciseName = params.exercise.trim();
      titlePrefix = exerciseName;

      // Use exact match first for better performance
      if (params.exactMatch) {
        const exerciseNameLower = exerciseName.toLowerCase();
        filteredData = logData.filter((log) => {
          const exerciseField = log.exercise || "";
          return exerciseField.toLowerCase() === exerciseNameLower;
        });
        filterMethodUsed = `esatto match su campo esercizio: "${exerciseName}"`;
      } else {
        // Use fuzzy matching with early optimization
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
