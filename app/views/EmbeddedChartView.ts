// Embedded Chart View for workout data visualization
import { WorkoutLogData } from "@app/types/WorkoutLogData";
import {
  EmbeddedChartParams,
  ChartDataset,
  FilterResult,
  TrendIndicators,
  ChartType,
} from "@app/types";
import {
  ChartRenderer,
  UIComponents,
  TrendCalculator,
  TrendHeader,
  StatsBox,
  MobileTable,
} from "@app/components";
import { BaseView } from "@app/views/BaseView";
import WorkoutChartsPlugin from "main";
import {
  processChartData,
  calculateTrendLine,
  validateUserParams,
} from "@app/utils";

export class EmbeddedChartView extends BaseView {
  constructor(plugin: WorkoutChartsPlugin) {
    super(plugin);
  }

  createChart(
    container: HTMLElement,
    logData: WorkoutLogData[],
    params: EmbeddedChartParams
  ): void {
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

      const filterResult = this.filterData(
        logData,
        params,
        this.plugin.settings.debugMode || params.debug || false
      );

      if (filterResult.filteredData.length === 0) {
        loadingDiv.remove();
        this.handleNoFilteredData(
          container,
          params,
          filterResult.titlePrefix,
          logData,
          "chart"
        );
        return;
      }

      loadingDiv.remove();
      this.logDebug("EmbeddedChartView", "Processing chart data", {
        dataType: params.type || "volume",
        dateRange: params.dateRange || 30,
      });

      // Sort data by ascending date
      const sortedData = [...filterResult.filteredData].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      const { labels, datasets } = processChartData(
        sortedData,
        params.type || "volume",
        params.dateRange || 30,
        "DD/MM/YYYY",
        params.chartType || ChartType.EXERCISE
      );

      this.logDebug("EmbeddedChartView", "Processed chart data", {
        labels,
        datasets,
      });

      const volumeData = datasets.length > 0 ? datasets[0].data : [];
      const { slope } = calculateTrendLine(volumeData);
      const trendIndicators = TrendCalculator.getTrendIndicators(
        slope,
        volumeData
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
    params: EmbeddedChartParams
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
    }
  ): void {
    const {
      labels,
      datasets,
      volumeData,
      trendIndicators,
      filterResult,
      params,
    } = data;

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
      params.type || "volume",
      params
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
      params
    );

    if (!chartSuccess) {
      UIComponents.renderFallbackTable(
        chartContainer,
        labels,
        volumeData,
        params.title || "Volume Chart"
      );
    }

    if (params.showStats !== false && volumeData.length > 0) {
      StatsBox.render(
        contentDiv,
        labels,
        volumeData,
        params.chartType || "exercise"
      );
    }

    this.renderDebugInfo(
      contentDiv,
      filterResult.filteredData,
      params.type || "volume",
      filterResult.filterMethodUsed,
      this.plugin.settings.debugMode || params.debug || false
    );
  }
}
