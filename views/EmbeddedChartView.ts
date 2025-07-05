// Embedded Chart View for workout data visualization
import {
  processChartData,
  calculateTrendLine,
  validateUserParams,
} from "../utils/utils";
import { WorkoutLogData } from "../types/WorkoutLogData";
import type WorkoutChartsPlugin from "../main";
import {
  EmbeddedChartParams,
  TrendHeader,
  StatsBox,
  ChartRenderer,
  UIComponents,
  DataFilter,
  TrendCalculator,
} from "../components";

export class EmbeddedChartView {
  constructor(private plugin: WorkoutChartsPlugin) {}

  async createChart(
    container: HTMLElement,
    logData: WorkoutLogData[],
    params: EmbeddedChartParams
  ): Promise<void> {
    try {
      this.logDebug("createChart called", {
        dataLength: logData.length,
        params,
      });

      if (!this.validateAndHandleErrors(container, params, logData)) {
        return;
      }

      const loadingDiv = UIComponents.renderLoadingIndicator(container);

      if (logData.length === 0) {
        loadingDiv.remove();
        UIComponents.renderNoDataMessage(container);
        return;
      }

      const filterResult = DataFilter.filterData(
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
          logData
        );
        return;
      }

      loadingDiv.remove();
      this.logDebug("Processing chart data", {
        dataType: params.type || "volume",
        dateRange: params.dateRange || 30,
      });

      // Ordina i dati per data crescente
      const sortedData = [...filterResult.filteredData].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      const { labels, datasets } = processChartData(
        sortedData,
        params.type || "volume",
        params.dateRange || 30
      );

      this.logDebug("Processed chart data", { labels, datasets });

      const volumeData =
        datasets.length > 0 ? (datasets[0].data as number[]) : [];
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
      console.error("Error creating embedded chart:", error);
      UIComponents.renderErrorMessage(container, error.message);
    }
  }

  private validateAndHandleErrors(
    container: HTMLElement,
    params: EmbeddedChartParams,
    logData: WorkoutLogData[]
  ): boolean {
    const validationErrors = validateUserParams(params);
    if (validationErrors.length > 0) {
      UIComponents.renderErrorMessage(
        container,
        `Parametri non validi:\n${validationErrors.join("\n")}`
      );
      return false;
    }
    return true;
  }

  private handleNoFilteredData(
    container: HTMLElement,
    params: EmbeddedChartParams,
    titlePrefix: string,
    logData: WorkoutLogData[]
  ): void {
    const chartType = params.chartType || "exercise";
    if (chartType === "workout") {
      UIComponents.renderInfoMessage(
        container,
        `Nessun dato trovato per l'allenamento <strong>${titlePrefix}</strong>.`,
        "warning"
      );
    } else {
      UIComponents.renderNoMatchMessage(
        container,
        params.exercise || "",
        logData
      );
      if (params.exercise) {
        UIComponents.createCreateLogButtonForMissingExercise(
          container,
          params.exercise,
          this.plugin
        );
      }
    }
  }

  private renderChartContent(
    container: HTMLElement,
    data: {
      labels: string[];
      datasets: any[];
      volumeData: number[];
      trendIndicators: any;
      filterResult: any;
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

    const chartContainer = ChartRenderer.createChartContainer(contentDiv);

    if (params.showTrendLine && datasets.length > 0) {
      ChartRenderer.addTrendLineToDatasets(datasets, trendIndicators);
    }

    this.logDebug("Creating Chart.js with config", { labels, datasets });

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

    if (this.plugin.settings.debugMode || params.debug) {
      UIComponents.renderDebugInfo(
        contentDiv,
        filterResult.filteredData,
        params.type || "volume",
        filterResult.filterMethodUsed
      );
    }

    UIComponents.renderInfoMessage(
      contentDiv,
      `Grafico generato con successo! ${volumeData.length} sessioni elaborate.`,
      "success"
    );

    UIComponents.renderFooter(
      contentDiv,
      volumeData,
      filterResult,
      params.chartType || "exercise"
    );
  }

  private logDebug(message: string, data?: any): void {
    if (this.plugin.settings.debugMode) {
      console.log(`EmbeddedChartView: ${message}`, data);
    }
  }
}
