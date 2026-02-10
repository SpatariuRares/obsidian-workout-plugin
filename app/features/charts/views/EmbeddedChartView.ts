// Embedded Chart View for workout data visualization
import { WorkoutLogData } from "@app/types/WorkoutLogData";
import { FilterResult, TrendIndicators } from "@app/types/CommonTypes";
import {
  EmbeddedChartParams,
  ChartDataset,
  CHART_DATA_TYPE,
  CHART_TYPE,
} from "@app/features/charts/types";
import { TrendCalculator } from "@app/services/data/TrendCalculator";
import { StatsBox } from "@app/features/dashboard/ui/StatsBox";
import { MobileTable } from "@app/features/charts/components";
import {
  ChartRenderer,
  TrendHeader,
  ChartFallbackTable,
  ChartDataUtils,
} from "@app/features/charts";
import { ChartTypeResolver } from "@app/features/charts/business/ChartTypeResolver";
import { BaseView } from "@app/features/common/views/BaseView";
import WorkoutChartsPlugin from "main";
import { StatisticsUtils, ValidationUtils } from "@app/utils";
import { VIEW_TYPES } from "@app/types/ViewTypes";
import { Feedback } from "@app/components/atoms/Feedback";

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
      ChartRenderer.destroyAllCharts();
      this.logDebug("EmbeddedChartView", "Cleanup completed successfully");
    } catch {
      return;
    }
  }

  /**
   * Load chart data from the plugin, applying exercise/workout filters.
   */
  async loadChartData(params: EmbeddedChartParams): Promise<WorkoutLogData[]> {
    if (params.exercise || params.workout) {
      return (
        (await this.plugin.getWorkoutLogData({
          exercise: params.exercise as string,
          workout: params.workout as string,
          exactMatch: params.exactMatch as boolean,
        })) || []
      );
    }
    return (await this.plugin.getWorkoutLogData()) || [];
  }

  /**
   * Refresh a chart by clearing cache, reloading data, and re-rendering.
   * Symmetric with EmbeddedTableView.refreshTable().
   */
  async refreshChart(
    container: HTMLElement,
    params: EmbeddedChartParams,
  ): Promise<void> {
    this.plugin.clearLogDataCache();
    const freshData = await this.loadChartData(params);
    container.empty();
    if (freshData.length > 0) {
      await this.createChart(container, freshData, params);
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

      // Determine chart data type based on exercise type
      const resolvedType = await ChartTypeResolver.resolve(this.plugin, params);

      // Validate chart data type is available for the exercise type
      const validationResult = await ChartTypeResolver.validate(
        this.plugin,
        params,
        resolvedType,
      );
      if (!validationResult.isValid) {
        loadingDiv.remove();
        Feedback.renderError(container, validationResult.errorMessage);
        return;
      }

      loadingDiv.remove();

      // Sort data by ascending date
      const sortedData = [...filterResult.filteredData].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );

      const { labels, datasets } = ChartDataUtils.processChartData(
        sortedData,
        resolvedType,
        params.dateRange || 30,
        "DD/MM/YYYY",
        params.chartType || CHART_TYPE.EXERCISE,
      );

      const volumeData = datasets.length > 0 ? datasets[0].data : [];
      const { slope } = StatisticsUtils.calculateTrendLine(volumeData);
      const trendIndicators = TrendCalculator.getTrendIndicators(
        slope,
        volumeData,
        resolvedType,
      );

      // Update params with resolved type for downstream components
      const resolvedParams = { ...params, type: resolvedType };

      this.renderChartContent(container, {
        labels,
        datasets,
        volumeData,
        trendIndicators,
        filterResult,
        params: resolvedParams,
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
    const validationErrors = ValidationUtils.validateUserParams(params);
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
      TrendHeader.render(contentDiv, trendIndicators, volumeData, params.type);
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
        params.type || CHART_DATA_TYPE.VOLUME,
      );
    }
  }
}
