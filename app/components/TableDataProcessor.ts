import { WorkoutLogData } from "../types/WorkoutLogData";
import { EmbeddedTableParams, TableData, TableRow } from "./types";

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
    const defaultColumns = [
      "Data",
      "Esercizio",
      "Ripetizioni",
      "Peso (kg)",
      "Volume",
      "Link",
    ];

    let headers = defaultColumns;
    if (params.columns) {
      if (Array.isArray(params.columns)) {
        headers = params.columns;
      } else if (typeof params.columns === "string") {
        try {
          headers = JSON.parse(params.columns);
        } catch {
          console.warn(
            "Invalid columns parameter, using default:",
            params.columns
          );
        }
      }
    }

    const limit = params.limit || 50;

    const sortedAndLimitedData = this.sortAndLimitData(logData, limit);

    const rows = this.processRowsEfficiently(sortedAndLimitedData);

    return {
      headers,
      rows: rows as TableRow[],
      totalRows: sortedAndLimitedData.length,
      filterResult: {
        filteredData: sortedAndLimitedData,
        filterMethodUsed: "table processing",
        titlePrefix: "Workout Log",
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
  private static processRowsEfficiently(logData: WorkoutLogData[]): TableRow[] {
    const rows: TableRow[] = [];

    const dateCache = new Map<string, string>();
    const dateKeyCache = new Map<string, string>();

    for (const log of logData) {
      let formattedDate = dateCache.get(log.date);
      if (!formattedDate) {
        formattedDate = this.formatDate(log.date);
        dateCache.set(log.date, formattedDate);
      }

      let dateKey = dateKeyCache.get(log.date);
      if (!dateKey) {
        dateKey = this.getDateKey(log.date);
        dateKeyCache.set(log.date, dateKey);
      }

      const exerciseDisplay = this.getExerciseDisplay(log.exercise);
      const reps = log.reps?.toString() || "N/D";
      const weight = log.weight?.toString() || "N/D";
      const volume = log.volume?.toString() || "N/D";

      let link = "Link non disp.";
      if (log.file?.path && log.file?.basename) {
        link = `[[${log.file.path}|${log.file.basename}]]`;
      }

      rows.push({
        displayRow: [
          formattedDate,
          exerciseDisplay,
          reps,
          weight,
          volume,
          link,
        ],
        originalDate: log.date,
        dateKey: dateKey,
      });
    }

    return rows;
  }

  /**
   * Formats a date string for display in the table.
   * @param dateString - ISO date string to format
   * @returns Formatted date string in HH:MM - DD/MM format
   */
  private static formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const day = date.getDate().toString().padStart(2, "0");

      return `${hours}:${minutes} - ${month}/${day}`;
    } catch (error) {
      return "Data non valida";
    }
  }

  /**
   * Formats exercise name for display by removing file extensions.
   * @param exercise - Exercise name to format
   * @returns Formatted exercise name without file extensions
   */
  private static getExerciseDisplay(exercise: string): string {
    if (!exercise) return "N/D";

    // Remove file extension if present
    return exercise.replace(/\.md$/i, "");
  }

  /**
   * Creates a date key for grouping (YYYY-MM-DD format).
   * @param dateString - ISO date string
   * @returns Date key string in YYYY-MM-DD format
   */
  private static getDateKey(dateString: string): string {
    try {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const day = date.getDate().toString().padStart(2, "0");
      return `${year}-${month}-${day}`;
    } catch (error) {
      return "invalid-date";
    }
  }

  /**
   * Validates table parameters and returns any validation errors.
   * @param params - Table parameters to validate
   * @returns Array of validation error messages
   */
  static validateTableParams(params: EmbeddedTableParams): string[] {
    const errors: string[] = [];

    if (params.limit !== undefined) {
      const limit = parseInt(params.limit.toString());
      if (isNaN(limit) || limit < 1 || limit > 1000) {
        errors.push(
          `limit deve essere un numero tra 1 e 1000, ricevuto: "${params.limit}"`
        );
      }
    }

    if (params.columns) {
      if (
        !Array.isArray(params.columns) &&
        typeof params.columns !== "string"
      ) {
        errors.push(
          "columns deve essere un array di stringhe o una stringa JSON"
        );
      } else if (
        Array.isArray(params.columns) &&
        !params.columns.every((c) => typeof c === "string")
      ) {
        errors.push("columns deve essere un array di stringhe");
      }
    }

    if (params.buttonText && typeof params.buttonText !== "string") {
      errors.push("buttonText deve essere una stringa");
    }

    return errors;
  }

  /**
   * Returns default table parameters for new table instances.
   * @returns Default table parameters with sensible defaults
   */
  static getDefaultTableParams(): EmbeddedTableParams {
    return {
      limit: 50,
      showAddButton: true,
      buttonText: "➕ Aggiungi Log",
      searchByName: false,
      exactMatch: false,
      debug: false,
      columns: [
        "Data",
        "Esercizio",
        "Ripetizioni",
        "Peso (kg)",
        "Volume",
        "Link",
      ],
    };
  }
}
