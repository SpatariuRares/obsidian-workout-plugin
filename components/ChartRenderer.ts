import { Chart } from "chart.js/auto";
import { EmbeddedChartParams, ChartConfig, TrendIndicators } from "./types";
import { calculateTrendLine } from "../utils/utils";

/**
 * Handles the rendering of workout data charts using Chart.js.
 * Provides methods for creating chart containers, configuring chart options,
 * and rendering interactive charts with trend lines and styling.
 */
export class ChartRenderer {
  // Modern color palette for charts
  private static readonly CHART_COLORS = {
    primary: {
      main: "#6366F1", // Indigo-500
      light: "rgba(99, 102, 241, 0.2)",
      dark: "#4338CA", // Indigo-700
      point: "#FFFFFF",
      pointBorder: "#4338CA",
    },
    secondary: {
      main: "#10B981", // Emerald-500
      light: "rgba(16, 185, 129, 0.2)",
      dark: "#059669", // Emerald-700
      point: "#FFFFFF",
      pointBorder: "#059669",
    },
    accent: {
      main: "#F59E0B", // Amber-500
      light: "rgba(245, 158, 11, 0.2)",
      dark: "#D97706", // Amber-600
      point: "#FFFFFF",
      pointBorder: "#D97706",
    },
    trend: {
      main: "#EF4444", // Red-500
      light: "rgba(239, 68, 68, 0.15)",
      dark: "#DC2626", // Red-600
      point: "#FFFFFF",
      pointBorder: "#DC2626",
    },
    grid: "rgba(156, 163, 175, 0.2)", // Gray-400 with opacity
    text: "#374151",
    background: "rgba(255, 255, 255, 0.95)",
    tooltip: {
      background: "rgba(17, 24, 39, 0.95)",
      border: "#6366F1",
      text: "#FFFFFF",
    },
  };

  /**
   * Creates a container element for the chart with proper styling.
   * @param contentDiv - The parent HTML element to append the chart container to
   * @returns The created chart container element
   */
  static createChartContainer(contentDiv: HTMLElement): HTMLElement {
    const chartContainer = contentDiv.createEl("div", {
      cls: "embedded-chart-container",
    });
    chartContainer.style.width = "100%";
    return chartContainer;
  }

  /**
   * Creates a canvas element for the chart rendering.
   * @param chartContainer - The container element to append the canvas to
   * @returns The created canvas element
   */
  static createCanvas(chartContainer: HTMLElement): HTMLCanvasElement {
    const canvas = chartContainer.createEl("canvas", {
      cls: "embedded-chart-canvas",
    });
    canvas.style.width = "100%";
    return canvas;
  }

  /**
   * Adds a trend line dataset to the existing chart datasets.
   * Calculates the trend line using linear regression and adds it as a dashed line.
   * @param datasets - Array of chart datasets to add the trend line to
   * @param trendIndicators - Trend indicators containing slope and intercept data
   */
  static addTrendLineToDatasets(
    datasets: any[],
    trendIndicators: TrendIndicators
  ): void {
    const mainDataset = datasets[0];
    if (mainDataset.data && mainDataset.data.length > 1) {
      const { slope, intercept } = calculateTrendLine(
        mainDataset.data as number[]
      );
      const trendData = mainDataset.data.map(
        (_: any, index: number) => slope * index + intercept
      );

      datasets.push({
        label: "Linea di Tendenza",
        data: trendData,
        borderColor: this.CHART_COLORS.trend.main,
        backgroundColor: this.CHART_COLORS.trend.light,
        borderDash: [8, 4],
        borderWidth: 2.5,
        tension: 0,
        pointRadius: 0,
        pointHoverRadius: 0,
      });
    }
  }

