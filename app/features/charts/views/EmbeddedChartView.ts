import { t } from "@app/i18n";
// Embedded Chart View for workout data visualization
import { WorkoutLogData } from "@app/types/WorkoutLogData";
import { TrendIndicators } from "@app/types/CommonTypes";
import {
  EmbeddedChartParams,
  ChartDataset,
  CHART_DATA_TYPE,
  CHART_TYPE,
} from "@app/features/charts/types";
import { TrendCalculator } from "@app/services/data/TrendCalculator";
import { StatsBox } from "@app/features/dashboard/ui/StatsBox";
import {
  MobileTable,
  ChartFallbackTable,
} from "@app/features/charts/components/ChartTableViews";
import { ChartRenderer } from "@app/features/charts/components/ChartRenderer";
import { TrendHeader } from "@app/features/charts/components/TrendHeader";
import { ChartDataUtils } from "@app/features/charts/business/ChartDataUtils";
import { getElementScopedId } from "@app/utils/IdUtils";
import { ChartTypeResolver } from "@app/features/charts/business/ChartTypeResolver";
import { BaseView } from "@app/features/common/views/BaseView";
import { VIEW_TYPES } from "@app/types/ViewTypes";
import { Feedback } from "@app/components/atoms/Feedback";
import {
  TOUR_TARGETS,
  markTourTarget,
} from "@app/features/tour/tourTargets";

export class EmbeddedChartView extends BaseView {
  /**
   * Cleanup method to be called during plugin unload.
   * Destroys all Chart.js instances and clears internal state to prevent memory leaks.
   */
  public cleanup(): void {
    try {
      ChartRenderer.destroyAllCharts();
    } catch {
      return;
    }
  }

  /**
   * Loads the log and draws the chart: on the first render and on every log
   * change, so a chart drawn on an empty log fills in with the first set.
   * @param sourcePath - The note the block is written in (its "first log" button)
   */
  async render(
    container: HTMLElement,
    params: EmbeddedChartParams,
    sourcePath?: string,
  ): Promise<void> {
    const logData = (await this.plugin.getWorkoutLogData()) || [];
    container.empty();
    await this.createChart(container, logData, params, sourcePath);
  }

  async createChart(
    container: HTMLElement,
    logData: WorkoutLogData[],
    params: EmbeddedChartParams,
    sourcePath?: string,
  ): Promise<void> {
    const loadingDiv = this.showLoadingIndicator(container);
    try {
      const filteredData = this.filteredOrExplain(
        container,
        logData,
        params,
        VIEW_TYPES.CHART,
        { sourcePath },
      );
      if (!filteredData) return;

      // Determine chart data type based on exercise type
      const resolvedType = await ChartTypeResolver.resolve(
        this.plugin,
        params,
      );

      // Validate chart data type is available for the exercise type
      const validationResult = await ChartTypeResolver.validate(
        this.plugin,
        params,
        resolvedType,
      );
      if (!validationResult.isValid) {
        Feedback.renderError(
          container,
          validationResult.errorMessage,
        );
        return;
      }

      // Sort data by ascending date
      const sortedData = [...filteredData].sort(
        (a, b) =>
          new Date(a.date).getTime() - new Date(b.date).getTime(),
      );

      const chartData = ChartDataUtils.processChartData(
        sortedData,
        resolvedType,
        params.dateRange,
        "DD/MM/YYYY",
        params.chartType || CHART_TYPE.EXERCISE,
      );
      if (
        resolvedType === CHART_DATA_TYPE.E1RM &&
        chartData.labels.length === 0
      ) {
        Feedback.renderError(container, t("charts.noEligibleE1rm"));
        return;
      }
      const { labels, datasets } = ChartDataUtils.limitToLatest(
        chartData.labels,
        chartData.datasets,
        params.limit,
      );

      const volumeData = datasets.length > 0 ? datasets[0].data : [];
      const trendIndicators = TrendCalculator.getTrendIndicators(
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
        params: resolvedParams,
      });
    } catch (error) {
      this.handleError(container, error);
    } finally {
      loadingDiv.remove();
    }
  }

  private renderChartContent(
    container: HTMLElement,
    data: {
      labels: string[];
      datasets: ChartDataset[];
      volumeData: number[];
      trendIndicators: TrendIndicators;
      params: EmbeddedChartParams;
    },
  ): void {
    const { labels, datasets, volumeData, trendIndicators, params } =
      data;

    container.empty();
    const contentDiv = container.createDiv();

    if (params.showTrend !== false && volumeData.length > 0) {
      TrendHeader.render(
        contentDiv,
        trendIndicators,
        volumeData,
        params.type,
      );
    }

    // Create mobile table (hidden on desktop, shown on mobile)
    MobileTable.render(
      contentDiv,
      labels,
      datasets,
      params.type || CHART_DATA_TYPE.VOLUME,
      params,
    );

    const chartContainer =
      ChartRenderer.createChartContainer(contentDiv);
    // Stable per-block ID: re-renders replace this block's chart only, and
    // two blocks with the same exercise/type no longer destroy each other
    chartContainer.id = `workout-chart-${getElementScopedId(container)}`;
    markTourTarget(chartContainer, TOUR_TARGETS.chart);

    if (params.showTrendLine && datasets.length > 0) {
      ChartRenderer.addTrendLineToDatasets(datasets);
    }

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
