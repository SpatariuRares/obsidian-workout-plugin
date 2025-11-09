import { Chart, ChartConfiguration } from "chart.js/auto";
import { EmbeddedChartParams, ChartDataset } from "@app/types";
import { calculateTrendLine } from "@app/utils/utils";
import { TrendIndicators } from "@app/types";

/**
 * Handles the rendering of workout data charts using Chart.js.
 * Provides methods for creating chart containers, configuring chart options,
 * and rendering interactive charts with trend lines and styling.
 */
export class ChartRenderer {
  /**
   * Gets the color scheme for charts
   * @returns Color scheme object
   */
  private static getChartColors() {
    // Get computed styles to access Obsidian CSS variables
    const style = getComputedStyle(document.documentElement);

    return {
      primary: {
        main:
          style.getPropertyValue("--interactive-accent").trim() || "#6366F1",
        light:
          style.getPropertyValue("--interactive-accent").trim() + "20" ||
          "rgba(99, 102, 241, 0.2)",
        dark:
          style.getPropertyValue("--interactive-accent-hover").trim() ||
          "#4338CA",
        point: style.getPropertyValue("--text-on-accent").trim() || "#FFFFFF",
        pointBorder:
          style.getPropertyValue("--interactive-accent-hover").trim() ||
          "#4338CA",
      },
      secondary: {
        main: style.getPropertyValue("--text-success").trim() || "#10B981",
        light:
          style.getPropertyValue("--text-success").trim() + "20" ||
          "rgba(16, 185, 129, 0.2)",
        dark:
          style.getPropertyValue("--text-success-hover").trim() || "#059669",
        point: style.getPropertyValue("--text-on-accent").trim() || "#FFFFFF",
        pointBorder:
          style.getPropertyValue("--text-success-hover").trim() || "#059669",
      },
      accent: {
        main: style.getPropertyValue("--text-warning").trim() || "#F59E0B",
        light:
          style.getPropertyValue("--text-warning").trim() + "20" ||
          "rgba(245, 158, 11, 0.2)",
        dark:
          style.getPropertyValue("--text-warning-hover").trim() || "#D97706",
        point: style.getPropertyValue("--text-on-accent").trim() || "#FFFFFF",
        pointBorder:
          style.getPropertyValue("--text-warning-hover").trim() || "#D97706",
      },
      trend: {
        main: style.getPropertyValue("--text-error").trim() || "#EF4444",
        light:
          style.getPropertyValue("--text-error").trim() + "20" ||
          "rgba(239, 68, 68, 0.2)",
        dark: style.getPropertyValue("--text-error-hover").trim() || "#DC2626",
        point: style.getPropertyValue("--text-on-accent").trim() || "#FFFFFF",
        pointBorder:
          style.getPropertyValue("--text-error-hover").trim() || "#DC2626",
      },
      grid:
        style.getPropertyValue("--background-modifier-border").trim() + "40" ||
        "rgba(156, 163, 175, 0.2)",
      text: style.getPropertyValue("--text-normal").trim() || "#374151",
      background:
        style.getPropertyValue("--background-primary").trim() ||
        "rgba(255, 255, 255, 0.95)",
      tooltip: {
        background:
          style.getPropertyValue("--background-secondary").trim() + "F0" ||
          "rgba(17, 24, 39, 0.95)",
        border:
          style.getPropertyValue("--interactive-accent").trim() || "#6366F1",
        text: style.getPropertyValue("--text-normal").trim() || "#FFFFFF",
      },
    };
  }

  /**
   * Creates a container element for the chart with proper styling.
   * @param contentDiv - The parent HTML element to append the chart container to
   * @returns The created chart container element
   */
  static createChartContainer(contentDiv: HTMLElement): HTMLElement {
    const chartContainer = contentDiv.createEl("div", {
      cls: "workout-charts-container",
    });
    return chartContainer;
  }

