import { WorkoutLogData, WorkoutProtocol } from "@app/types/WorkoutLogData";

/**
 * Utility functions to check for presence of specific data fields in workout logs.
 * Used to determine which columns should be dynamically shown in tables.
 */
export class TableDataCheckers {
  /**
   * Checks if any log entry has a non-standard protocol.
   * @param logData - Array of workout log data
   * @returns true if at least one entry has a protocol other than "standard" or empty
   */
  static hasNonStandardProtocol(logData: WorkoutLogData[]): boolean {
    return logData.some(
      (log) =>
        log.protocol &&
        log.protocol !== WorkoutProtocol.STANDARD &&
        log.protocol.trim() !== "",
    );
  }

  /**
   * Checks if any log entry has notes.
   * @param logData - Array of workout log data
   * @returns true if at least one entry has non-empty notes
   */
  static hasNotes(logData: WorkoutLogData[]): boolean {
    return logData.some((log) => log.notes && log.notes.trim() !== "");
  }

  /**
   * Checks if any log entry has a specific custom field with a non-zero value.
   * @param logData - Array of workout log data
   * @param fieldName - Name of the custom field to check
   * @returns true if at least one entry has this field with a non-zero value
   */
  static hasCustomField(logData: WorkoutLogData[], fieldName: string): boolean {
    return logData.some((log) => {
      const value = log.customFields?.[fieldName];
      if (value === undefined || value === null || value === "") return false;
      if (typeof value === "number") return value !== 0;
      if (typeof value === "string") {
        const num = parseFloat(value);
        return !isNaN(num) && num !== 0;
      }
      return false;
    });
  }
}
