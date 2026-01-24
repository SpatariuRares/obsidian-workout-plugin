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
   * Map of chart IDs to Chart instances for proper cleanup and lifecycle management.
   * This prevents memory leaks by allowing us to destroy chart instances before creating new ones.
   */
  private static chartInstances: Map<string, Chart> = new Map();

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
   * Generates a unique chart ID based on container element ID or hash of chart parameters.
   * @param chartContainer - The container element for the chart
   * @param params - Chart parameters
   * @returns A unique identifier for the chart
   */
  private static generateChartId(
    chartContainer: HTMLElement,
    params: EmbeddedChartParams
  ): string {
    // Use container element ID if available
    if (chartContainer.id) {
      return chartContainer.id;
    }

    // Generate hash based on chart parameters
    const paramsString = JSON.stringify({
      exercise: params.exercise,
      workout: params.workout,
      type: params.type,
      title: params.title,
    });

    // Simple hash function for generating unique IDs
    let hash = 0;
    for (let i = 0; i < paramsString.length; i++) {
      const char = paramsString.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return `chart-${Math.abs(hash)}`;
  }

  /**
   * Renders a Chart.js chart in the specified container.
   * Before creating a new chart, destroys any existing chart with the same ID to prevent memory leaks.
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

    // Generate unique chart ID for tracking
    const chartId = this.generateChartId(chartContainer, params);

    // Destroy existing chart if present to prevent memory leaks
    const existingChart = this.chartInstances.get(chartId);
    if (existingChart) {
      existingChart.destroy();
      this.chartInstances.delete(chartId);
    }

    try {
      const newChart = new Chart(canvas, chartConfig);
      // Track the new chart instance for lifecycle management
      this.chartInstances.set(chartId, newChart);
      return true;
    } catch {
      // Chart.js not available, rendering fallback table
      return false;
    }
  }

  /**
   * Destroys all tracked chart instances to prevent memory leaks.
   * Should be called during plugin unload or when cleaning up chart views.
   */
  static destroyAllCharts(): void {
    this.chartInstances.forEach((chart) => {
      chart.destroy();
    });
    this.chartInstances.clear();
  }
}

