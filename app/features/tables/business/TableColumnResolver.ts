import { CONSTANTS } from "@app/constants";
import type WorkoutChartsPlugin from "main";
import type { ParameterDefinition } from "@app/types/ExerciseTypes";
import { ParameterUtils } from "@app/utils/parameter/ParameterUtils";

/**
 * Resolves and formats table column headers based on exercise definitions.
 * Handles abbreviations, units, and dynamic column determination.
 */
export class TableColumnResolver {
  /** Map of labels to their abbreviated forms for compact display */
  private static readonly LABEL_ABBREVIATIONS: Record<string, string> = {
    Weight: "Wgt",
    Reps: "Rep",
    Duration: "Dur",
    Distance: "Dist",
    Volume: "Vol",
    "Heart Rate": "HR",
    Repetitions: "Rep",
  };

  /** Reverse map: abbreviated header to data key */
  static readonly HEADER_TO_DATA_KEY: Record<string, string> = {
    wgt: "weight",
    rep: "reps",
    dur: "duration",
    dist: "distance",
    vol: "volume",
    hr: "heartrate",
    prot: "protocol",
    act: "actions",
  };

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
    const abbreviatedLabel =
      this.LABEL_ABBREVIATIONS[param.label] || param.label;

    // Use param.unit if explicitly defined, otherwise get from ParameterUtils
    let unit = param.unit;
    if (!unit && param.key.toLowerCase() === "weight") {
      unit = ParameterUtils.getWeightUnit();
    }

    if (unit) {
      return `${abbreviatedLabel} (${unit})`;
    }
    return abbreviatedLabel;
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
        CONSTANTS.WORKOUT.TABLE.COLUMNS.DATE,
        CONSTANTS.WORKOUT.TABLE.COLUMNS.EXERCISE,
        CONSTANTS.WORKOUT.TABLE.COLUMNS.REPS,
        CONSTANTS.WORKOUT.TABLE.COLUMNS.WEIGHT,
        CONSTANTS.WORKOUT.TABLE.COLUMNS.VOLUME,
        ...(showDuration ? [CONSTANTS.WORKOUT.TABLE.COLUMNS.DURATION] : []),
        ...(showDistance ? [CONSTANTS.WORKOUT.TABLE.COLUMNS.DISTANCE] : []),
        ...(showHeartRate ? [CONSTANTS.WORKOUT.TABLE.COLUMNS.HEART_RATE] : []),
      ];
    }
    return [
      CONSTANTS.WORKOUT.TABLE.COLUMNS.DATE,
      CONSTANTS.WORKOUT.TABLE.COLUMNS.REPS,
      CONSTANTS.WORKOUT.TABLE.COLUMNS.WEIGHT,
      CONSTANTS.WORKOUT.TABLE.COLUMNS.VOLUME,
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
      result.push(CONSTANTS.WORKOUT.TABLE.COLUMNS.NOTES);
    }
    if (showProtocol) {
      result.push(CONSTANTS.WORKOUT.TABLE.COLUMNS.PROTOCOL);
    }
    result.push(CONSTANTS.WORKOUT.TABLE.COLUMNS.ACTIONS);
    return result;
  }
}
