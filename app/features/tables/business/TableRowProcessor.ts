import { CONSTANTS } from "@app/constants";
import { WorkoutLogData, WorkoutProtocol } from "@app/types/WorkoutLogData";
import { TableRow } from "@app/features/tables/types";
import { DateUtils } from "@app/utils/DateUtils";
import { TableColumnResolver } from "@app/features/tables/business/TableColumnResolver";
import { t } from "@app/i18n";

/**
 * Processes workout log data into table rows.
 * Handles date formatting, data mapping, and row construction.
 */
export class TableRowProcessor {
  /**
   * Efficiently sorts and limits data in one operation.
   * @param logData - Array of workout log data
   * @param limit - Maximum number of rows to return
   * @returns Sorted and limited array of workout log data
   */
  static sortAndLimitData(
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
   * Process rows efficiently with pre-computed values.
   * @param logData - Array of workout log data
   * @param headers - Column headers to map data to
   * @returns Array of processed table rows
   */
  static processRows(logData: WorkoutLogData[], headers: string[]): TableRow[] {
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
          log.reps?.toString() || t("table.notAvailable"),
        weight:
          log.weight?.toString() ||
          t("table.notAvailable"),
        volume:
          log.volume?.toString() ||
          t("table.notAvailable"),
        // Add custom fields for cardio/timed exercises
        duration: this.formatCustomFieldValue(log.customFields?.duration),
        distance: this.formatCustomFieldValue(log.customFields?.distance),
        heartrate: this.formatCustomFieldValue(log.customFields?.heartRate),
        notes: log.notes || "",
        protocol: log.protocol || WorkoutProtocol.STANDARD,
        actions: "", // Placeholder for actions
      };

      // Add any additional custom fields to base data map
      if (log.customFields) {
        for (const [key, value] of Object.entries(log.customFields)) {
          const lowerKey = key.toLowerCase();
          // Don't overwrite already mapped fields
          if (!(lowerKey in baseDataMap)) {
            baseDataMap[lowerKey] = value?.toString() || "";
          }
        }
      }

      // Build display row by matching headers to data
      // Headers may be formatted like "Wgt (kg)" or simple like "Rep"
      const displayRow = headers.map((header) => {
        // Extract the base key from the header (before any unit in parentheses)
        const headerBase = header.split(" (")[0].toLowerCase();

        // Try direct match first
        if (baseDataMap[headerBase] !== undefined) {
          return baseDataMap[headerBase];
        }

        // Try reverse mapping for abbreviated headers (e.g., "wgt" -> "weight")
        const mappedKey = TableColumnResolver.HEADER_TO_DATA_KEY[headerBase];
        if (mappedKey && baseDataMap[mappedKey] !== undefined) {
          return baseDataMap[mappedKey];
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
  static getExerciseDisplay(exercise: string): string {
    if (!exercise) return t("table.notAvailable");

    // Remove file extension if present
    return exercise.replace(/\.md$/i, "");
  }

  /**
   * Formats a custom field value for display.
   * Returns N/A for empty/zero values, otherwise returns the string value.
   * @param value - Custom field value
   * @returns Formatted string value
   */
  static formatCustomFieldValue(
    value: string | number | boolean | undefined,
  ): string {
    if (value === undefined || value === null || value === "") {
      return t("table.notAvailable");
    }
    if (typeof value === "number") {
      return value === 0
        ? t("table.notAvailable")
        : value.toString();
    }
    if (typeof value === "string") {
      const num = parseFloat(value);
      if (!isNaN(num) && num === 0) {
        return t("table.notAvailable");
      }
      return value;
    }
    return value.toString();
  }
}