  /**
   * Gets the appropriate color scheme based on chart type
   * @param chartType - Type of chart data (volume, weight, reps)
   * @returns Color scheme object
   */
  private static getColorScheme(chartType: string) {
    switch (chartType) {
      case "volume":
        return this.CHART_COLORS.primary;
      case "weight":
        return this.CHART_COLORS.secondary;
      case "reps":
        return this.CHART_COLORS.accent;
      default:
        return this.CHART_COLORS.primary;
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
    datasets: any[],
    chartType: string,
    params: EmbeddedChartParams
  ): ChartConfig {
    const title =
      params.title ||
      `Trend ${chartType.charAt(0).toUpperCase() + chartType.slice(1)}`;

    const colorScheme = this.getColorScheme(chartType);

    // Apply modern color scheme to main dataset
    if (datasets[0]) {
      datasets[0].borderColor = colorScheme.main;
      datasets[0].backgroundColor = colorScheme.light;
      datasets[0].pointBackgroundColor = colorScheme.point;
      datasets[0].pointBorderColor = colorScheme.pointBorder;
      datasets[0].pointRadius = 4;
      datasets[0].pointHoverRadius = 6;
      datasets[0].borderWidth = 2.5;
      datasets[0].tension = 0.3;
      datasets[0].fill = true;
    }

    // Apply trend line colors (if present)
    const trendDataset = datasets.find(
      (ds) => ds.label === "Linea di Tendenza"
    );
    if (trendDataset) {
      trendDataset.borderColor = this.CHART_COLORS.trend.main;
      trendDataset.backgroundColor = this.CHART_COLORS.trend.light;
      trendDataset.borderDash = [8, 4];
      trendDataset.borderWidth = 2.5;
      trendDataset.pointRadius = 0;
      trendDataset.pointHoverRadius = 0;
    }

    // Enhanced Chart.js options
    return {
      type: "line",
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: title,
            color: this.CHART_COLORS.text,
            font: {
              size: 18,
              weight: "600" as const,
              family: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
            },
            padding: { top: 10, bottom: 20 },
          },
          legend: {
            display: true,
            position: "top" as const,
            labels: {
              color: this.CHART_COLORS.text,
              boxWidth: 20,
              padding: 20,
              usePointStyle: true,
              font: {
                size: 12,
                weight: "500" as const,
              },
            },
          },
          tooltip: {
            mode: "index" as const,
            intersect: false,
            backgroundColor: this.CHART_COLORS.tooltip.background,
            titleColor: this.CHART_COLORS.tooltip.text,
            bodyColor: this.CHART_COLORS.tooltip.text,
            borderColor: this.CHART_COLORS.tooltip.border,
            borderWidth: 1,
            cornerRadius: 8,
            padding: 12,
            displayColors: true,
            callbacks: {
              label: (context: any) => {
                const value = context.parsed.y;
                const unit =
                  chartType === "volume" || chartType === "weight"
                    ? "kg"
                    : "reps";
                return `${context.dataset.label}: ${value.toFixed(1)} ${unit}`;
              },
            },
          },
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: "Data",
              color: this.CHART_COLORS.text,
              font: { size: 14, weight: "500" as const },
            },
            ticks: {
              color: this.CHART_COLORS.text,
              font: { size: 12 },
            },
            grid: {
              color: this.CHART_COLORS.grid,
              drawBorder: false,
            },
            border: {
              color: this.CHART_COLORS.grid,
            },
          },
          y: {
            display: true,
            title: {
              display: true,
              text:
                chartType === "volume"
                  ? "Volume (kg)"
                  : chartType === "weight"
                  ? "Peso (kg)"
                  : "Ripetizioni",
              color: this.CHART_COLORS.text,
              font: { size: 14, weight: "500" as const },
            },
            ticks: {
              color: this.CHART_COLORS.text,
              font: { size: 12 },
            },
            grid: {
              color: this.CHART_COLORS.grid,
              drawBorder: false,
            },
            border: {
              color: this.CHART_COLORS.grid,
            },
          },
        },
        interaction: {
          mode: "nearest" as const,
          axis: "x" as const,
          intersect: false,
        },
        elements: {
          point: {
            hoverRadius: 6,
            radius: 4,
          },
        },
      },
    };
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
    datasets: any[],
    params: EmbeddedChartParams
  ): boolean {
    const canvas = this.createCanvas(chartContainer);
    const chartConfig = this.createChartConfig(
      labels,
      datasets,
      params.type || "volume",
      params
    );

    try {
      const chart = new Chart(canvas, chartConfig);
      return true;
    } catch (error) {
      console.warn("Chart.js not available, rendering fallback table:", error);
      return false;
    }
  }
}
