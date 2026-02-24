import { CONSTANTS, getColumnLabels } from "@app/constants";
import {
  EmbeddedChartParams,
  ChartDataset,
  CHART_DATA_TYPE,
} from "@app/features/charts/types";
import { t } from "@app/i18n";

/**
 * Table-based representations of chart data.
 * Provides a fallback table when Chart.js is unavailable
 * and a mobile-optimized table view.
 */
export class ChartTableViews {
  /**
   * Renders a simple fallback table when Chart.js rendering is unavailable.
   */
  static renderFallback(
    container: HTMLElement,
    labels: string[],
    volumeData: number[],
  ): void {
    const tableDiv = container.createEl("div", {
      cls: "workout-charts-table-fallback",
    });

    const table = tableDiv.createEl("table", {
      cls: "workout-charts-table",
    });

    const thead = table.createEl("thead");
    const headerRow = thead.createEl("tr");
    [
      CONSTANTS.WORKOUT.LABELS.TABLE.DATE,
      CONSTANTS.WORKOUT.LABELS.TABLE.VOLUME_WITH_UNIT,
    ].forEach((label) => {
      headerRow.createEl("th", { text: label });
    });

    const tbody = table.createEl("tbody");
    volumeData.forEach((value, index) => {
      const row = tbody.createEl("tr");
      row.createEl("td", { text: labels[index] });
      row.createEl("td", { text: value.toFixed(1) });
    });

    tableDiv
      .createEl("div", { cls: "workout-charts-footer" })
      .appendText(
        `${CONSTANTS.WORKOUT.ICONS.STATUS.INFO} ${t("charts.fallbackTableMessage")}`,
      );
  }

  /**
   * Creates a mobile-friendly table for displaying chart data.
   * Hidden on desktop, shown on mobile via CSS.
   */
  static renderMobile(
    container: HTMLElement,
    labels: string[],
    datasets: ChartDataset[],
    chartType: CHART_DATA_TYPE,
    params: EmbeddedChartParams,
  ): void {
    const mobileTableContainer = container.createEl("div", {
      cls: "workout-chart-mobile-table",
    });

    const title =
      params.title ||
      `Trend ${chartType.charAt(0).toUpperCase() + chartType.slice(1)}`;

    mobileTableContainer.createEl("h3", {
      text: title,
      cls: "workout-mobile-table-title",
    });

    const table = mobileTableContainer.createEl("table");

    const thead = table.createEl("thead");
    const headerRow = thead.createEl("tr");
    headerRow.createEl("th", {
      text: CONSTANTS.WORKOUT.TABLE.COLUMNS.DATE.label,
    });
    const columnLabels = getColumnLabels();
    headerRow.createEl("th", {
      text: columnLabels[chartType] || chartType,
    });

    const tbody = table.createEl("tbody");

    // Get the main dataset (first dataset, excluding trend line)
    const mainDataset =
      datasets.find((ds) => ds.label !== t("table.trendLine")) || datasets[0];

    if (mainDataset && mainDataset.data) {
      labels.forEach((label, index) => {
        const value = mainDataset.data[index];
        if (value !== undefined && value !== null) {
          const row = tbody.createEl("tr");
          row.createEl("td", { text: label });
          row.createEl("td", { text: value.toFixed(1) });
        }
      });
    } else {
      const row = tbody.createEl("tr");
      row.createEl("td", {
        text: t("table.noData"),
        attr: { colspan: "2" },
      });
    }
  }
}

// Backward-compatible aliases
export const ChartFallbackTable = {
  render: ChartTableViews.renderFallback.bind(ChartTableViews),
};

export const MobileTable = {
  render: ChartTableViews.renderMobile.bind(ChartTableViews),
};
