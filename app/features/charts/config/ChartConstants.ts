/**
 * Constants and configuration values for Chart.js visualizations.
 * Centralizes all magic strings, labels, and default values.
 */

import { CONSTANTS } from "@app/constants";
import { ParameterUtils } from "@app/utils/parameter/ParameterUtils";
import { t } from "@app/i18n";

/**
 * Default chart labels and text
 */
export const ChartLabels = {
  TREND_LINE: t("charts.trendLine"),
  X_AXIS: t("charts.date"),
  Y_AXIS: {
    VOLUME: t("charts.labels.volume"),
    WEIGHT: t("charts.labels.weight"),
    REPS: t("charts.labels.reps"),
  },
  UNITS: {
    WEIGHT: t("charts.labels.weight"),
    REPS: t("charts.labels.reps"),
  },
} as const;

/**
 * Default chart styling values
 */
export const ChartStyling = {
  ASPECT_RATIO: 4 / 3,
  BORDER_WIDTH: 2.5,
  POINT_RADIUS: 4,
  POINT_HOVER_RADIUS: 6,
  TENSION: 0.3,
  TREND_LINE_DASH: [8, 4] as number[],
  TREND_POINT_RADIUS: 0,
  TITLE_FONT_SIZE: 18,
  TITLE_FONT_WEIGHT: 600,
  LEGEND_BOX_WIDTH: 20,
  LEGEND_PADDING: 20,
  LEGEND_FONT_SIZE: 12,
  LEGEND_FONT_WEIGHT: 500,
  AXIS_TITLE_FONT_SIZE: 14,
  AXIS_TITLE_FONT_WEIGHT: 500,
  AXIS_TICK_FONT_SIZE: 12,
  TOOLTIP_CORNER_RADIUS: 8,
  TOOLTIP_PADDING: 12,
  TOOLTIP_BORDER_WIDTH: 1,
  TITLE_PADDING_TOP: 10,
  TITLE_PADDING_BOTTOM: 20,
  FONT_FAMILY: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
} as const;

/**
 * Chart interaction modes
 */
export const ChartInteraction = {
  TOOLTIP_MODE: "index",
  INTERACTION_MODE: "nearest",
  INTERACTION_AXIS: "x",
} as const;

/**
 * Generates a default chart title based on type
 * @param chartType - Type of chart (volume, weight, reps)
 * @returns Formatted chart title
 */
export function getDefaultChartTitle(chartType: string): string {
  const capitalizedType =
    chartType.charAt(0).toUpperCase() + chartType.slice(1);
  return `Trend ${capitalizedType}`;
}

/**
 * Gets the unit label for a chart type.
 * Returns the actual unit (e.g., "kg", "lb") based on user settings.
 * @param chartType - Type of chart (volume, weight, reps, duration, distance, pace, heartRate)
 * @returns Unit string (e.g., "kg", "lb", "", "sec", "km", "min/km", "bpm")
 */
export function getUnitForChartType(chartType: string): string {
  // For volume and weight charts, use the dynamic weight unit from settings
  if (
    chartType === t("charts.labels.volume") ||
    chartType === t("charts.labels.weight")
  ) {
    return ParameterUtils.getWeightUnit();
  }

  // For other chart types, return empty string (reps don't have units)
  // Duration, distance, pace, and heart rate are handled by their respective formatters
  return "";
}

/**
 * Gets the Y-axis label for a chart type with dynamic unit.
 * Returns label with unit (e.g., "Volume (kg)", "Weight (lb)") based on settings.
 * @param chartType - Type of chart (volume, weight, reps, duration, distance, pace, heartRate)
 * @returns Y-axis label string with unit
 */
export function getYAxisLabel(chartType: string): string {
  const weightUnit = ParameterUtils.getWeightUnit();

  switch (chartType) {
    case t("charts.labels.volume"):
      return `${ChartLabels.Y_AXIS.VOLUME} (${weightUnit})`;
    case t("charts.labels.weight"):
      return `${ChartLabels.Y_AXIS.WEIGHT} (${weightUnit})`;
    case t("charts.labels.reps"):
      return ChartLabels.Y_AXIS.REPS;
    default:
      return `${ChartLabels.Y_AXIS.VOLUME} (${weightUnit})`;
  }
}

/**
 * Mapping of exercise type IDs to available chart data types.
 * Determines what data types can be visualized for each exercise type.
 */
const EXERCISE_TYPE_CHART_DATA_TYPES: Record<string, string[]> = {
  strength: ["volume", "weight", "reps"],
  timed: ["duration"],
  distance: ["distance", "duration", "pace"],
  cardio: ["duration", "distance", "heartRate"],
  custom: [], // Custom types use numeric params from exercise definition
} as const;

/**
 * Default chart data type for each exercise type.
 * Used when no explicit type parameter is specified in the chart code block.
 */
const DEFAULT_CHART_DATA_TYPE_BY_EXERCISE: Record<string, string> = {
  strength: "volume",
  timed: "duration",
  distance: "distance",
  cardio: "duration",
  custom: "volume", // Fallback for custom types
} as const;

/**
 * Gets the available chart data types for an exercise type.
 * @param exerciseTypeId - The exercise type ID (strength, timed, distance, cardio, custom)
 * @param customNumericParams - Optional array of custom numeric parameter keys
 * @returns Array of available chart data type strings
 */
export function getAvailableChartDataTypes(
  exerciseTypeId: string,
  customNumericParams?: string[],
): string[] {
  const baseTypes = EXERCISE_TYPE_CHART_DATA_TYPES[exerciseTypeId] ?? [];

  // For custom types, use any numeric parameters defined in the exercise
  if (
    exerciseTypeId === "custom" &&
    customNumericParams &&
    customNumericParams.length > 0
  ) {
    return customNumericParams;
  }

  return baseTypes;
}

/**
 * Gets the default chart data type for an exercise type.
 * @param exerciseTypeId - The exercise type ID
 * @param customNumericParams - Optional array of custom numeric parameter keys (used for 'custom' type)
 * @returns The default chart data type string
 */
export function getDefaultChartDataType(
  exerciseTypeId: string,
  customNumericParams?: string[],
): string {
  // For custom types, use the first numeric parameter if available
  if (
    exerciseTypeId === "custom" &&
    customNumericParams &&
    customNumericParams.length > 0
  ) {
    return customNumericParams[0];
  }

  return DEFAULT_CHART_DATA_TYPE_BY_EXERCISE[exerciseTypeId] ?? "volume";
}

/**
 * Checks if a chart data type is valid for an exercise type.
 * @param exerciseTypeId - The exercise type ID
 * @param chartDataType - The requested chart data type
 * @param customNumericParams - Optional array of custom numeric parameter keys
 * @returns True if the chart data type is valid for the exercise type
 */
export function isValidChartDataType(
  exerciseTypeId: string,
  chartDataType: string,
  customNumericParams?: string[],
): boolean {
  const availableTypes = getAvailableChartDataTypes(
    exerciseTypeId,
    customNumericParams,
  );
  return availableTypes.includes(chartDataType);
}
