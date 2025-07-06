import { EmbeddedChartParams } from "./types";

/**
 * Renders a mobile-friendly table for displaying chart data on small screens.
 * Provides an alternative view to charts when screen space is limited.
 */
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
    datasets: any[],
    chartType: string,
    params: EmbeddedChartParams
  ): void {
    console.log("=== MOBILE TABLE RENDER START ===");
    console.log("MobileTable.render called with:", {
      labels: labels.length,
      datasets: datasets.length,
      chartType,
      labelsPreview: labels.slice(0, 3),
      datasetsPreview: datasets.map((ds) => ({
        label: ds.label,
        dataLength: ds.data?.length,
      })),
    });
    console.log("Container element:", container);
    console.log("Container tagName:", container.tagName);
    console.log("Container className:", container.className);

    console.log("Creating mobile table container...");
    const mobileTableContainer = container.createEl("div", {
      cls: "embedded-chart-mobile-table",
    });
    console.log("Mobile table container created:", mobileTableContainer);

    const title =
      params.title ||
      `Trend ${chartType.charAt(0).toUpperCase() + chartType.slice(1)}`;
    console.log("Table title:", title);

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

    console.log("Main dataset:", mainDataset);

    if (mainDataset && mainDataset.data) {
      console.log("Processing data:", mainDataset.data);
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

    console.log("=== MOBILE TABLE RENDER COMPLETE ===");
    console.log("Mobile table created successfully");
    console.log("Mobile table container:", mobileTableContainer);
    console.log("Mobile table HTML:", mobileTableContainer.innerHTML);
    console.log("Mobile table CSS classes:", mobileTableContainer.className);
    console.log(
      "Mobile table computed style display:",
      getComputedStyle(mobileTableContainer).display
    );

    // Check if the table is still in the DOM after a short delay
    setTimeout(() => {
      console.log("=== MOBILE TABLE DOM CHECK (1 second later) ===");
      console.log("Checking if mobile table still exists after 1 second...");
      console.log(
        "Mobile table still in DOM:",
        document.contains(mobileTableContainer)
      );
      console.log("Mobile table parent:", mobileTableContainer.parentElement);
      console.log("Container children:", container.children.length);
      console.log(
        "Mobile table computed style display:",
        getComputedStyle(mobileTableContainer).display
      );
      console.log(
        "Mobile table visibility:",
        getComputedStyle(mobileTableContainer).visibility
      );
      console.log(
        "Mobile table opacity:",
        getComputedStyle(mobileTableContainer).opacity
      );
    }, 1000);
  }
}
