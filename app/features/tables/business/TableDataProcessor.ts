import { CONSTANTS } from "@app/constants";
import { WorkoutLogData, WorkoutProtocol } from "@app/types/WorkoutLogData";
import { EmbeddedTableParams, TableData, TableRow } from "@app/types";
import { DateUtils } from "@app/utils/DateUtils";
import type WorkoutChartsPlugin from "main";
import type { ParameterDefinition } from "@app/types/ExerciseTypes";

/**
 * Processes workout log data for table display.
 * Handles data formatting, sorting, limiting, and column configuration
 * for workout log tables.
 */
export class TableDataProcessor {
  /**
   * Processes workout log data into a format suitable for table display.
   * @param logData - Array of workout log data to process
   * @param params - Table parameters including columns, limit, and display options
   * @param plugin - Optional plugin instance for accessing exercise definitions
   * @returns Processed table data with headers, rows, and metadata
   */
  static async processTableData(
    logData: WorkoutLogData[],
    params: EmbeddedTableParams,
    plugin?: WorkoutChartsPlugin,
  ): Promise<TableData> {
    // Use default visible columns if not specified
    const defaultVisibleColumns = [
      CONSTANTS.WORKOUT.TABLE.COLUMNS.DATE,
      CONSTANTS.WORKOUT.TABLE.COLUMNS.REPS,
      CONSTANTS.WORKOUT.TABLE.COLUMNS.WEIGHT,
      CONSTANTS.WORKOUT.TABLE.COLUMNS.VOLUME,
      CONSTANTS.WORKOUT.TABLE.COLUMNS.NOTES,
    ];

    // Check if protocol column should be shown (default: true)
    const showProtocol = params.showProtocol !== false;

    let headers: string[];

    // Priority 1: Explicit columns parameter (highest priority - user override)
    if (params.columns) {
      if (Array.isArray(params.columns)) {
        headers = [...params.columns];
        // Add protocol column before actions if showProtocol is true
        if (showProtocol) {
          headers.push(CONSTANTS.WORKOUT.TABLE.COLUMNS.PROTOCOL);
        }
        headers.push(CONSTANTS.WORKOUT.TABLE.COLUMNS.ACTIONS);
      } else if (typeof params.columns === "string") {
        try {
          const parsedColumns = JSON.parse(params.columns);
          headers = [...parsedColumns];
          if (showProtocol) {
            headers.push(CONSTANTS.WORKOUT.TABLE.COLUMNS.PROTOCOL);
          }
          headers.push(CONSTANTS.WORKOUT.TABLE.COLUMNS.ACTIONS);
        } catch {
          // Invalid columns parameter, using default
          headers = [...defaultVisibleColumns];
          if (showProtocol) {
            headers.push(CONSTANTS.WORKOUT.TABLE.COLUMNS.PROTOCOL);
          }
          headers.push(CONSTANTS.WORKOUT.TABLE.COLUMNS.ACTIONS);
        }
      } else {
        headers = [...defaultVisibleColumns];
        if (showProtocol) {
          headers.push(CONSTANTS.WORKOUT.TABLE.COLUMNS.PROTOCOL);
        }
        headers.push(CONSTANTS.WORKOUT.TABLE.COLUMNS.ACTIONS);
      }
    }
    // Priority 2: Dynamic columns from exercise type (if single exercise filter)
    else if (params.exercise && plugin) {
      const dynamicHeaders = await this.determineColumnsForExercise(
        params.exercise,
        plugin,
      );
      if (dynamicHeaders && dynamicHeaders.length > 0) {
        headers = [...dynamicHeaders];
        if (showProtocol) {
          headers.push(CONSTANTS.WORKOUT.TABLE.COLUMNS.PROTOCOL);
        }
        headers.push(CONSTANTS.WORKOUT.TABLE.COLUMNS.ACTIONS);
      } else {
        // Fallback to default if exercise definition not found
        headers = [...defaultVisibleColumns];
        if (showProtocol) {
          headers.push(CONSTANTS.WORKOUT.TABLE.COLUMNS.PROTOCOL);
        }
        headers.push(CONSTANTS.WORKOUT.TABLE.COLUMNS.ACTIONS);
      }
    }
    // Priority 3: Default columns (backward compatible)
    else {
      headers = [...defaultVisibleColumns];
      if (showProtocol) {
        headers.push(CONSTANTS.WORKOUT.TABLE.COLUMNS.PROTOCOL);
      }
      headers.push(CONSTANTS.WORKOUT.TABLE.COLUMNS.ACTIONS);
    }

    const limit = params.limit || 50;

    const sortedAndLimitedData = this.sortAndLimitData(logData, limit);

    const rows = this.processRowsEfficiently(sortedAndLimitedData, headers);

    return {
      headers,
      rows: rows,
      totalRows: sortedAndLimitedData.length,
      filterResult: {
        filteredData: sortedAndLimitedData,
        filterMethodUsed: "table processing",
        titlePrefix: CONSTANTS.WORKOUT.UI.LABELS.WORKOUT_LOG,
      },
      params,
    };
  }

