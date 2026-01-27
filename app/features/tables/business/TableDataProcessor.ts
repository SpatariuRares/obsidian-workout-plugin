import { CONSTANTS } from "@app/constants/Constants";
import { WorkoutLogData, WorkoutProtocol } from "@app/types/WorkoutLogData";
import { EmbeddedTableParams, TableData, TableRow } from "@app/types";
import { DateUtils } from "@app/utils/DateUtils";

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
   * @returns Processed table data with headers, rows, and metadata
   */
  static processTableData(
    logData: WorkoutLogData[],
    params: EmbeddedTableParams
  ): TableData {
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
    } else {
      // No columns specified, use default visible columns
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
   * Efficiently sorts and limits data in one operation
   */
  private static sortAndLimitData(
    logData: WorkoutLogData[],
    limit: number
  ): WorkoutLogData[] {
    if (logData.length <= limit) {
      return [...logData].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
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
    headers: string[]
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

      const dataMap: Record<string, string> = {
        Date: formattedDate,
        Exercise: this.getExerciseDisplay(log.exercise),
        Reps: log.reps?.toString() || CONSTANTS.WORKOUT.TABLE.LABELS.NOT_AVAILABLE,
        Weight: log.weight?.toString() || CONSTANTS.WORKOUT.TABLE.LABELS.NOT_AVAILABLE,
        Volume: log.volume?.toString() || CONSTANTS.WORKOUT.TABLE.LABELS.NOT_AVAILABLE,
        Notes: log.notes || "",
        Protocol: log.protocol || WorkoutProtocol.STANDARD,
        Actions: "", // Placeholder for actions
      };

      const displayRow = headers.map((header) => dataMap[header] ?? "");

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

