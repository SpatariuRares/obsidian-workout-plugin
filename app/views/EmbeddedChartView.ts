// Embedded Chart View for workout data visualization
import { WorkoutLogData } from "@app/types/WorkoutLogData";
import {
  EmbeddedChartParams,
  ChartDataset,
  FilterResult,
  TrendIndicators,
} from "@app/types";
import { TrendCalculator } from "@app/services/data/TrendCalculator";
import { StatsBox } from "@app/features/dashboard/ui/StatsBox";
import { MobileTable } from "@app/features/tables";
import {
  ChartRenderer,
  TrendHeader,
  ChartFallbackTable,
} from "@app/features/charts";
import { BaseView } from "@app/views/BaseView";
import WorkoutChartsPlugin from "main";
import {
  processChartData,
  calculateTrendLine,
  validateUserParams,
} from "@app/utils";
import { VIEW_TYPES } from "@app/types/ViewTypes";
import { CHART_DATA_TYPE, CHART_TYPE } from "@app/types/ChartTypes";

export class EmbeddedChartView extends BaseView {
  constructor(plugin: WorkoutChartsPlugin) {
    super(plugin);
  }

  /**
   * Cleanup method to be called during plugin unload.
   * Destroys all Chart.js instances and clears internal state to prevent memory leaks.
   */
  public cleanup(): void {
    try {
      // Destroy all Chart.js instances managed by ChartRenderer
      ChartRenderer.destroyAllCharts();

      this.logDebug("EmbeddedChartView", "Cleanup completed successfully");
    } catch {
      return;
    }
  }

  async createChart(
    container: HTMLElement,
    logData: WorkoutLogData[],
    params: EmbeddedChartParams,
  ): Promise<void> {
    try {
      this.logDebug("EmbeddedChartView", "createChart called", {
        dataLength: logData.length,
        params,
      });

      if (!this.validateChartParams(container, params)) {
        return;
      }

      const loadingDiv = this.showLoadingIndicator(container);

      if (this.handleEmptyData(container, logData)) {
        loadingDiv.remove();
        return;
      }

      const filterResult = this.filterData(logData, params);

      if (filterResult.filteredData.length === 0) {
        loadingDiv.remove();
        this.handleNoFilteredData(
          container,
          params,
          filterResult.titlePrefix,
          VIEW_TYPES.CHART,
        );
        return;
      }

      loadingDiv.remove();

      // Sort data by ascending date
      const sortedData = [...filterResult.filteredData].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );

      const { labels, datasets } = processChartData(
        sortedData,
        params.type || CHART_DATA_TYPE.VOLUME,
        params.dateRange || 30,
        "DD/MM/YYYY",
        params.chartType || CHART_TYPE.EXERCISE,
      );

      const volumeData = datasets.length > 0 ? datasets[0].data : [];
      const { slope } = calculateTrendLine(volumeData);
      const trendIndicators = TrendCalculator.getTrendIndicators(
        slope,
        volumeData,
      );

      this.renderChartContent(container, {
        labels,
        datasets,
        volumeData,
        trendIndicators,
        filterResult,
        params,
      });
    } catch (error) {
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      this.handleError(container, errorObj);
    }
  }

  private validateChartParams(
    container: HTMLElement,
    params: EmbeddedChartParams,
  ): boolean {
    const validationErrors = validateUserParams(params);
    return this.validateAndHandleErrors(container, validationErrors);
  }

  private renderChartContent(
    container: HTMLElement,
    data: {
      labels: string[];
      datasets: ChartDataset[];
      volumeData: number[];
      trendIndicators: TrendIndicators;
      filterResult: FilterResult;
      params: EmbeddedChartParams;
    },
  ): void {
    const { labels, datasets, volumeData, trendIndicators, params } = data;

    container.empty();
    const contentDiv = container.createEl("div");

    if (params.showTrend !== false && volumeData.length > 0) {
      TrendHeader.render(contentDiv, trendIndicators, volumeData);
    }

    // Create mobile table (hidden on desktop, shown on mobile)
    MobileTable.render(
      contentDiv,
      labels,
      datasets,
      params.type || CHART_DATA_TYPE.VOLUME,
      params,
    );

    const chartContainer = ChartRenderer.createChartContainer(contentDiv);

    if (params.showTrendLine && datasets.length > 0) {
      ChartRenderer.addTrendLineToDatasets(datasets);
    }

    this.logDebug("EmbeddedChartView", "Creating Chart.js with config", {
      labels,
      datasets,
    });

    const chartSuccess = ChartRenderer.renderChart(
      chartContainer,
      labels,
      datasets,
      params,
    );

    if (!chartSuccess) {
      ChartFallbackTable.render(chartContainer, labels, volumeData);
    }

    if (params.showStats !== false && volumeData.length > 0) {
      StatsBox.render(
        contentDiv,
        labels,
        volumeData,
        params.chartType || CHART_TYPE.EXERCISE,
      );
    }
  }
}