  /**
   * Determines the appropriate columns for a specific exercise based on its type definition.
   * Fetches the exercise definition and returns formatted header names with units.
   *
   * @param exerciseName - Name of the exercise
   * @param plugin - Plugin instance for accessing ExerciseDefinitionService
   * @returns Array of column header names formatted with units, or null if definition not found
   */
  private static async determineColumnsForExercise(
    exerciseName: string,
    plugin: WorkoutChartsPlugin,
  ): Promise<string[] | null> {
    try {
      const exerciseDefService = plugin.getExerciseDefinitionService();
      if (!exerciseDefService) {
        return null;
      }

      const parameters =
        await exerciseDefService.getParametersForExercise(exerciseName);

      if (!parameters || parameters.length === 0) {
        return null;
      }

      // Start with Date column
      const columns: string[] = [CONSTANTS.WORKOUT.TABLE.COLUMNS.DATE];

      // Track if we have both reps and weight for volume calculation
      let hasReps = false;
      let hasWeight = false;

      // Add columns for each parameter in the exercise type definition
      for (const param of parameters) {
        const header = this.formatParameterHeader(param);
        columns.push(header);

        // Check for reps and weight parameters
        if (param.key.toLowerCase() === "reps") {
          hasReps = true;
        }
        if (param.key.toLowerCase() === "weight") {
          hasWeight = true;
        }
      }

      // Add Volume column for strength exercises (when both reps and weight are present)
      if (hasReps && hasWeight) {
        columns.push(CONSTANTS.WORKOUT.TABLE.COLUMNS.VOLUME);
      }

      // Add Notes column at the end (before Protocol and Actions which are added separately)
      columns.push(CONSTANTS.WORKOUT.TABLE.COLUMNS.NOTES);

      return columns;
    } catch {
      return null;
    }
  }

  /**
   * Formats a parameter definition into a table header with label and unit.
   *
   * @param param - Parameter definition
   * @returns Formatted header string (e.g., "Duration (sec)", "Weight (kg)")
   */
  private static formatParameterHeader(param: ParameterDefinition): string {
    if (param.unit) {
      return `${param.label} (${param.unit})`;
    }
    return param.label;
  }

  /**
   * Efficiently sorts and limits data in one operation
   */
  private static sortAndLimitData(
    logData: WorkoutLogData[],
    limit: number,
  ): WorkoutLogData[] {
    if (logData.length <= limit) {
      return [...logData].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
    }

    const dataWithDates = logData.map((log) => ({
      log,
      timestamp: new Date(log.date).getTime(),
    }));

    dataWithDates.sort((a, b) => b.timestamp - a.timestamp);

    return dataWithDates.slice(0, limit).map((item) => item.log);
  }

  /**
   * Process rows more efficiently with pre-computed values
   */
  private static processRowsEfficiently(
    logData: WorkoutLogData[],
    headers: string[],
  ): TableRow[] {
    const rows: TableRow[] = [];

    const dateCache = new Map<string, string>();
    const dateKeyCache = new Map<string, string>();

    for (const log of logData) {
      let formattedDate = dateCache.get(log.date);
      if (!formattedDate) {
        formattedDate = DateUtils.toTime(log.date);
        dateCache.set(log.date, formattedDate);
      }

      let dateKey = dateKeyCache.get(log.date);
      if (!dateKey) {
        dateKey = DateUtils.toDateKey(log.date);
        dateKeyCache.set(log.date, dateKey);
      }

      // Build base data map with simple keys
      const baseDataMap: Record<string, string> = {
        date: formattedDate,
        exercise: this.getExerciseDisplay(log.exercise),
        reps:
          log.reps?.toString() || CONSTANTS.WORKOUT.TABLE.LABELS.NOT_AVAILABLE,
        weight:
          log.weight?.toString() ||
          CONSTANTS.WORKOUT.TABLE.LABELS.NOT_AVAILABLE,
        volume:
          log.volume?.toString() ||
          CONSTANTS.WORKOUT.TABLE.LABELS.NOT_AVAILABLE,
        notes: log.notes || "",
        protocol: log.protocol || WorkoutProtocol.STANDARD,
        actions: "", // Placeholder for actions
      };

      // Add custom fields to base data map
      if (log.customFields) {
        for (const [key, value] of Object.entries(log.customFields)) {
          baseDataMap[key.toLowerCase()] = value?.toString() || "";
        }
      }

      // Build display row by matching headers to data
      // Headers may be formatted like "Weight (kg)" or simple like "Reps"
      const displayRow = headers.map((header) => {
        // Extract the base key from the header (before any unit in parentheses)
        const headerBase = header.split(" (")[0].toLowerCase();

        // Try to find matching data
        if (baseDataMap[headerBase] !== undefined) {
          return baseDataMap[headerBase];
        }

        // Also check exact header match (case-insensitive) for backward compatibility
        const exactMatch = baseDataMap[header.toLowerCase()];
        if (exactMatch !== undefined) {
          return exactMatch;
        }

        return "";
      });

      const row = {
        displayRow,
        originalDate: log.date,
        dateKey: dateKey,
        originalLog: log, // Store the original log data for actions
      };

      rows.push(row);
    }

    return rows;
  }

  /**
   * Formats exercise name for display by removing file extensions.
   * @param exercise - Exercise name to format
   * @returns Formatted exercise name without file extensions
   */
  private static getExerciseDisplay(exercise: string): string {
    if (!exercise) return CONSTANTS.WORKOUT.TABLE.LABELS.NOT_AVAILABLE;

    // Remove file extension if present
    return exercise.replace(/\.md$/i, "");
  }
}
