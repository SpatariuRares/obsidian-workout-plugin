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

export class DataFilter {
  static filterData(
    logData: WorkoutLogData[],
    params: EmbeddedChartParams | EmbeddedTableParams,
    debugMode: boolean
  ): FilterResult {
    const chartType =
      "chartType" in params ? params.chartType || "exercise" : "exercise";
    let filteredData = logData;
    let filterMethodUsed = "none";
    let titlePrefix = "Dati Allenamento";

    if (chartType === "workout") {
      const result = this.filterByWorkout(logData, params);
      filteredData = result.filteredData;
      filterMethodUsed = result.filterMethodUsed;
      titlePrefix = result.titlePrefix;
    } else {
      const result = this.filterByExercise(logData, params, debugMode);
      filteredData = result.filteredData;
      filterMethodUsed = result.filterMethodUsed;
      titlePrefix = result.titlePrefix;
    }

    return { filteredData, filterMethodUsed, titlePrefix };
  }

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
