/**
 * Constants and configuration values for Chart.js visualizations.
 * Centralizes all magic strings, labels, and default values.
 */

import { getTypeNames, getUnitsMap } from "@app/constants/ui.constants";
import { CHART_DATA_TYPE } from "@app/types/WorkoutConfigTypes";
import { t } from "@app/i18n";

/**
 * Default chart labels and text.
 * Returns a fresh object each call so that t() is evaluated at runtime
 * (after the i18n service is initialized), not at module-load time.
 */
export function getChartLabels() {
  return {
    TREND_LINE: t("charts.trendLine"),
    X_AXIS: t("charts.date"),
  };
}

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
  FONT_FAMILY:
    "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
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
  return t("charts.defaultTitle", { type: capitalizedType });
}

/**
 * Gets the unit for a chart type (e.g., "kg", "lb", "sec", "km", "min/km", "bpm").
 * Volume and weight follow the weight unit setting; reps and custom fields have none.
 * @param chartType - Chart data type id (volume, weight, reps, duration, distance, pace, heartRate) or a custom field key
 * @returns Unit string, empty when the type has no unit
 */
export function getUnitForChartType(chartType: string): string {
  return getUnitsMap()[chartType as CHART_DATA_TYPE] ?? "";
}

/**
 * Gets the Y-axis label for a chart type, with its unit when it has one
 * (e.g., "Weight (kg)", "Reps", "Heart rate (bpm)"). A custom field is labelled by its key.
 * @param chartType - Chart data type id or a custom field key
 * @returns Y-axis label string
 */
export function getYAxisLabel(chartType: string): string {
  const name = getTypeNames()[chartType as CHART_DATA_TYPE] ?? chartType;
  const unit = getUnitForChartType(chartType);
  return unit ? `${name} (${unit})` : name;
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
  const baseTypes =
    EXERCISE_TYPE_CHART_DATA_TYPES[exerciseTypeId] ?? [];

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

  return (
    DEFAULT_CHART_DATA_TYPE_BY_EXERCISE[exerciseTypeId] ?? "volume"
  );
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
