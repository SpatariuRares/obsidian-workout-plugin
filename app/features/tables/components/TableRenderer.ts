import { CONSTANTS } from "@app/constants/Constants";
import { TableRow, EmbeddedTableParams } from "@app/types";
import { WorkoutLogData } from "@app/types/WorkoutLogData";
import type WorkoutChartsPlugin from "main";
import { DateUtils } from "@app/utils/DateUtils";
import { TableActions } from "@app/features/tables/components/TableActions";
import { TableContainer, TableErrorMessage } from "@app/features/tables/ui";

export class TableRenderer {
  /**
   * Creates a container for the table
   * @param contentDiv - The parent element to create the container in
   * @returns The table container element
   */
  static createTableContainer(contentDiv: HTMLElement): HTMLElement {
    return TableContainer.create(contentDiv);
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
    plugin?: WorkoutChartsPlugin, // pass the plugin for file opening
    onRefresh?: () => void
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

      this.applyRowGroupingOptimized(tbody, rows, plugin, onRefresh);

      tableContainer.appendChild(fragment);

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Renders a fallback message when table rendering fails.
   * @param container - The container element to render the message in
   * @param message - Error message to display
   */
  static renderFallbackMessage(
    container: HTMLElement,
    message: string,
  ): void {
    TableErrorMessage.render(container, message);
  }

  /**
   * Optimized row grouping with better performance
   */
  private static applyRowGroupingOptimized(
    tbody: HTMLElement,
    rows: TableRow[],
    plugin?: WorkoutChartsPlugin,
    onRefresh?: () => void
  ): void {
    try {
      if (rows.length === 0) return;

      let currentDateKey = "";
      let groupIndex = 0;
      const columnCount = rows[0].displayRow.length;

      const fragment = document.createDocumentFragment();

      // Group rows by date for calculating aggregates
      const groupedRows: { [key: string]: typeof rows } = {};
      const dateKeys: string[] = [];
      rows.forEach((row) => {
        if (!groupedRows[row.dateKey]) {
          groupedRows[row.dateKey] = [];
          dateKeys.push(row.dateKey);
        }
        groupedRows[row.dateKey].push(row);
      });

      // Helper function to create spacer row
      const createSpacerRow = (dateKey: string) => {
        const groupRows = groupedRows[dateKey];
        let totalVolume = 0;
        let totalWeight = 0;
        let totalReps = 0;

        groupRows.forEach((r) => {
          totalVolume += r.originalLog?.volume || 0;
          totalWeight += r.originalLog?.weight || 0;
          totalReps += r.originalLog?.reps || 0;
        });

        const spacerRow = fragment.appendChild(document.createElement("tr"));
        spacerRow.className = "workout-table-spacer";

        // First cell: formatted date
        const dateCell = spacerRow.appendChild(document.createElement("td"));
        dateCell.className = "workout-table-spacer-date-cell";
        const formattedDate = DateUtils.toShortDate(groupRows[0].originalDate);
        dateCell.textContent = formattedDate;

        // Create summary cell for the remaining columns
        const summaryCell = spacerRow.appendChild(document.createElement("td"));
        summaryCell.className = "workout-table-spacer-summary-cell";
        summaryCell.setAttribute("colspan", (columnCount - 1).toString());

        // Create stat spans using DOM methods
        const repsSpan = summaryCell.createEl("span", { cls: "workout-spacer-stat" });
        repsSpan.appendText(CONSTANTS.WORKOUT.TABLE.ICONS.REPS + CONSTANTS.WORKOUT.TABLE.LABELS.REPETITIONS + ": ");
        repsSpan.createEl("strong", { text: totalReps.toString() });

        const weightSpan = summaryCell.createEl("span", { cls: "workout-spacer-stat" });
        weightSpan.appendText(CONSTANTS.WORKOUT.TABLE.ICONS.WEIGHT + CONSTANTS.WORKOUT.TABLE.LABELS.WEIGHT + ": ");
        weightSpan.createEl("strong", { text: `${totalWeight.toFixed(1)} kg` });

        const volumeSpan = summaryCell.createEl("span", { cls: "workout-spacer-stat" });
        volumeSpan.appendText(CONSTANTS.WORKOUT.TABLE.ICONS.VOLUME + CONSTANTS.WORKOUT.TABLE.LABELS.VOLUME + ": ");
        volumeSpan.createEl("strong", { text: totalVolume.toFixed(1) });
      };

      rows.forEach((row) => {
        const dateKey = row.dateKey;

        // New group - show spacer BEFORE the group
        if (dateKey !== currentDateKey) {
          createSpacerRow(dateKey);
          currentDateKey = dateKey;
          groupIndex++;
        }

        const tr = fragment.appendChild(document.createElement("tr"));
        tr.className = `workout-same-day-log ${groupIndex % 2 === 0 ? "group-even" : "group-odd"
          }`;

        row.displayRow.forEach((cell, cellIndex) => {
          const td = tr.appendChild(document.createElement("td"));

          if (cellIndex === 0) {
            td.className = "workout-table-date-cell";
            td.textContent = cell;
          } else if (cellIndex === 4) {
            td.className = "workout-table-volume-cell";
            td.textContent = cell;
          } else if (cellIndex === row.displayRow.length - 1) {
            td.className = "workout-table-actions-cell";
            TableActions.renderActionButtons(td, row.originalLog, plugin, onRefresh);
          } else {
            td.textContent = cell;
          }
        });
      });

      tbody.appendChild(fragment);
    } catch {
      // Silent error - grouping failed
    }
  }
}
