import { WorkoutLogData } from "types/WorkoutLogData";
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
      // Create table element
      const table = tableContainer.createEl("table", {
        cls: "workout-log-table",
      });

      // Create table header
      const thead = table.createEl("thead");
      const headerRow = thead.createEl("tr");
      headers.forEach((header) => {
        const th = headerRow.createEl("th");
        th.textContent = header;
      });

      // Create table body
      const tbody = table.createEl("tbody");

      // Render rows with grouping
      this.applyRowGrouping(tbody, rows, plugin);

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
   * Applies row grouping to the table body based on date.
   * Groups consecutive rows with the same date and adds visual separators.
   * @param tbody - The table body element to apply grouping to
   * @param rows - Array of data rows with date grouping info
   * @param plugin - Plugin instance for file operations
   */
  private static applyRowGrouping(
    tbody: HTMLElement,
    rows: TableRow[],
    plugin?: any
  ): void {
    try {
      let currentDateKey = "";
      let isFirstGroup = true;
      let groupIndex = 0; // contatore gruppi
      const columnCount = rows.length > 0 ? rows[0].displayRow.length : 6;

      rows.forEach((row) => {
        const dateKey = row.dateKey;

        // Nuovo gruppo
        if (dateKey !== currentDateKey) {
          if (!isFirstGroup) {
            // Spacer
            const spacerRow = tbody.createEl("tr");
            spacerRow.addClass("workout-table-spacer");
            const spacerCell = spacerRow.createEl("td");
            spacerCell.setAttribute("colspan", columnCount.toString());
            spacerCell.style.height = "8px";
          }
          currentDateKey = dateKey;
          isFirstGroup = false;
          groupIndex++; // incrementa a ogni nuovo gruppo
        }

        // Crea riga dati
        const tr = tbody.createEl("tr");
        tr.addClass("same-day-log");
        tr.addClass(groupIndex % 2 === 0 ? "group-even" : "group-odd");

        row.displayRow.forEach((cell, index) => {
          const td = tr.createEl("td");
          if (index === 0) {
            // Date column
            td.addClass("workout-table-date-cell");
          } else if (index === 4) {
            // Volume column
            td.addClass("workout-table-volume-cell");
          } else if (index === 5) {
            // Link column - render as HTML link
            this.renderLinkCell(td, cell, plugin);
            return; // Skip the textContent assignment below
          }
          td.textContent = cell;
        });
      });
    } catch (error) {
      console.error("Error applying row grouping:", error);
    }
  }

  /**
   * Renders a link cell with HTML anchor tag for Obsidian file links.
   * @param td - The table cell element to render the link in
   * @param linkText - The link text in Obsidian wiki-link format [[path|display]]
   * @param plugin - Plugin instance for file operations
   */
  private static renderLinkCell(
    td: HTMLElement,
    linkText: string,
    plugin?: any
  ): void {
    if (!linkText || linkText === "Link non disp.") {
      td.textContent = linkText;
      return;
    }

    // Parse Obsidian wiki-link format [[path|display]]
    const linkMatch = linkText.match(/\[\[(.*?)\|(.*?)\]\]/);
    if (linkMatch) {
      const [, filePath, displayText] = linkMatch;

      // Create anchor element
      const link = td.createEl("a", {
        text: displayText,
        cls: "workout-table-link",
      });

      // Add click handler to open file in Obsidian
      link.addEventListener("click", (e) => {
        e.preventDefault();
        this.openFileInObsidian(filePath, plugin);
      });
    } else {
      // Fallback to plain text if not a valid wiki-link
      td.textContent = linkText;
    }
  }

  /**
   * Opens a file in Obsidian using the app's file manager.
   * @param filePath - The path of the file to open
   * @param plugin - Plugin instance for file operations
   */
  private static openFileInObsidian(
    filePath: string,
    plugin?: WorkoutChartsPlugin
  ): void {
    try {
      if (plugin && plugin.app && plugin.app.workspace) {
        const file = plugin.app.vault.getAbstractFileByPath(filePath);
        if (file) {
          plugin.app.workspace.openLinkText(filePath, "", true);
        } else {
          console.warn("File not found:", filePath);
        }
      } else {
        console.warn("Plugin or app not available");
      }
    } catch (error) {
      console.error("Error opening file in Obsidian:", error);
    }
  }
}
