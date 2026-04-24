import {
  ExerciseMatchUtils,
  MatchResult,
  ExerciseMatch,
} from "@app/utils/exercise/ExerciseMatchUtils";
import {
  WorkoutLogData,
  WorkoutProtocol,
} from "@app/types/WorkoutLogData";
import { CHART_TYPE } from "@app/types/WorkoutConfigTypes";
import { FilterResult } from "@app/types/CommonTypes";
import { StringUtils } from "@app/utils/StringUtils";
import { DateUtils } from "@app/utils/DateUtils";
import { t } from "@app/i18n";

/**
 * Common filter parameters used by DataFilter.
 * Extends the union of chart/table params with filter-specific fields
 * that may not exist on all param types.
 */
export interface DataFilterParams {
  exercise?: string;
  workout?: string;
  exactMatch?: boolean;
  dateRange?: number;
  chartType?: CHART_TYPE;
  protocol?: string | string[];
}

/**
 * Handles filtering of workout log data based on various criteria.
 * Provides methods for filtering by exercise name, workout name, protocol, and other parameters.
 * Supports both exact and fuzzy matching with intelligent search strategies.
 * Now supports AND logic when multiple filters are provided.
 *
 */
export class DataFilter {
  /**
   * Filters workout log data based on the provided parameters.
   * @param logData - Array of workout log data to filter
   * @param params - Filter parameters (exercise, workout, protocol, etc.)
   * @returns Filtered data with information about the filtering method used
   */
  static filterData(
    logData: WorkoutLogData[],
    params: DataFilterParams,
  ): FilterResult {
    if (!logData || logData.length === 0) {
      return {
        filteredData: [],
        filterMethodUsed: "none",
        titlePrefix: t("general.workoutData"),
      };
    }

    // When chartType is ALL, skip filtering and return all data
    const chartParams = params;
    if (chartParams.chartType === CHART_TYPE.ALL) {
      return {
        filteredData: logData,
        filterMethodUsed: "all data (no filter)",
        titlePrefix: t("general.workoutData"),
      };
    }

    let filteredData = logData;
    let filterMethodUsed = "none";
    let titlePrefix: string = t("general.workoutData");

    const hasExercise = params.exercise && params.exercise.trim();
    const hasWorkout = params.workout;
    const hasProtocol = this.hasProtocolFilter(params);
    const hasDateRange = this.hasDateRangeFilter(params);

    if (hasExercise && hasWorkout) {
      // For combined filtering, filter by workout first (usually more restrictive)
      const workoutResult = this.filterByWorkout(logData, params);
      if (workoutResult.filteredData.length === 0) {
        return {
          filteredData: [],
          filterMethodUsed: "No data found for workout",
          titlePrefix: `${params.exercise} + ${params.workout}`,
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
      const protocolResult = this.filterByProtocol(
        filteredData,
        params,
      );
      filteredData = protocolResult.filteredData;
      if (filterMethodUsed === "none") {
        filterMethodUsed = protocolResult.filterMethodUsed;
      } else {
        filterMethodUsed = `${filterMethodUsed} + ${protocolResult.filterMethodUsed}`;
      }
    }

    // Apply date range filter (AND logic with existing filters)
    if (hasDateRange) {
      const dateRangeResult = this.filterByDateRange(
        filteredData,
        params,
      );
      filteredData = dateRangeResult.filteredData;
      if (filterMethodUsed === "none") {
        filterMethodUsed = dateRangeResult.filterMethodUsed;
      } else {
        filterMethodUsed = `${filterMethodUsed} + ${dateRangeResult.filterMethodUsed}`;
      }
    }

    return { filteredData, filterMethodUsed, titlePrefix };
  }

  /**
   * Filters rows without UI metadata. Use this for API/non-UI flows.
   */
  static filterRows(
    logData: WorkoutLogData[],
    params: DataFilterParams,
  ): WorkoutLogData[] {
    return this.filterData(logData, params).filteredData;
  }

  /**
   * Checks if the params contain a protocol filter
   */
  private static hasProtocolFilter(
    params: DataFilterParams,
  ): boolean {
    const tableParams = params;
    if (!tableParams.protocol) return false;
    if (Array.isArray(tableParams.protocol)) {
      return tableParams.protocol.length > 0;
    }
    return (
      typeof tableParams.protocol === "string" &&
      tableParams.protocol.trim() !== ""
    );
  }

  private static hasDateRangeFilter(
    params: DataFilterParams,
  ): boolean {
    return (
      typeof params.dateRange === "number" &&
      Number.isFinite(params.dateRange) &&
      params.dateRange > 0
    );
  }

  /**
   * Optimized workout filtering with early termination
   */
  private static filterByWorkout(
    logData: WorkoutLogData[],
    params: DataFilterParams,
  ): FilterResult {
    let filteredData = logData;
    let filterMethodUsed = "none";
    let titlePrefix: string = t("general.workoutData");

    if (params.workout) {
      const workoutName = params.workout;
      if (workoutName) {
        titlePrefix = workoutName;

        const workoutNameLower = StringUtils.normalize(workoutName);
        filteredData = logData.filter((log) => {
          const source = StringUtils.normalize(
            log.workout || log.origine || "",
            {
              stripWikiLinks: true,
            },
          );
          return source.includes(workoutNameLower);
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
    params: DataFilterParams,
  ): FilterResult {
    const tableParams = params;
    const protocolParam = tableParams.protocol!;

    // Protocol param is guaranteed to exist here due to hasProtocolFilter check
    // Normalize protocol values to lowercase array
    const protocols: string[] = Array.isArray(protocolParam)
      ? protocolParam.map((p) => StringUtils.normalize(p))
      : [StringUtils.normalize(protocolParam)];

    // Filter data by matching protocol (OR logic within protocols array)
    const filteredData = logData.filter((log) => {
      const logProtocol = (
        log.protocol || WorkoutProtocol.STANDARD
      ).toLowerCase();
      return protocols.includes(logProtocol);
    });

    const protocolDisplay = protocols.join(", ");
    const filterMethodUsed = `protocol: [${protocolDisplay}]`;

    return {
      filteredData,
      filterMethodUsed,
      titlePrefix: t("general.workoutData"),
    };
  }

  private static filterByDateRange(
    logData: WorkoutLogData[],
    params: DataFilterParams,
  ): FilterResult {
    const dateRange = params.dateRange || 0;
    return {
      filteredData: DateUtils.filterByDaysAgo(logData, dateRange),
      filterMethodUsed: `dateRange: last ${dateRange} days`,
      titlePrefix: t("general.workoutData"),
    };
  }

  /**
   * Optimized exercise filtering with improved matching
   */
  private static filterByExercise(
    logData: WorkoutLogData[],
    params: DataFilterParams,
  ): FilterResult {
    let filteredData = logData;
    let filterMethodUsed = "none";
    let titlePrefix: string = t("general.workoutData");

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
        const matchesResult = ExerciseMatchUtils.findExerciseMatches(
          logData,
          exerciseName,
        );

        const { bestStrategy, bestPathKey, bestFileMatchesList } =
          ExerciseMatchUtils.determineExerciseFilterStrategy(
            matchesResult.fileNameMatches,
            matchesResult.allExercisePathsAndScores,
            params.exactMatch || false,
            exerciseName,
          );

        filteredData = ExerciseMatchUtils.filterLogDataByExercise(
          logData,
          bestStrategy,
          bestPathKey,
          bestFileMatchesList,
        );

        filterMethodUsed = this.getFilterMethodDescription(
          bestStrategy,
          bestPathKey,
          matchesResult,
          bestFileMatchesList,
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
    bestFileMatchesList: ExerciseMatch[],
  ): string {
    if (bestStrategy === "field") {
      const bestPathScore =
        matchesResult.allExercisePathsAndScores.get(bestPathKey) || 0;
      return `Exercise field:: "${bestPathKey}" (score: ${bestPathScore})`;
    } else if (bestStrategy === "filename") {
      return `file name (score: ${bestFileMatchesList[0]?.score || t("table.notAvailable")})`;
    }
    return "No match found";
  }

}
