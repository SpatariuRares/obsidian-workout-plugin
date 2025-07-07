import { Notice } from "obsidian";
import { TableRow, EmbeddedTableParams } from "./types";
import { WorkoutLogData } from "../types/WorkoutLogData";
import type WorkoutChartsPlugin from "../../main";

export class TableRenderer {
  /**
   * Creates a container for the table
   * @param contentDiv - The parent element to create the container in
   * @returns The table container element
   */
  static createTableContainer(contentDiv: HTMLElement): HTMLElement {
    const tableContainer = contentDiv.createEl("div", {
      cls: "workout-table-container",
    });
    return tableContainer;
  }

  /**
   * Renders a table with the provided data
   * @param tableContainer - The container to render the table in
   * @param headers - Array of column headers
   * @param rows - Array of table rows
   * @param params - Table parameters
   * @param logs - Original log data objects
   * @param plugin - Plugin instance for operations
   * @returns True if rendering was successful, false otherwise
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
    const errorDiv = container.createEl("div", {
      cls: "workout-table-error",
    });
    const strongEl = errorDiv.createEl("strong", { text: `${title}:` });
    errorDiv.append(` ${message}`);
  }

  /**
   * Optimized row grouping with better performance
   */
  private static applyRowGroupingOptimized(
    tbody: HTMLElement,
    rows: TableRow[],
    plugin?: WorkoutChartsPlugin
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
            td.textContent = cell;
          } else if (index === 4) {
            td.className = "workout-table-volume-cell";
            td.textContent = cell;
          } else if (index === row.displayRow.length - 1) {
            td.className = "workout-table-actions-cell";
            this.renderActionButtons(td, row.originalLog, plugin);
          } else {
            td.textContent = cell;
          }
        });
      });

      tbody.appendChild(fragment);
    } catch (error) {
      console.error("Error applying row grouping:", error);
    }
  }

  /**
   * Renders action buttons (edit and delete) for a table row
   * @param td - The table cell to render the buttons in
   * @param originalLog - The original log data for this row
   * @param plugin - Plugin instance for operations
   */
  private static renderActionButtons(
    td: HTMLElement,
    originalLog: WorkoutLogData | undefined,
    plugin?: WorkoutChartsPlugin
  ): void {
    if (!originalLog) {
      return;
    }

    const actionsContainer = td.createEl("div", {
      cls: "workout-table-actions",
    });

    // Edit button
    const editBtn = actionsContainer.createEl("button", {
      cls: "workout-table-action-btn workout-table-edit-btn",
      text: "✏️",
      attr: {
        title: "Edit log entry",
      },
    });

    // Delete button
    const deleteBtn = actionsContainer.createEl("button", {
      cls: "workout-table-action-btn workout-table-delete-btn",
      text: "🗑️",
      attr: {
        title: "Delete log entry",
      },
    });

    // Event listeners
    editBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (plugin) {
        // Open EditLogModal with the original log data
        const { EditLogModal } = await import("../modals/EditLogModal");
        const modal = new EditLogModal(plugin.app, plugin, originalLog, () => {
          plugin.triggerWorkoutLogRefresh();
        });
        modal.open();
      }
    });

    deleteBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (
        plugin &&
        confirm("Are you sure you want to delete this log entry?")
      ) {
        try {
          await plugin.deleteWorkoutLogEntry(originalLog);
          new Notice("Log entry deleted successfully!");
          // Refresh the table
          plugin.triggerWorkoutLogRefresh();
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          new Notice("Error deleting log entry: " + errorMessage);
          console.error("Error deleting log entry:", error);
        }
      }
    });
  }
}
