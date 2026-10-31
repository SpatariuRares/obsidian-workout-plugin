import { fieldKey } from "@app/services/exercise/ExerciseFields";
import {
  TableRow,
  EmbeddedTableParams,
} from "@app/features/tables/types";
import { WorkoutLogData } from "@app/types/WorkoutLogData";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";
import { DateUtils } from "@app/utils/DateUtils";
import { TableActions } from "@app/features/tables/components/TableActions";
import { TableErrorMessage } from "@app/features/tables/ui/TableErrorMessage";
import { TableHeader } from "@app/features/tables/ui/TableHeader";
import { SpacerStat, ProtocolBadge } from "@app/components/atoms";
import { SpacerRowCalculator } from "@app/features/tables/business/SpacerRowCalculator";
import {
  ProtocolCatalog,
  type ProtocolInfo,
} from "@app/services/protocols/ProtocolCatalog";
import { CONSTANTS, mapColumnIdentifiersToLabels } from "@app/constants";

export class TableRenderer {
  /**
   * Creates a container for the table
   * @param contentDiv - The parent element to create the container in
   * @returns The table container element
   */
  static createTableContainer(contentDiv: HTMLElement): HTMLElement {
    return contentDiv.createDiv({
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

    // Find the special columns by field key, however their header is written
    const COLUMNS = CONSTANTS.WORKOUT.TABLE.COLUMNS;
    const columnOf = (column: { value: string }) =>
      headers.findIndex(
        (header) => fieldKey(header) === fieldKey(column.value),
      );
    const protocolColumnIndex = columnOf(COLUMNS.PROTOCOL);
    const volumeColumnIndex = columnOf(COLUMNS.VOLUME);
    const actionsColumnIndex = columnOf(COLUMNS.ACTIONS);
    const notesColumnIndex = columnOf(COLUMNS.NOTES);
    // On phones the header row is hidden and each row becomes a card, so
    // value cells carry their column name (rendered via CSS attr())
    const columnLabels = mapColumnIdentifiersToLabels(headers);
    const labelAttr = (cellIndex: number) => ({
      "data-label": columnLabels[cellIndex] ?? "",
    });

    const protocols = new ProtocolCatalog(plugin?.settings?.customProtocols);

    rows.forEach((row) => {
      const dateKey = row.dateKey;
      const cellAt = (index: number) =>
        index >= 0 ? (row.displayRow[index] ?? "") : "";
      const protocol = protocols.resolve(cellAt(protocolColumnIndex));

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
          tr.createEl("td", {
            cls: "workout-table-volume-cell",
            text: cell,
            attr: labelAttr(cellIndex),
          });
        } else if (cellIndex === protocolColumnIndex) {
          const td = tr.createEl("td", { cls: "workout-table-protocol-cell" });
          this.renderProtocolBadge(td, protocol);
        } else if (cellIndex === notesColumnIndex) {
          tr.createEl("td", {
            cls: "workout-table-notes-cell",
            text: cell,
            attr: labelAttr(cellIndex),
          });
        } else {
          tr.createEl("td", { text: cell, attr: labelAttr(cellIndex) });
        }
      });

      // On phones notes and the protocol badge go on a second line; the
      // class tells CSS which rows need that line break
      const hasBadge =
        protocolColumnIndex >= 0 && protocol.abbreviation !== "";
      const hasDetails = cellAt(notesColumnIndex) !== "" || hasBadge;
      tr.classList.toggle("workout-table-row-with-details", hasDetails);
    });
  }

  /**
   * Renders a protocol badge in the given cell.
   * Name, abbreviation and color come from ProtocolCatalog.
   * @param cell - The table cell to render the badge in
   * @param info - The row's protocol, resolved by ProtocolCatalog
   */
  private static renderProtocolBadge(
    cell: HTMLElement,
    info: ProtocolInfo,
  ): void {
    // Standard sets have no abbreviation, so no badge
    if (info.abbreviation) {
      ProtocolBadge.create(cell, {
        text: info.abbreviation,
        className: `workout-protocol-badge ${info.badgeClass}`,
        tooltip: info.name,
        color: info.badgeColor,
      });
    }
  }
}
