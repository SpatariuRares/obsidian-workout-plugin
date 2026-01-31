import { CONSTANTS } from "@app/constants";
import { EmbeddedChartParams, ChartDataset, CHART_DATA_TYPE } from "@app/types";

export class MobileTable {
  /**
   * Creates a mobile-friendly table for displaying chart data.
   * @param container - The HTML element to render the mobile table in
   * @param labels - Array of labels for the x-axis (dates)
   * @param datasets - Array of datasets to display in the table
   * @param chartType - Type of chart data (volume, weight, reps)
   * @param params - Chart parameters including title
   */
  static render(
    container: HTMLElement,
    labels: string[],
    datasets: ChartDataset[],
    chartType: CHART_DATA_TYPE,
    params: EmbeddedChartParams
  ): void {
    const mobileTableContainer = container.createEl("div", {
      cls: "workout-chart-mobile-table",
    });

    const title =
      params.title ||
      `Trend ${chartType.charAt(0).toUpperCase() + chartType.slice(1)}`;

    // Create table header
    mobileTableContainer.createEl("h3", {
      text: title,
      cls: "workout-mobile-table-title",
    });

    const table = mobileTableContainer.createEl("table");

    // Create table header row
    const thead = table.createEl("thead");
    const headerRow = thead.createEl("tr");

    headerRow.createEl("th", { text: CONSTANTS.WORKOUT.TABLE.LABELS.DATA });
    headerRow.createEl("th", {
      text:
        chartType === CHART_DATA_TYPE.VOLUME
          ? CONSTANTS.WORKOUT.TABLE.LABELS.VOLUME
          : chartType === CHART_DATA_TYPE.WEIGHT
            ? CONSTANTS.WORKOUT.TABLE.LABELS.WEIGHT
            : CONSTANTS.WORKOUT.TABLE.LABELS.REPETITIONS,
    });

    // Create table body
    const tbody = table.createEl("tbody");

    // Get the main dataset (first dataset, excluding trend line)
    const mainDataset =
      datasets.find((ds) => ds.label !== CONSTANTS.WORKOUT.TABLE.LABELS.TREND_LINE) ||
      datasets[0];

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
      // Fallback: create empty table with message
      const row = tbody.createEl("tr");
      row.createEl("td", {
        text: CONSTANTS.WORKOUT.TABLE.LABELS.NO_DATA,
        attr: { colspan: "2" },
      });
    }
  }
}

