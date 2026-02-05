/**
 * Chart Configuration
 * Colors, constants, styling, and Chart.js configuration builders
 */

export {
  ChartColors,
  type ChartColorPalette,
  type ColorScheme,
} from "@app/features/charts/config/ChartColors";
export {
  ChartLabels,
  ChartStyling,
  ChartInteraction,
  ChartType,
  getDefaultChartTitle,
  getUnitForChartType,
  getYAxisLabel,
  type ChartTypeValue,
} from "@app/features/charts/config/ChartConstants";
export { ChartConfigBuilder } from "@app/features/charts/config/ChartConfigBuilder";
export { DatasetStyler } from "@app/features/charts/config/DatasetStyler";
