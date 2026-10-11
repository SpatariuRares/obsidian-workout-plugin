import type { ExerciseDefinitionPort } from "@app/types/PluginPorts";
import type { ParameterDefinition } from "@app/types/ExerciseTypes";
import { ParameterUtils } from "@app/utils/parameter/ParameterUtils";
import { CONSTANTS } from "@app/constants";
import { fieldKey } from "@app/services/exercise/ExerciseFields";

/**
 * Resolves and formats table column headers based on exercise definitions.
 * Handles abbreviations, units, and dynamic column determination.
 */
export class TableColumnResolver {
  /** Standard column identifier of each known field key */
  private static readonly HEADERS: Record<string, string> = {
    date: CONSTANTS.WORKOUT.TABLE.COLUMNS.DATE.value,
    exercise: CONSTANTS.WORKOUT.TABLE.COLUMNS.EXERCISE.value,
    reps: CONSTANTS.WORKOUT.TABLE.COLUMNS.REPS.value,
    weight: CONSTANTS.WORKOUT.TABLE.COLUMNS.WEIGHT.value,
    volume: CONSTANTS.WORKOUT.TABLE.COLUMNS.VOLUME.value,
    duration: CONSTANTS.WORKOUT.TABLE.COLUMNS.DURATION.value,
    distance: CONSTANTS.WORKOUT.TABLE.COLUMNS.DISTANCE.value,
    heartRate: CONSTANTS.WORKOUT.TABLE.COLUMNS.HEART_RATE.value,
    notes: CONSTANTS.WORKOUT.TABLE.COLUMNS.NOTES.value,
    protocol: CONSTANTS.WORKOUT.TABLE.COLUMNS.PROTOCOL.value,
    actions: CONSTANTS.WORKOUT.TABLE.COLUMNS.ACTIONS.value,
  };

  /**
   * Column header for a field: the standard identifier ("Wgt", "HR"…) with
   * its unit, or the custom field's key as written. Weight shows the
   * settings unit when none is given.
   */
  static columnHeader(name: string, unit?: string): string {
    const key = fieldKey(name);
    const header = this.HEADERS[key];
    if (!header) return name.trim();
    const shownUnit =
      unit ?? (key === "weight" ? ParameterUtils.getWeightUnit() : undefined);
    return shownUnit ? `${header} (${shownUnit})` : header;
  }

  /** Columns from the block's `columns:`, as headers; a unit written there is kept */
  static userColumns(columns: string[]): string[] {
    return columns.map((column) => {
      const written = /\(([^)]+)\)\s*$/.exec(column)?.[1];
      return this.columnHeader(column, written);
    });
  }

  /**
   * Determines the appropriate columns for a specific exercise based on its type definition.
   * Fetches the exercise definition and returns formatted header names with units.
   *
   * @param exerciseName - Name of the exercise
   * @param plugin - Plugin instance for accessing ExerciseDefinitionService
   * @returns Array of column header names formatted with units, or null if definition not found
   */
  static async determineColumnsForExercise(
    exerciseName: string,
    plugin: ExerciseDefinitionPort,
  ): Promise<string[] | null> {
    try {
      const exerciseDefService =
        plugin.getExerciseDefinitionService();
      if (!exerciseDefService) {
        return null;
      }

      const parameters =
        await exerciseDefService.getParametersForExercise(
          exerciseName,
        );

      if (!parameters || parameters.length === 0) {
        return null;
      }

      // Start with Date column
      const columns: string[] = [
        CONSTANTS.WORKOUT.TABLE.COLUMNS.DATE.value,
      ];

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
        columns.push(CONSTANTS.WORKOUT.TABLE.COLUMNS.VOLUME.value);
      }

      // Notes, Protocol, and Actions are added conditionally by addOptionalColumns()
      return columns;
    } catch {
      return null;
    }
  }

  /**
   * Formats a parameter definition into a compact table header with label and unit.
   * Uses dynamic unit from ParameterUtils if not explicitly defined in parameter.
   *
   * @param param - Parameter definition
   * @returns Formatted header string (e.g., "Dur (sec)", "Wgt (kg)" or "Wgt (lb)")
   */
  static formatParameterHeader(param: ParameterDefinition): string {
    if (this.HEADERS[fieldKey(param.key)]) {
      return this.columnHeader(param.key, param.unit);
    }
    return param.unit ? `${param.label} (${param.unit})` : param.label;
  }

  /**
   * Gets the default visible columns based on exercise mode.
   * @param isShowingAllLogs - Whether showing all logs (no exercise filter)
   * @param showDuration - Whether duration column should be shown
   * @param showDistance - Whether distance column should be shown
   * @param showHeartRate - Whether heart rate column should be shown
   * @returns Array of default column names
   */
  static getDefaultColumns(
    isShowingAllLogs: boolean,
    showDuration: boolean,
    showDistance: boolean,
    showHeartRate: boolean,
  ): string[] {
    if (isShowingAllLogs) {
      return [
        CONSTANTS.WORKOUT.TABLE.COLUMNS.DATE.value,
        CONSTANTS.WORKOUT.TABLE.COLUMNS.EXERCISE.value,
        CONSTANTS.WORKOUT.TABLE.COLUMNS.REPS.value,
        CONSTANTS.WORKOUT.TABLE.COLUMNS.WEIGHT.value,
        CONSTANTS.WORKOUT.TABLE.COLUMNS.VOLUME.value,
        ...(showDuration
          ? [CONSTANTS.WORKOUT.TABLE.COLUMNS.DURATION.value]
          : []),
        ...(showDistance
          ? [CONSTANTS.WORKOUT.TABLE.COLUMNS.DISTANCE.value]
          : []),
        ...(showHeartRate
          ? [CONSTANTS.WORKOUT.TABLE.COLUMNS.HEART_RATE.value]
          : []),
      ];
    }
    return [
      CONSTANTS.WORKOUT.TABLE.COLUMNS.DATE.value,
      CONSTANTS.WORKOUT.TABLE.COLUMNS.REPS.value,
      CONSTANTS.WORKOUT.TABLE.COLUMNS.WEIGHT.value,
      CONSTANTS.WORKOUT.TABLE.COLUMNS.VOLUME.value,
    ];
  }

  /**
   * Adds optional columns (Notes, Protocol, Actions) to the end of headers.
   * @param baseHeaders - Base column headers
   * @param showNotes - Whether to include notes column
   * @param showProtocol - Whether to include protocol column
   * @returns Headers with optional columns appended
   */
  static addOptionalColumns(
    baseHeaders: string[],
    showNotes: boolean,
    showProtocol: boolean,
  ): string[] {
    const result = [...baseHeaders];
    if (showNotes) {
      result.push(CONSTANTS.WORKOUT.TABLE.COLUMNS.NOTES.value);
    }
    if (showProtocol) {
      result.push(CONSTANTS.WORKOUT.TABLE.COLUMNS.PROTOCOL.value);
    }
    result.push(CONSTANTS.WORKOUT.TABLE.COLUMNS.ACTIONS.value);
    return result;
  }
}
