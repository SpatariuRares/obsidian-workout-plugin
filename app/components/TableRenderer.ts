import { WorkoutLogData } from "app/types/WorkoutLogData";
import { EmbeddedTableParams, TableData, TableRow } from "./types";
import WorkoutChartsPlugin from "main";

/**
 * Handles the rendering of workout log data tables.
 * Creates HTML tables with proper styling, row grouping, and interactive features
 * for displaying workout log entries.
 */
export class TableRenderer {
  /**
   * Creates a container element for the table with proper styling.
   * @param contentDiv - The parent HTML element to append the table container to
   * @returns The created table container element
   */
  static createTableContainer(contentDiv: HTMLElement): HTMLElement {
    const tableContainer = contentDiv.createEl("div", {
      cls: "workout-table-container",
    });
    return tableContainer;
  }

  /**
   * Renders a workout log table with the provided data.
   * @param tableContainer - The container element to render the table in
   * @param headers - Array of column headers
   * @param rows - Array of data rows with date grouping info
   * @param params - Table parameters for configuration
   * @param logs - Original log objects for file opening functionality
   * @param plugin - Plugin instance for file operations
   * @returns True if table was successfully rendered, false otherwise
   */
  static renderTable(
    tableContainer: HTMLElement,
    headers: string[],
    rows: TableRow[],
    params: EmbeddedTableParams,
    logs?: WorkoutLogData[], // pass the original log objects
    plugin?: WorkoutChartsPlugin // pass the plugin for file opening
  ): boolean {
    try {
      const fragment = document.createDocumentFragment();

      const table = fragment.appendChild(document.createElement("table"));
      table.className = "workout-log-table";

      const thead = table.appendChild(document.createElement("thead"));
      const headerRow = thead.appendChild(document.createElement("tr"));

      headers.forEach((header) => {
        const th = headerRow.appendChild(document.createElement("th"));
        th.textContent = header;
      });

      const tbody = table.appendChild(document.createElement("tbody"));

      this.applyRowGroupingOptimized(tbody, rows, plugin);

      tableContainer.appendChild(fragment);

      return true;
    } catch (error) {
      console.error("Error rendering table:", error);
      return false;
    }
  }

  /**
   * Renders a fallback message when table rendering fails.
   * @param container - The container element to render the message in
   * @param message - Error message to display
   * @param title - Title for the error section
   */
  static renderFallbackMessage(
    container: HTMLElement,
    message: string,
    title: string
  ): void {
    container.innerHTML = `
      <div class="workout-table-error">
        <strong>${title}:</strong> ${message}
      </div>
    `;
  }

  /**
   * Optimized row grouping with better performance
   */
  private static applyRowGroupingOptimized(
    tbody: HTMLElement,
    rows: TableRow[],
    plugin?: any
  ): void {
    try {
      if (rows.length === 0) return;

      let currentDateKey = "";
      let isFirstGroup = true;
      let groupIndex = 0;
      const columnCount = rows[0].displayRow.length;

      const fragment = document.createDocumentFragment();

      rows.forEach((row) => {
        const dateKey = row.dateKey;

        // New group
        if (dateKey !== currentDateKey) {
          if (!isFirstGroup) {
            const spacerRow = fragment.appendChild(
              document.createElement("tr")
            );
            spacerRow.className = "workout-table-spacer";
            const spacerCell = spacerRow.appendChild(
              document.createElement("td")
            );
            spacerCell.className = "table-spacer-cell";
            spacerCell.setAttribute("colspan", columnCount.toString());
          }
          currentDateKey = dateKey;
          isFirstGroup = false;
          groupIndex++;
        }

        const tr = fragment.appendChild(document.createElement("tr"));
        tr.className = `same-day-log ${
          groupIndex % 2 === 0 ? "group-even" : "group-odd"
        }`;

        row.displayRow.forEach((cell, index) => {
          const td = tr.appendChild(document.createElement("td"));
          if (index === 0) {
            td.className = "workout-table-date-cell";
          } else if (index === 4) {
            td.className = "workout-table-volume-cell";
          }
          td.textContent = cell;
        });
      });

      tbody.appendChild(fragment);
    } catch (error) {
      console.error("Error applying row grouping:", error);
    }
  }
}