  /**
   * Creates a canvas element for the chart rendering.
   * @param chartContainer - The container element to append the canvas to
   * @returns The created canvas element
   */
  static createCanvas(chartContainer: HTMLElement): HTMLCanvasElement {
    const canvas = chartContainer.createEl("canvas", {
      cls: "workout-charts-canvas",
    });
    return canvas;
  }

  /**
   * Adds a trend line to the datasets
   * @param datasets - Array of chart datasets
   * @param trendIndicators - Trend indicators for styling
   */
  static addTrendLineToDatasets(
    datasets: ChartDataset[],
    trendIndicators: TrendIndicators
  ): void {
    const mainDataset = datasets[0];
    if (mainDataset.data && mainDataset.data.length > 1) {
      const { slope, intercept } = calculateTrendLine(mainDataset.data);
      const trendData = mainDataset.data.map(
        (_: number, index: number) => slope * index + intercept
      );

      const colors = this.getChartColors();
      datasets.push({
        label: "Linea di Tendenza",
        data: trendData,
        borderColor: colors.trend.main,
        backgroundColor: colors.trend.light,
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
    const colors = this.getChartColors();
    switch (chartType) {
      case "volume":
        return colors.primary;
      case "weight":
        return colors.secondary;
      case "reps":
        return colors.accent;
      default:
        return colors.primary;
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
    chartType: string,
    params: EmbeddedChartParams
  ): ChartConfiguration {
    const title =
      params.title ||
      `Trend ${chartType.charAt(0).toUpperCase() + chartType.slice(1)}`;

    const colors = this.getChartColors();
    const colorScheme = this.getColorScheme(chartType);

    if (datasets[0]) {
      datasets[0].borderColor = colorScheme.main;
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
      trendDataset.borderColor = colors.trend.main;
      trendDataset.backgroundColor = colors.trend.light;
      trendDataset.borderDash = [8, 4];
      trendDataset.borderWidth = 2.5;
      trendDataset.pointRadius = 0;
      trendDataset.pointHoverRadius = 0;
    }

    return {
      type: "line",
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 4 / 3,
        plugins: {
          title: {
            display: true,
            text: title,
            color: colors.text,
            font: {
              size: 18,
              weight: 600,
              family: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
            },
            padding: { top: 10, bottom: 20 },
          },
          legend: {
            display: true,
            position: "top" as const,
            labels: {
              color: colors.text,
              boxWidth: 20,
              padding: 20,
              usePointStyle: true,
              font: {
                size: 12,
                weight: 500,
              },
            },
          },
          tooltip: {
            mode: "index" as const,
            intersect: false,
            backgroundColor: colors.tooltip.background,
            titleColor: colors.tooltip.text,
            bodyColor: colors.tooltip.text,
            borderColor: colors.tooltip.border,
            borderWidth: 1,
            cornerRadius: 8,
            padding: 12,
            displayColors: true,
            callbacks: {
              label: function (tooltipItem) {
                const value = tooltipItem.parsed.y;
                const label = tooltipItem.dataset.label ?? "";
                const unit =
                  chartType === "volume" || chartType === "weight"
                    ? "kg"
                    : "reps";
                return `${label}: ${
                  value?.toFixed ? value.toFixed(1) : value
                } ${unit}`;
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
              color: colors.text,
              font: { size: 14, weight: 500 },
            },
            ticks: {
              color: colors.text,
              font: { size: 12 },
            },
            grid: {
              color: colors.grid,
            },
            border: {
              color: colors.grid,
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
              color: colors.text,
              font: { size: 14, weight: 500 },
            },
            ticks: {
              color: colors.text,
              font: { size: 12 },
            },
            grid: {
              color: colors.grid,
            },
            border: {
              color: colors.grid,
            },
          },
        },
        interaction: {
          mode: "nearest" as const,
          axis: "x" as const,
          intersect: false,
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
    datasets: ChartDataset[],
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
