import { WorkoutLogData } from "@app/types/WorkoutLogData";
import { isStandardProtocol } from "@app/services/protocols/ProtocolCatalog";
import {
  fieldValue,
  hasFieldValue,
} from "@app/services/exercise/ExerciseFields";

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
      (log) => !isStandardProtocol(log.protocol),
    );
  }

  /**
   * Checks if any log entry has notes.
   * @param logData - Array of workout log data
   * @returns true if at least one entry has non-empty notes
   */
  static hasNotes(logData: WorkoutLogData[]): boolean {
    return logData.some(
      (log) => log.notes && log.notes.trim() !== "",
    );
  }

  /**
   * Checks if any log entry has a specific custom field with a non-zero
   * value, however the field's column is spelled ("heartrate", "heartRate").
   * @param logData - Array of workout log data
   * @param fieldName - Name of the custom field to check
   * @returns true if at least one entry has this field with a non-zero value
   */
  static hasCustomField(
    logData: WorkoutLogData[],
    fieldName: string,
  ): boolean {
    return logData.some((log) => hasFieldValue(fieldValue(log, fieldName)));
  }
}
