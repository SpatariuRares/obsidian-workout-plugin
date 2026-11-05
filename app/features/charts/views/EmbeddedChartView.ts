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
import { StatsBox } from "@app/features/charts/ui/StatsBox";
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
import { BlockCard } from "@app/components/molecules/BlockCard";
import { ExerciseActionSelect } from "@app/features/tables/ui/ExerciseActionSelect";
import type { BlockMenuAction } from "@app/features/common/ui/BlockMenu";
import { getDefaultChartTitle } from "@app/features/charts/config/ChartConstants";
import { getTypeNames } from "@app/constants";

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
   * @param editAction - The block's edit action (CodeBlockProcessorService), in the card's ⋮ menu
   */
  async render(
    container: HTMLElement,
    params: EmbeddedChartParams,
    sourcePath?: string,
    editAction?: BlockMenuAction,
  ): Promise<void> {
    const logData = (await this.plugin.getWorkoutLogData()) || [];
    container.empty();
    await this.createChart(container, logData, params, sourcePath, editAction);
  }

  async createChart(
    container: HTMLElement,
    logData: WorkoutLogData[],
    params: EmbeddedChartParams,
    sourcePath?: string,
    editAction?: BlockMenuAction,
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
        editAction,
      });
    } catch (error) {
      this.handleError(container, error);
    } finally {
      loadingDiv.remove();
    }
  }

  /**
   * The chart's card (DESIGN.md "Chart card"): title and ⋮ menu (go to the
   * exercise, edit the block) on top, then the trend row, the chart (a table
   * on phones), the stats row.
   */
  private renderChartContent(
    container: HTMLElement,
    data: {
      labels: string[];
      datasets: ChartDataset[];
      volumeData: number[];
      trendIndicators: TrendIndicators;
      params: EmbeddedChartParams;
      editAction?: BlockMenuAction;
    },
  ): void {
    const { labels, datasets, volumeData, trendIndicators, params, editAction } =
      data;
    const dataType = params.type || CHART_DATA_TYPE.VOLUME;

    container.empty();
    const subject = params.title || params.exercise || params.workout;
    const { el: card, header } = BlockCard.create(container, {
      title: subject || getDefaultChartTitle(dataType),
      // The default title already names the type
      meta: subject ? (getTypeNames()[dataType] ?? dataType) : undefined,
      className: "workout-chart",
    });
    ExerciseActionSelect.render(header, {
      exerciseName: params.exercise ?? "",
      plugin: this.plugin,
      edit: editAction,
    });

    if (params.showTrend !== false && volumeData.length > 0) {
      TrendHeader.render(card, trendIndicators, volumeData, params.type);
    }

    // Create mobile table (hidden on desktop, shown on mobile)
    MobileTable.render(card, labels, datasets, dataType);

    const chartContainer = ChartRenderer.createChartContainer(card);
    // Stable per-block ID: re-renders replace this block's chart only, and
    // two blocks with the same exercise/type no longer destroy each other
    chartContainer.id = `workout-chart-${getElementScopedId(container)}`;
    markTourTarget(chartContainer, TOUR_TARGETS.chart);

    if (params.showTrendLine && datasets.length > 0) {
      ChartRenderer.addTrendLineToDatasets(datasets);
    }

    // The card's title names the chart, so the canvas draws none
    const chartSuccess = ChartRenderer.renderChart(
      chartContainer,
      labels,
      datasets,
      params,
      { showTitle: false },
    );

    if (!chartSuccess) {
      ChartFallbackTable.render(chartContainer, labels, volumeData);
    }

    if (params.showStats !== false && volumeData.length > 0) {
      StatsBox.render(card, labels, volumeData, dataType);
    }
  }
}
