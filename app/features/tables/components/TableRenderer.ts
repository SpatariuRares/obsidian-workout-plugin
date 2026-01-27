import { CONSTANTS } from "@app/constants/Constants";
import { TableRow, EmbeddedTableParams } from "@app/types";
import { WorkoutLogData, WorkoutProtocol } from "@app/types/WorkoutLogData";
import type WorkoutChartsPlugin from "main";
import { DateUtils } from "@app/utils/DateUtils";
import { TableActions } from "@app/features/tables/components/TableActions";
import { TableContainer, TableErrorMessage } from "@app/features/tables/ui";

/**
 * Protocol display configuration for badges
 */
const PROTOCOL_DISPLAY: Record<string, { label: string; className: string }> = {
  [WorkoutProtocol.STANDARD]: { label: "", className: "" }, // No badge for standard
  [WorkoutProtocol.DROP_SET]: { label: "Drop", className: "workout-protocol-badge-drop" },
  [WorkoutProtocol.MYO_REPS]: { label: "Myo", className: "workout-protocol-badge-myo" },
  [WorkoutProtocol.REST_PAUSE]: { label: "RP", className: "workout-protocol-badge-rp" },
  [WorkoutProtocol.SUPERSET]: { label: "SS", className: "workout-protocol-badge-superset" },
  [WorkoutProtocol.TWENTYONE]: { label: "21s", className: "workout-protocol-badge-21" },
};

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
    signal?: AbortSignal
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

      this.applyRowGroupingOptimized(tbody, rows, headers, plugin, onRefresh, signal);

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
    headers: string[],
    plugin?: WorkoutChartsPlugin,
    onRefresh?: () => void,
    signal?: AbortSignal
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

      // Find the protocol column index
      const protocolColumnIndex = headers.indexOf(CONSTANTS.WORKOUT.TABLE.COLUMNS.PROTOCOL);

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
            TableActions.renderActionButtons(td, row.originalLog, plugin, onRefresh, signal);
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
    } catch {
      // Silent error - grouping failed
    }
  }

  /**
   * Renders a protocol badge in the given cell.
   * Supports both built-in protocols and custom protocols from settings.
   * @param cell - The table cell to render the badge in
   * @param protocol - The protocol value to display
   * @param plugin - Plugin instance for accessing custom protocols
   */
  private static renderProtocolBadge(cell: HTMLElement, protocol: string, plugin?: WorkoutChartsPlugin): void {
    // First check built-in protocols
    const builtInConfig = PROTOCOL_DISPLAY[protocol];

    if (builtInConfig) {
      // If it's standard (empty label), don't render a badge
      if (!builtInConfig.label) {
        return;
      }

      const badge = cell.createEl("span", {
        cls: `workout-protocol-badge ${builtInConfig.className}`,
        text: builtInConfig.label,
      });
      badge.setAttribute("title", protocol.replace(/_/g, " "));
      return;
    }

    // Check custom protocols from settings
    if (plugin?.settings?.customProtocols) {
      const customProtocol = plugin.settings.customProtocols.find(
        (p) => p.id === protocol
      );

      if (customProtocol) {
        const badge = cell.createEl("span", {
          cls: "workout-protocol-badge workout-protocol-badge-custom",
          text: customProtocol.abbreviation,
        });
        badge.setAttribute("title", customProtocol.name);
        // Apply custom color as inline style
        badge.style.backgroundColor = customProtocol.color;
        // Calculate contrast color for text
        badge.style.color = this.getContrastColor(customProtocol.color);
      }
    }
  }

  /**
   * Calculates whether black or white text should be used based on background color.
   * Uses relative luminance formula for accessibility.
   * @param hexColor - Hex color string (e.g., "#ff0000")
   * @returns "black" or "white"
   */
  private static getContrastColor(hexColor: string): string {
    // Remove # if present
    const hex = hexColor.replace("#", "");

    // Parse RGB values
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Calculate relative luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    // Return black for light backgrounds, white for dark backgrounds
    return luminance > 0.5 ? "black" : "white";
  }
}
