import { EmbeddedChartParams, ChartDataset } from "@app/types";

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
    chartType: string,
    params: EmbeddedChartParams
  ): void {
    const mobileTableContainer = container.createEl("div", {
      cls: "workout-chart-mobile-table",
    });

    const title =
      params.title ||
      `Trend ${chartType.charAt(0).toUpperCase() + chartType.slice(1)}`;

    // Create table header
    const tableHeader = mobileTableContainer.createEl("h3", {
      text: title,
      cls: "mobile-table-title",
    });

    const table = mobileTableContainer.createEl("table");

    // Create table header row
    const thead = table.createEl("thead");
    const headerRow = thead.createEl("tr");

    const dateHeader = headerRow.createEl("th", { text: "Data" });
    const valueHeader = headerRow.createEl("th", {
      text:
        chartType === "volume"
          ? "Volume (kg)"
          : chartType === "weight"
            ? "Peso (kg)"
            : "Ripetizioni",
    });

    // Create table body
    const tbody = table.createEl("tbody");

    // Get the main dataset (first dataset, excluding trend line)
    const mainDataset =
      datasets.find((ds) => ds.label !== "Linea di Tendenza") || datasets[0];

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
        text: "Nessun dato disponibile",
        attr: { colspan: "2" },
      });
    }
  }
}
