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
import { ProtocolCatalog } from "@app/services/protocols/ProtocolCatalog";
import { CONSTANTS } from "@app/constants";
import { DomUtils } from "@app/utils/DomUtils";
import { t } from "@app/i18n";

/** The class of a column that holds a set's value (reps, weight, a field) */
const VALUE_CELL = "workout-table-value-cell";

/** Columns that are not a number of the set: on phones they leave its row */
const OFF_THE_NUMBERS_ROW = new Set([
  "workout-table-date-cell",
  "workout-table-actions-cell",
  "workout-table-protocol-cell",
  "workout-table-notes-cell",
  "workout-table-exercise-cell",
]);

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

      const columns = this.columnClasses(headers);
      // Phones: each set is a grid row: the time, one track per number
      // (values and volume), the edit button
      DomUtils.setCssProps(table, {
        "--workout-log-fields": String(
          Math.max(columns.filter((cls) => !OFF_THE_NUMBERS_ROW.has(cls)).length, 1),
        ),
      });

      TableHeader.render(table, headers, columns);

      const tbody = table.createEl("tbody");

      this.applyRowGroupingOptimized(tbody, rows, headers, columns, plugin, signal);

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
   * Each column's cell class, the same in the header and the rows: the time,
   * the actions, the cells phones move off the row of numbers (exercise,
   * protocol, notes) and the volume; every other column is a value.
   */
  private static columnClasses(headers: string[]): string[] {
    const COLUMNS = CONSTANTS.WORKOUT.TABLE.COLUMNS;
    const special = new Map<string, string>([
      [fieldKey(COLUMNS.ACTIONS.value), "workout-table-actions-cell"],
      [fieldKey(COLUMNS.VOLUME.value), "workout-table-volume-cell"],
      [fieldKey(COLUMNS.PROTOCOL.value), "workout-table-protocol-cell"],
      [fieldKey(COLUMNS.NOTES.value), "workout-table-notes-cell"],
      [fieldKey(COLUMNS.EXERCISE.value), "workout-table-exercise-cell"],
    ]);
    return headers.map((header, index) =>
      index === 0
        ? "workout-table-date-cell"
        : (special.get(fieldKey(header)) ?? VALUE_CELL),
    );
  }

  /**
   * Optimized row grouping with better performance
   */
  private static applyRowGroupingOptimized(
    tbody: HTMLElement,
    rows: TableRow[],
    headers: string[],
    columns: string[],
    plugin?: WorkoutPluginContext,
    signal?: AbortSignal,
  ): void {
    if (rows.length === 0) return;

    let currentDateKey = "";
    // Every row of a day (its line included) shares one shade, alternating
    // between days, so a day's sets read as one group
    let dayClass = "workout-table-day-even";
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
        cls: `workout-table-spacer ${dayClass}`,
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

    const protocolColumnIndex = columns.indexOf("workout-table-protocol-cell");
    const notAvailable = t("table.notAvailable");

    const protocols = new ProtocolCatalog(plugin?.settings?.customProtocols);

    rows.forEach((row) => {
      const dateKey = row.dateKey;
      const cellAt = (index: number) =>
        index >= 0 ? (row.displayRow[index] ?? "") : "";
      const protocol = protocols.resolve(cellAt(protocolColumnIndex));

      // New group - show spacer BEFORE the group
      if (dateKey !== currentDateKey) {
        dayClass =
          dayClass === "workout-table-day-even" ? "workout-table-day-odd" : "workout-table-day-even";
        createSpacerRow(dateKey);
        currentDateKey = dateKey;
      }

      const tr = tbody.createEl("tr", { cls: `workout-same-day-log ${dayClass}` });

      row.displayRow.forEach((cell, cellIndex) => {
        const cls = columns[cellIndex] ?? VALUE_CELL;
        if (cls === "workout-table-actions-cell") {
          const td = tr.createEl("td", { cls });
          TableActions.renderActionButtons(td, row.originalLog, plugin, signal);
        } else if (cls === "workout-table-protocol-cell") {
          ProtocolBadge.forProtocol(tr.createEl("td", { cls }), protocol);
        } else {
          // A value the set does not have (duration of a strength set) is muted
          tr.createEl("td", {
            cls: cell === notAvailable ? `${cls} workout-table-na-cell` : cls,
            text: cell,
          });
        }
      });
    });
  }
}
