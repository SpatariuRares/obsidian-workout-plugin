/**
 * Chart Configuration
 * Theme, constants, styling, and Chart.js configuration builders
 */

export {
  ChartColors,
  type ChartColorPalette,
  type ColorScheme,
} from "@app/features/charts/config/ChartTheme";
export {
  ChartLabels,
  ChartStyling,
  ChartInteraction,
  getDefaultChartTitle,
  getUnitForChartType,
  getYAxisLabel,
} from "@app/features/charts/config/ChartConstants";
export { ChartConfigBuilder, DatasetStyler } from "@app/features/charts/config/ChartConfigBuilder";
