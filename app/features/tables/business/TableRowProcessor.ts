import {
  WorkoutLogData,
} from "@app/types/WorkoutLogData";
import {
  TableRow,
  TableSortField,
  TableSortOrder,
} from "@app/features/tables/types";
import { DateUtils } from "@app/utils/DateUtils";
import { trainingDay } from "@app/services/history/TrainingHistory";
import { fieldKey } from "@app/services/exercise/ExerciseFields";
import { t } from "@app/i18n";
import { ParameterUtils } from "@app/utils/parameter/ParameterUtils";
import { protocolId } from "@app/services/protocols/ProtocolCatalog";

/** A custom field's key compared ignoring case, spaces, "_" and "-" */
function looseKey(key: string): string {
  return key.toLowerCase().replace(/[\s_-]+/g, "");
}

/** Fields every exercise type may record: shown as N/A when a set lacks them */
const KNOWN_CUSTOM_FIELDS = new Set(["duration", "distance", "heartRate"]);

/**
 * Processes workout log data into table rows.
 * Handles date formatting, data mapping, and row construction.
 */
export class TableRowProcessor {
  /**
   * Sorts data by the given field and order, then keeps the first `limit` rows.
   * Ties fall back to the most recent date first.
   * @param logData - Array of workout log data
   * @param limit - Maximum number of rows to return
   * @param sortBy - Field to sort by (default "date")
   * @param sortOrder - "asc" or "desc" (default "desc")
   * @returns Sorted and limited array of workout log data
   */
  static sortAndLimitData(
    logData: WorkoutLogData[],
    limit: number,
    sortBy: TableSortField = "date",
    sortOrder: TableSortOrder = "desc",
  ): WorkoutLogData[] {
    const direction = sortOrder === "asc" ? 1 : -1;
    const rows = logData.map((log) => ({
      log,
      timestamp: new Date(log.date).getTime(),
    }));

    rows.sort((a, b) => {
      const primary =
        sortBy === "date"
          ? a.timestamp - b.timestamp
          : sortBy === "exercise"
            ? a.log.exercise.localeCompare(b.log.exercise)
            : (a.log[sortBy] ?? 0) - (b.log[sortBy] ?? 0);
      return primary * direction || b.timestamp - a.timestamp;
    });

    return rows.slice(0, limit).map((row) => row.log);
  }

  /**
   * Weight as entered. Rows logged in the other unit keep their unit
   * ("220 lb" when settings are in kg) so the plates are readable.
   */
  private static getWeightDisplay(log: WorkoutLogData): string {
    if (this.isConverted(log) && log.enteredWeight !== undefined) {
      return `${log.enteredWeight} ${log.enteredUnit}`;
    }
    return log.weight?.toString() || t("table.notAvailable");
  }

  /** Converted volume has meaningless decimals (1388.94); show whole units */
  private static getVolumeDisplay(log: WorkoutLogData): string {
    if (log.volume === undefined) return t("table.notAvailable");
    if (this.isConverted(log)) return Math.round(log.volume).toString();
    return log.volume.toString() || t("table.notAvailable");
  }

  private static isConverted(log: WorkoutLogData): boolean {
    return (
      !!log.enteredUnit &&
      log.enteredUnit !== ParameterUtils.getWeightUnit()
    );
  }

  /**
   * Process rows efficiently with pre-computed values.
   * @param logData - Array of workout log data
   * @param headers - Column headers to map data to
   * @returns Array of processed table rows
   */
  static processRows(
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
        dateKey = trainingDay(log.date);
        dateKeyCache.set(log.date, dateKey);
      }

      // Values by field key; custom fields by their loose key, so a "heartrate"
      // column from an older CSV fills the heart rate column and a "Max load"
      // header finds the "max_load" field
      const values: Record<string, string> = {
        date: formattedDate,
        exercise: this.getExerciseDisplay(log.exercise),
        reps: log.reps?.toString() || t("table.notAvailable"),
        weight: this.getWeightDisplay(log),
        volume: this.getVolumeDisplay(log),
        notes: log.notes || "",
        protocol: protocolId(log.protocol),
        actions: "", // Placeholder for actions
      };
      const custom = new Map<string, string | number | boolean>();
      for (const [key, value] of Object.entries(log.customFields ?? {})) {
        custom.set(looseKey(fieldKey(key)), value);
      }

      const displayRow = headers.map((header) => {
        const key = fieldKey(header);
        if (key in values) return values[key];
        const value = custom.get(looseKey(key));
        return KNOWN_CUSTOM_FIELDS.has(key)
          ? this.formatCustomFieldValue(value)
          : (value?.toString() ?? "");
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
      return value === 0 ? t("table.notAvailable") : value.toString();
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
