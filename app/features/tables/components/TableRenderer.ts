import {
  TableRow,
  EmbeddedTableParams,
} from "@app/features/tables/types";
import { WorkoutLogData } from "@app/types/WorkoutLogData";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";
import { DateUtils } from "@app/utils/DateUtils";
import { TableActions } from "@app/features/tables/components/TableActions";
import {
  TableErrorMessage,
  TableHeader,
} from "@app/features/tables/ui";
import { SpacerStat, ProtocolBadge } from "@app/components/atoms";
import { SpacerRowCalculator } from "@app/features/tables/business/SpacerRowCalculator";
import { ProtocolResolver } from "@app/features/tables/business/ProtocolResolver";
import { CONSTANTS } from "@app/constants";

export class TableRenderer {
  /**
   * Creates a container for the table
   * @param contentDiv - The parent element to create the container in
   * @returns The table container element
   */
  static createTableContainer(contentDiv: HTMLElement): HTMLElement {
    return contentDiv.createEl("div", {
      cls: "workout-table-container",
    });
  }

  /**
   * Renders a table with the provided data
   * @param tableContainer - The container to render the table in
   * @param headers - Array of column headers
   * @param rows - Array of table rows
   * @param params - Table parameters
   * @param logs - Original log data objects
   * @param plugin - Plugin instance for operations
   * @param signal - AbortSignal for event listener cleanup
   * @returns True if rendering was successful, false otherwise
   */
  static renderTable(
    tableContainer: HTMLElement,
    headers: string[],
    rows: TableRow[],
    params: EmbeddedTableParams,
    logs?: WorkoutLogData[], // pass the original log objects
    plugin?: WorkoutPluginContext, // pass the plugin for file opening
    signal?: AbortSignal,
  ): boolean {
    try {
      const table = tableContainer.createEl("table", {
        cls: "workout-log-table",
      });

      TableHeader.render(table, headers);

      const tbody = table.createEl("tbody");

      this.applyRowGroupingOptimized(tbody, rows, headers, plugin, signal);

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
    headers: string[],
    plugin?: WorkoutPluginContext,
    signal?: AbortSignal,
  ): void {
    if (rows.length === 0) return;

    let currentDateKey = "";
    let groupIndex = 0;
    const columnCount = rows[0].displayRow.length;

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

      const spacerRow = tbody.createEl("tr", {
        cls: "workout-table-spacer",
      });

      // First cell: formatted date
      spacerRow.createEl("td", {
        cls: "workout-table-spacer-date-cell",
        text: DateUtils.toShortDate(groupRows[0].originalDate),
      });

      // Create summary cell for the remaining columns
      const summaryCell = spacerRow.createEl("td", {
        cls: "workout-table-spacer-summary-cell",
        attr: { colspan: (columnCount - 1).toString() },
      });

      spacerData.stats.forEach((stat) => {
        SpacerStat.create(summaryCell, stat);
      });
    };

    // Find column indices dynamically based on headers
    const protocolColumnIndex = headers.indexOf(
      CONSTANTS.WORKOUT.TABLE.COLUMNS.PROTOCOL.value,
    );
    const volumeColumnIndex = headers.indexOf(
      CONSTANTS.WORKOUT.TABLE.COLUMNS.VOLUME.value,
    );
    const actionsColumnIndex = headers.indexOf(
      CONSTANTS.WORKOUT.TABLE.COLUMNS.ACTIONS.value,
    );

    rows.forEach((row) => {
      const dateKey = row.dateKey;

      // New group - show spacer BEFORE the group
      if (dateKey !== currentDateKey) {
        createSpacerRow(dateKey);
        currentDateKey = dateKey;
        groupIndex++;
      }

      const tr = tbody.createEl("tr", {
        cls: `workout-same-day-log ${groupIndex % 2 === 0 ? "group-even" : "group-odd"}`,
      });

      row.displayRow.forEach((cell, cellIndex) => {
        if (cellIndex === 0) {
          tr.createEl("td", { cls: "workout-table-date-cell", text: cell });
        } else if (cellIndex === actionsColumnIndex) {
          const td = tr.createEl("td", { cls: "workout-table-actions-cell" });
          TableActions.renderActionButtons(td, row.originalLog, plugin, signal);
        } else if (cellIndex === volumeColumnIndex) {
          tr.createEl("td", { cls: "workout-table-volume-cell", text: cell });
        } else if (cellIndex === protocolColumnIndex) {
          const td = tr.createEl("td", { cls: "workout-table-protocol-cell" });
          this.renderProtocolBadge(td, cell, plugin);
        } else {
          tr.createEl("td", { text: cell });
        }
      });
    });
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
    plugin?: WorkoutPluginContext,
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
