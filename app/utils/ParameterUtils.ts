/**
 * Utility class for exercise parameter operations.
 *
 * Centralizes logic for:
 * - Extracting numeric parameters from ParameterDefinition arrays
 * - Validating parameter keys against reserved names
 * - Formatting parameters with units for display
 *
 * This eliminates duplicated logic across EmbeddedChartView, InsertChartModal,
 * and TableDataProcessor.
 */

import { ParameterDefinition } from "@app/types/ExerciseTypes";
import { STANDARD_CSV_COLUMNS } from "@app/types/WorkoutLogData";
import { CHART_DATA_TYPE } from "@app/features/charts/types";

/**
 * Reserved parameter keys that cannot be used for custom parameters.
 * These conflict with standard CSV columns or internal computed values.
 */
export const RESERVED_PARAMETER_KEYS: readonly string[] = [
  // Standard CSV columns
  ...STANDARD_CSV_COLUMNS,
  // Computed/internal values
  "volume",
  "pace",
  // Chart data types (to avoid confusion)
  ...Object.values(CHART_DATA_TYPE),
] as const;

/**
 * Default units for built-in parameter types.
 * Used when ParameterDefinition doesn't specify a unit.
 */
export const DEFAULT_PARAMETER_UNITS: Record<string, string> = {
  weight: "kg",
  reps: "",
  volume: "kg",
  duration: "sec",
  distance: "km",
  pace: "min/km",
  heartRate: "bpm",
  heartrate: "bpm",
} as const;

/**
 * Default colors for chart data types.
 * Used when displaying custom parameters in charts.
 */
export const CHART_DATA_TYPE_COLORS: Record<string, string> = {
  volume: "#4CAF50",
  weight: "#FF9800",
  reps: "#FF9800",
  duration: "#2196F3",
  distance: "#9C27B0",
  pace: "#E91E63",
  heartRate: "#F44336",
  // Default color for custom parameters
  default: "#607D8B",
} as const;

export class ParameterUtils {
  /**
   * Filters parameters to only include numeric types.
   * @param parameters Array of parameter definitions
   * @returns Array of numeric parameter definitions
   */
  static getNumericParams(
    parameters: ParameterDefinition[]
  ): ParameterDefinition[] {
    return parameters.filter((p) => p.type === "number");
  }

  /**
   * Extracts keys from numeric parameters.
   * @param parameters Array of parameter definitions
   * @returns Array of parameter keys (e.g., ["duration", "distance"])
   */
  static getNumericParamKeys(parameters: ParameterDefinition[]): string[] {
    return this.getNumericParams(parameters).map((p) => p.key);
  }

  /**
   * Checks if a parameter key is reserved and cannot be used for custom parameters.
   * @param key The parameter key to check
   * @returns true if the key is reserved
   */
  static isReservedParamKey(key: string): boolean {
    const normalizedKey = key.toLowerCase().trim();
    return RESERVED_PARAMETER_KEYS.some(
      (reserved) => reserved.toLowerCase() === normalizedKey
    );
  }

  /**
   * Gets the list of reserved parameter keys.
   * @returns Array of reserved parameter keys
   */
  static getReservedKeys(): readonly string[] {
    return RESERVED_PARAMETER_KEYS;
  }

  /**
   * Formats a parameter with its unit for display.
   * @param param The parameter definition
   * @returns Formatted string like "Weight (kg)" or "Duration (sec)"
   */
  static formatParamWithUnit(param: ParameterDefinition): string {
    const unit = param.unit || DEFAULT_PARAMETER_UNITS[param.key.toLowerCase()];
    if (unit) {
      return `${param.label} (${unit})`;
    }
    return param.label;
  }

  /**
   * Formats a parameter key with its unit for display.
   * Uses default units if the parameter definition is not available.
   * @param key The parameter key (e.g., "duration", "weight")
   * @param customUnit Optional custom unit to use instead of default
   * @returns Formatted string like "Duration (sec)" or "Custom Param"
   */
  static formatKeyWithUnit(key: string, customUnit?: string): string {
    const unit = customUnit || DEFAULT_PARAMETER_UNITS[key.toLowerCase()];
    const label = this.keyToLabel(key);
    if (unit) {
      return `${label} (${unit})`;
    }
    return label;
  }

  /**
   * Converts a parameter key to a display label.
   * @param key The parameter key (e.g., "heartRate", "my_custom_param")
   * @returns Display label (e.g., "Heart Rate", "My Custom Param")
   */
  static keyToLabel(key: string): string {
    return (
      key
        // Insert space before capital letters
        .replace(/([A-Z])/g, " $1")
        // Replace underscores and hyphens with spaces
        .replace(/[_-]/g, " ")
        // Capitalize first letter of each word
        .replace(/\b\w/g, (char) => char.toUpperCase())
        .trim()
    );
  }

  /**
   * Gets the color for a chart data type.
   * @param dataType The chart data type or custom parameter key
   * @returns Hex color string
   */
  static getColorForDataType(dataType: string): string {
    return (
      CHART_DATA_TYPE_COLORS[dataType.toLowerCase()] ||
      CHART_DATA_TYPE_COLORS.default
    );
  }

  /**
   * Validates a custom parameter definition.
   * @param param The parameter definition to validate
   * @returns Object with isValid and optional error message
   */
  static validateParam(param: ParameterDefinition): {
    isValid: boolean;
    error?: string;
  } {
    // Check for empty key
    if (!param.key || param.key.trim() === "") {
      return { isValid: false, error: "Parameter key cannot be empty" };
    }

    // Check for reserved key
    if (this.isReservedParamKey(param.key)) {
      return {
        isValid: false,
        error: `Parameter key "${param.key}" is reserved. Reserved keys: ${RESERVED_PARAMETER_KEYS.slice(0, 5).join(", ")}...`,
      };
    }

    // Check for valid key format (alphanumeric and underscores only)
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(param.key)) {
      return {
        isValid: false,
        error: `Parameter key "${param.key}" must start with a letter and contain only letters, numbers, and underscores`,
      };
    }

    // Check for empty label
    if (!param.label || param.label.trim() === "") {
      return { isValid: false, error: "Parameter label cannot be empty" };
    }

    return { isValid: true };
  }

  /**
   * Validates an array of custom parameter definitions.
   * @param params Array of parameter definitions to validate
   * @returns Object with isValid and array of errors
   */
  static validateParams(params: ParameterDefinition[]): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    const seenKeys = new Set<string>();

    for (const param of params) {
      const result = this.validateParam(param);
      if (!result.isValid && result.error) {
        errors.push(result.error);
      }

      // Check for duplicate keys
      const normalizedKey = param.key.toLowerCase();
      if (seenKeys.has(normalizedKey)) {
        errors.push(`Duplicate parameter key: "${param.key}"`);
      }
      seenKeys.add(normalizedKey);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Finds a parameter definition by key (case-insensitive).
   * @param parameters Array of parameter definitions
   * @param key The key to search for
   * @returns The matching parameter definition or undefined
   */
  static findParamByKey(
    parameters: ParameterDefinition[],
    key: string
  ): ParameterDefinition | undefined {
    const normalizedKey = key.toLowerCase();
    return parameters.find((p) => p.key.toLowerCase() === normalizedKey);
  }
}
