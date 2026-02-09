/**
 * Constants and configuration values for Chart.js visualizations.
 * Centralizes all magic strings, labels, and default values.
 */

import { CONSTANTS } from "@app/constants";

/**
 * Default chart labels and text
 */
export const ChartLabels = {
  TREND_LINE: CONSTANTS.WORKOUT.CHARTS.LABELS.TREND_LINE,
  X_AXIS: CONSTANTS.WORKOUT.CHARTS.LABELS.DATE,
  Y_AXIS: {
    VOLUME: CONSTANTS.WORKOUT.CHARTS.TYPES.VOLUME,
    WEIGHT: CONSTANTS.WORKOUT.CHARTS.TYPES.WEIGHT,
    REPS: CONSTANTS.WORKOUT.CHARTS.TYPES.REPS,
  },
  UNITS: {
    WEIGHT: CONSTANTS.WORKOUT.CHARTS.TYPES.WEIGHT,
    REPS: CONSTANTS.WORKOUT.CHARTS.TYPES.REPS,
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
 * Gets the unit label for a chart type
 * @param chartType - Type of chart (volume, weight, reps)
 * @returns Unit label string
 */
export function getUnitForChartType(chartType: string): string {
  if (chartType === CONSTANTS.WORKOUT.CHARTS.TYPES.VOLUME || chartType === CONSTANTS.WORKOUT.CHARTS.TYPES.WEIGHT) {
    return ChartLabels.UNITS.WEIGHT;
  }
  return ChartLabels.UNITS.REPS;
}

/**
 * Gets the Y-axis label for a chart type
 * @param chartType - Type of chart (volume, weight, reps)
 * @returns Y-axis label string
 */
export function getYAxisLabel(chartType: string): string {
  switch (chartType) {
    case CONSTANTS.WORKOUT.CHARTS.TYPES.VOLUME:
      return ChartLabels.Y_AXIS.VOLUME;
    case CONSTANTS.WORKOUT.CHARTS.TYPES.WEIGHT:
      return ChartLabels.Y_AXIS.WEIGHT;
    case CONSTANTS.WORKOUT.CHARTS.TYPES.REPS:
      return ChartLabels.Y_AXIS.REPS;
    default:
      return ChartLabels.Y_AXIS.VOLUME;
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
