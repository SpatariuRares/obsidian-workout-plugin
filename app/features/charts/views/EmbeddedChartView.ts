// Embedded Chart View for workout data visualization
import { WorkoutLogData } from "@app/types/WorkoutLogData";
import { FilterResult, TrendIndicators } from "@app/types/CommonTypes";
import { ParameterDefinition } from "@app/types/ExerciseTypes";
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
import {
  getDefaultChartDataType,
  isValidChartDataType,
  getAvailableChartDataTypes,
} from "@app/features/charts/config/ChartConstants";
import { BaseView } from "@app/features/common/views/BaseView";
import WorkoutChartsPlugin from "main";
import { StatisticsUtils, ValidationUtils, ParameterUtils } from "@app/utils";
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

      // Determine chart data type based on exercise type
      const resolvedType = await this.resolveChartDataType(params);

      // Validate chart data type is available for the exercise type
      const validationResult = await this.validateChartDataType(
        params,
        resolvedType,
      );
      if (!validationResult.isValid) {
        loadingDiv.remove();
        this.renderChartTypeError(container, validationResult.errorMessage);
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

  /**
   * Resolves the chart data type based on exercise definition.
   * If a type is explicitly provided, uses that.
   * Otherwise determines the default type based on the exercise's type definition.
   */
  private async resolveChartDataType(
    params: EmbeddedChartParams,
  ): Promise<CHART_DATA_TYPE> {
    // If type is explicitly provided, use it
    if (params.type) {
      return params.type;
    }

    // Try to get exercise definition to determine default type
    if (params.exercise) {
      const exerciseDefService = this.plugin.getExerciseDefinitionService();
      if (exerciseDefService) {
        const exerciseType = await exerciseDefService.getExerciseType(
          params.exercise,
        );
        const customNumericParams = this.getNumericParamKeys(
          exerciseType.parameters,
        );
        const defaultType = getDefaultChartDataType(
          exerciseType.id,
          customNumericParams,
        );
        return defaultType as CHART_DATA_TYPE;
      }
    }

    // Fallback to volume for backward compatibility
    return CHART_DATA_TYPE.VOLUME;
  }

  /**
   * Validates that the requested chart data type is available for the exercise type.
   * If the exercise has no explicit definition (defaults to strength), allow any type
   * for backward compatibility.
   */
  private async validateChartDataType(
    params: EmbeddedChartParams,
    chartDataType: CHART_DATA_TYPE,
  ): Promise<{ isValid: boolean; errorMessage: string }> {
    // If no exercise filter or chartType is ALL, allow any type
    if (!params.exercise || params.chartType === CHART_TYPE.ALL) {
      return { isValid: true, errorMessage: "" };
    }

    const exerciseDefService = this.plugin.getExerciseDefinitionService();
    if (!exerciseDefService) {
      // No service available, allow any type
      return { isValid: true, errorMessage: "" };
    }

    // Check if exercise has an explicit definition
    const exerciseDefinition = await exerciseDefService.getExerciseDefinition(
      params.exercise,
    );

    // If no explicit definition found, allow any chart type (backward compatible)
    // This allows users to use duration/distance/heartRate charts without
    // needing to define exercise_type in frontmatter
    if (!exerciseDefinition) {
      return { isValid: true, errorMessage: "" };
    }

    const exerciseType = await exerciseDefService.getExerciseType(
      params.exercise,
    );
    const customNumericParams = this.getNumericParamKeys(
      exerciseType.parameters,
    );

    // Check if the requested type is valid for this exercise type
    if (
      !isValidChartDataType(exerciseType.id, chartDataType, customNumericParams)
    ) {
      const availableTypes = getAvailableChartDataTypes(
        exerciseType.id,
        customNumericParams,
      );
      const typeList =
        availableTypes.length > 0
          ? availableTypes.join(", ")
          : "no chart types available";
      return {
        isValid: false,
        errorMessage: `Chart type "${chartDataType}" is not available for ${exerciseType.name} exercises. Available types: ${typeList}`,
      };
    }

    return { isValid: true, errorMessage: "" };
  }

  /**
   * Extracts numeric parameter keys from parameter definitions.
   * Delegates to centralized ParameterUtils.
   */
  private getNumericParamKeys(parameters: ParameterDefinition[]): string[] {
    return ParameterUtils.getNumericParamKeys(parameters);
  }

  /**
   * Renders an error message when the chart data type is not available.
   */
  private renderChartTypeError(container: HTMLElement, message: string): void {
    Feedback.renderError(container, message);
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
