/**
 * Constants and configuration values for Chart.js visualizations.
 * Centralizes all magic strings, labels, and default values.
 */

/**
 * Chart type identifiers
 */
export const ChartType = {
	VOLUME: "volume",
	WEIGHT: "weight",
	REPS: "reps",
} as const;

export type ChartTypeValue = typeof ChartType[keyof typeof ChartType];

/**
 * Default chart labels and text
 */
export const ChartLabels = {
	TREND_LINE: "Linea di Tendenza",
	X_AXIS: "Data",
	Y_AXIS: {
		VOLUME: "Volume (kg)",
		WEIGHT: "Peso (kg)",
		REPS: "Ripetizioni",
	},
	UNITS: {
		WEIGHT: "kg",
		REPS: "reps",
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
	const capitalizedType = chartType.charAt(0).toUpperCase() + chartType.slice(1);
	return `Trend ${capitalizedType}`;
}

/**
 * Gets the unit label for a chart type
 * @param chartType - Type of chart (volume, weight, reps)
 * @returns Unit label string
 */
export function getUnitForChartType(chartType: string): string {
	if (chartType === ChartType.VOLUME || chartType === ChartType.WEIGHT) {
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
		case ChartType.VOLUME:
			return ChartLabels.Y_AXIS.VOLUME;
		case ChartType.WEIGHT:
			return ChartLabels.Y_AXIS.WEIGHT;
		case ChartType.REPS:
			return ChartLabels.Y_AXIS.REPS;
		default:
			return ChartLabels.Y_AXIS.VOLUME;
	}
}
