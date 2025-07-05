import { Chart } from "chart.js/auto";
import { EmbeddedChartParams, ChartConfig, TrendIndicators } from "./types";
import { calculateTrendLine } from "../utils/utils";

export class ChartRenderer {
  static createChartContainer(contentDiv: HTMLElement): HTMLElement {
    const chartContainer = contentDiv.createEl("div", {
      cls: "embedded-chart-container",
    });
    chartContainer.style.width = "100%";
    return chartContainer;
  }

  static createCanvas(chartContainer: HTMLElement): HTMLCanvasElement {
    const canvas = chartContainer.createEl("canvas", {
      cls: "embedded-chart-canvas",
    });
    canvas.style.width = "100%";
    return canvas;
  }

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
        borderColor: "#FFC107",
        backgroundColor: "rgba(255, 193, 7, 0.10)",
        borderDash: [6, 6],
        borderWidth: 3,
        tension: 0,
        pointRadius: 0,
      });
    }
  }

  static createChartConfig(
    labels: string[],
    datasets: any[],
    chartType: string,
    params: EmbeddedChartParams
  ): ChartConfig {
    const title =
      params.title ||
      `Trend ${chartType.charAt(0).toUpperCase() + chartType.slice(1)}`;

    // Migliora i colori delle linee e delle etichette
    if (datasets[0]) {
      datasets[0].borderColor = "#4FC3F7"; // azzurro chiaro
      datasets[0].backgroundColor = "rgba(79, 195, 247, 0.15)";
      datasets[0].pointBackgroundColor = "#fff";
      datasets[0].pointBorderColor = "#1976D2"; // blu scuro per contrasto
      datasets[0].pointRadius = 5;
      datasets[0].borderWidth = 3;
    }

    // Per la linea di tendenza (se presente):
    const trendDataset = datasets.find(
      (ds) => ds.label === "Linea di Tendenza"
    );
    if (trendDataset) {
      trendDataset.borderColor = "#FFC107"; // giallo acceso
      trendDataset.backgroundColor = "rgba(255, 193, 7, 0.10)";
      trendDataset.borderDash = [6, 6];
      trendDataset.borderWidth = 3;
      trendDataset.pointRadius = 0;
    }

    // Opzioni Chart.js
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
            color: "var(--text-normal, #fff)",
            font: { size: 17, weight: "bold" as const },
          },
          legend: {
            display: true,
            labels: {
              color: "#fff",
              boxWidth: 24,
              padding: 16,
            },
          },
          tooltip: {
            mode: "index" as const,
            intersect: false,
            backgroundColor: "rgba(30,30,30,0.92)",
            titleColor: "#fff",
            bodyColor: "#fff",
            borderColor: "#FFC107",
            borderWidth: 2,
            callbacks: {
              label: (context: any) => {
                const value = context.parsed.y;
                const labelColor =
                  context.dataset.label === "Linea di Tendenza"
                    ? "#FFC107"
                    : "#4FC3F7";
                return [
                  `${context.dataset.label}: ${value.toFixed(1)} ${
                    chartType === "volume" || chartType === "weight"
                      ? "kg"
                      : "reps"
                  }`,
                ];
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
              color: "#4FC3F7", // azzurro chiaro per le ascisse
            },
            ticks: { color: "#4FC3F7" },
            grid: { color: "#444" },
          },
          y: {
            display: true,
            title: {
              display: true,
              text:
                chartType === "volume"
                  ? "Volume (kg)"
                  : chartType === "weight"
                  ? "Weight (kg)"
                  : "Reps",
              color: "#4FC3F7",
            },
            ticks: { color: "#4FC3F7" },
            grid: { color: "#444" },
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
