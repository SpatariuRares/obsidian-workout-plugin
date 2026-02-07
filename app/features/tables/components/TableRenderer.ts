import { CONSTANTS } from "@app/constants";
import { TableRow, EmbeddedTableParams } from "@app/features/tables/types";
import { WorkoutLogData } from "@app/types/WorkoutLogData";
import type WorkoutChartsPlugin from "main";
import { DateUtils } from "@app/utils/DateUtils";
import { TableActions } from "@app/features/tables/components/TableActions";
import { TableErrorMessage, TableHeader } from "@app/features/tables/ui";
import { SpacerStat, ProtocolBadge } from "@app/components/atoms";
import { SpacerRowCalculator } from "@app/features/tables/business/SpacerRowCalculator";
import { ProtocolResolver } from "@app/features/tables/business/ProtocolResolver";

export class TableRenderer {
  /**
   * Creates a container for the table
   * @param contentDiv - The parent element to create the container in
   * @returns The table container element
   */
  static createTableContainer(contentDiv: HTMLElement): HTMLElement {
    return contentDiv.createEl("div", { cls: "workout-table-container" });
  }

  /**
   * Renders a table with the provided data
   * @param tableContainer - The container to render the table in
   * @param headers - Array of column headers
   * @param rows - Array of table rows
   * @param params - Table parameters
   * @param logs - Original log data objects
   * @param plugin - Plugin instance for operations
   * @param onRefresh - Callback to refresh table
   * @param signal - AbortSignal for event listener cleanup
   * @returns True if rendering was successful, false otherwise
   */
  static renderTable(
    tableContainer: HTMLElement,
    headers: string[],
    rows: TableRow[],
    params: EmbeddedTableParams,
    logs?: WorkoutLogData[], // pass the original log objects
    plugin?: WorkoutChartsPlugin, // pass the plugin for file opening
    onRefresh?: () => void,
    signal?: AbortSignal,
  ): boolean {
    try {
      const fragment = document.createDocumentFragment();

      const table = fragment.appendChild(document.createElement("table"));
      table.className = "workout-log-table";

      TableHeader.render(table, headers);

      const tbody = table.appendChild(document.createElement("tbody"));

      this.applyRowGroupingOptimized(
        tbody,
        rows,
        headers,
        plugin,
        onRefresh,
        signal,
      );

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
  static renderFallbackMessage(container: HTMLElement, message: string): void {
    TableErrorMessage.render(container, message);
  }

  /**
   * Optimized row grouping with better performance
   */
  private static applyRowGroupingOptimized(
    tbody: HTMLElement,
    rows: TableRow[],
    headers: string[],
    plugin?: WorkoutChartsPlugin,
    onRefresh?: () => void,
    signal?: AbortSignal,
  ): void {
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

    // Helper function to create spacer row with dynamic summary based on exercise type
    const createSpacerRow = (dateKey: string) => {
      const groupRows = groupedRows[dateKey];
      const spacerData = SpacerRowCalculator.calculate(groupRows);

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

      spacerData.stats.forEach((stat) => {
        SpacerStat.create(summaryCell, stat);
      });
    };

    // Find column indices dynamically based on headers
    const protocolColumnIndex = headers.indexOf(
      CONSTANTS.WORKOUT.TABLE.COLUMNS.PROTOCOL,
    );
    const volumeColumnIndex = headers.indexOf(
      CONSTANTS.WORKOUT.TABLE.COLUMNS.VOLUME,
    );
    const actionsColumnIndex = headers.indexOf(
      CONSTANTS.WORKOUT.TABLE.COLUMNS.ACTIONS,
    );

    rows.forEach((row) => {
      const dateKey = row.dateKey;

      // New group - show spacer BEFORE the group
      if (dateKey !== currentDateKey) {
        createSpacerRow(dateKey);
        currentDateKey = dateKey;
        groupIndex++;
      }

      const tr = fragment.appendChild(document.createElement("tr"));
      tr.className = `workout-same-day-log ${
        groupIndex % 2 === 0 ? "group-even" : "group-odd"
      }`;

      row.displayRow.forEach((cell, cellIndex) => {
        const td = tr.appendChild(document.createElement("td"));

        if (cellIndex === 0) {
          td.className = "workout-table-date-cell";
          td.textContent = cell;
        } else if (cellIndex === actionsColumnIndex) {
          td.className = "workout-table-actions-cell";
          TableActions.renderActionButtons(
            td,
            row.originalLog,
            plugin,
            onRefresh,
            signal,
          );
        } else if (cellIndex === volumeColumnIndex) {
          td.className = "workout-table-volume-cell";
          td.textContent = cell;
        } else if (cellIndex === protocolColumnIndex) {
          // Render protocol badge
          td.className = "workout-table-protocol-cell";
          this.renderProtocolBadge(td, cell, plugin);
        } else {
          td.textContent = cell;
        }
      });
    });

    tbody.appendChild(fragment);
  }

  /**
   * Renders a protocol badge in the given cell.
   * Delegates resolution to ProtocolResolver and renders via ProtocolBadge atom.
   * @param cell - The table cell to render the badge in
   * @param protocol - The protocol value to display
   * @param plugin - Plugin instance for accessing custom protocols
   */
  private static renderProtocolBadge(
    cell: HTMLElement,
    protocol: string,
    plugin?: WorkoutChartsPlugin,
  ): void {
    const config = ProtocolResolver.resolve(
      protocol,
      plugin?.settings?.customProtocols,
    );

    if (config) {
      ProtocolBadge.create(cell, {
        text: config.label,
        className: config.className,
        tooltip: config.tooltip,
        color: config.color,
      });
    }
  }
}
