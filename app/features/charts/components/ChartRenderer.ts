import { Chart, ChartConfiguration } from "chart.js/auto";
import { EmbeddedChartParams, ChartDataset, CHART_DATA_TYPE } from "@app/types";
import { calculateTrendLine } from "@app/utils/utils";
import {
  ChartColors,
  ChartLabels,
  getDefaultChartTitle,
  ChartConfigBuilder,
  DatasetStyler,
} from "@app/features/charts/config";
import { ChartContainer } from "@app/features/charts/components/ChartContainer";
/**
 * Handles the rendering of workout data charts using Chart.js.
 * Provides methods for creating chart containers, configuring chart options,
 * and rendering interactive charts with trend lines and styling.
 */
export class ChartRenderer {
  /**
   * Creates a container element for the chart with proper styling.
   * @param contentDiv - The parent HTML element to append the chart container to
   * @returns The created chart container element
   */
  static createChartContainer(contentDiv: HTMLElement): HTMLElement {
    return ChartContainer.create(contentDiv);
  }

  /**
   * Creates a canvas element for the chart rendering.
   * @param chartContainer - The container element to append the canvas to
   * @returns The created canvas element
   */
  static createCanvas(chartContainer: HTMLElement): HTMLCanvasElement {
    return ChartContainer.createCanvas(chartContainer);
  }

  /**
   * Adds a trend line to the datasets
   * @param datasets - Array of chart datasets
   */
  static addTrendLineToDatasets(datasets: ChartDataset[]): void {
    const mainDataset = datasets[0];
    if (mainDataset.data && mainDataset.data.length > 1) {
      const { slope, intercept } = calculateTrendLine(mainDataset.data);
      const trendData = mainDataset.data.map(
        (_: number, index: number) => slope * index + intercept
      );

      datasets.push({
        label: ChartLabels.TREND_LINE,
        data: trendData,
      });
    }
  }

  /**
   * Creates a Chart.js configuration object with styling and options.
   * @param labels - Array of labels for the x-axis (dates)
   * @param datasets - Array of datasets to display in the chart
   * @param chartType - Type of chart data (volume, weight, reps)
   * @param params - Chart parameters including title and display options
   * @returns Chart.js configuration object
   */
  static createChartConfig(
    labels: string[],
    datasets: ChartDataset[],
    chartType: CHART_DATA_TYPE,
    params: EmbeddedChartParams
  ): ChartConfiguration {
    const title = params.title || getDefaultChartTitle(chartType);
    const colors = ChartColors.getChartColors();
    const colorScheme = ChartColors.getColorSchemeForType(chartType);

    // Apply styling to all datasets
    DatasetStyler.styleDatasets(datasets, colorScheme, colors);

    // Build and return the complete chart configuration
    return ChartConfigBuilder.createChartConfig(
      labels,
      datasets,
      title,
      colors,
      chartType
    );
  }

  /**
   * Renders a Chart.js chart in the specified container.
   * @param chartContainer - The container element to render the chart in
   * @param labels - Array of labels for the x-axis (dates)
   * @param datasets - Array of datasets to display in the chart
   * @param params - Chart parameters including title and display options
   * @returns True if chart was successfully rendered, false if Chart.js is not available
   */
  static renderChart(
    chartContainer: HTMLElement,
    labels: string[],
    datasets: ChartDataset[],
    params: EmbeddedChartParams
  ): boolean {
    const canvas = this.createCanvas(chartContainer);
    const chartConfig = this.createChartConfig(
      labels,
      datasets,
      params.type || CHART_DATA_TYPE.VOLUME,
      params
    );

    try {
      new Chart(canvas, chartConfig);
      return true;
    } catch {
      // Chart.js not available, rendering fallback table
      return false;
    }
  }
}

