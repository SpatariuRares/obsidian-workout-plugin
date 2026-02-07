import { CONSTANTS } from "@app/constants";
import { TableRow, EmbeddedTableParams } from "@app/features/tables/types";
import { WorkoutLogData, WorkoutProtocol } from "@app/types/WorkoutLogData";
import type WorkoutChartsPlugin from "main";
import { DateUtils } from "@app/utils/DateUtils";
import { TableActions } from "@app/features/tables/components/TableActions";
import { TableErrorMessage } from "@app/features/tables/ui";
import { SpacerStat, ProtocolBadge } from "@app/components/atoms";

/**
 * Protocol display configuration for badges
 */
const PROTOCOL_DISPLAY: Record<string, { label: string; className: string }> = {
  [WorkoutProtocol.STANDARD]: { label: "", className: "" }, // No badge for standard
  [WorkoutProtocol.DROP_SET]: {
    label: "Drop",
    className: "workout-protocol-badge-drop",
  },
  [WorkoutProtocol.MYO_REPS]: {
    label: "Myo",
    className: "workout-protocol-badge-myo",
  },
  [WorkoutProtocol.REST_PAUSE]: {
    label: "RP",
    className: "workout-protocol-badge-rp",
  },
  [WorkoutProtocol.SUPERSET]: {
    label: "SS",
    className: "workout-protocol-badge-superset",
  },
  [WorkoutProtocol.TWENTYONE]: {
    label: "21s",
    className: "workout-protocol-badge-21",
  },
};

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

      const thead = table.appendChild(document.createElement("thead"));
      const headerRow = thead.appendChild(document.createElement("tr"));

      headers.forEach((header) => {
        const th = headerRow.appendChild(document.createElement("th"));
        th.textContent = header;
      });

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

      // Helper function to create spacer row with dynamic summary based on exercise type
      const createSpacerRow = (dateKey: string) => {
        const groupRows = groupedRows[dateKey];

        // Aggregate standard strength metrics
        let totalVolume = 0;
        let totalWeight = 0;
        let totalReps = 0;

        // Aggregate custom field metrics
        let totalDuration = 0;
        let totalDistance = 0;
        let totalHeartRate = 0;
        let heartRateCount = 0;

        // Track which metrics are present
        let hasStrengthData = false;
        let hasDuration = false;
        let hasDistance = false;
        let hasHeartRate = false;

        groupRows.forEach((r) => {
          const log = r.originalLog;
          if (!log) return;

          // Check standard strength fields
          if (log.reps > 0 || log.weight > 0) {
            hasStrengthData = true;
            totalVolume += log.volume || 0;
            totalWeight += log.weight || 0;
            totalReps += log.reps || 0;
          }

          // Check custom fields for other exercise types
          if (log.customFields) {
            const duration = log.customFields["duration"];
            if (typeof duration === "number" && duration > 0) {
              hasDuration = true;
              totalDuration += duration;
            }

            const distance = log.customFields["distance"];
            if (typeof distance === "number" && distance > 0) {
              hasDistance = true;
              totalDistance += distance;
            }

            const heartRate =
              log.customFields["heartrate"] || log.customFields["heartRate"];
            if (typeof heartRate === "number" && heartRate > 0) {
              hasHeartRate = true;
              totalHeartRate += heartRate;
              heartRateCount++;
            }
          }
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

        // Determine which summary to show based on available data
        // Using compact format: icon + value (mobile-friendly)
        // Priority: Strength > Cardio/Distance/Timed

        if (hasStrengthData) {
          // Strength exercise summary: Reps, Weight, Volume (compact)
          SpacerStat.create(summaryCell, {
            icon: CONSTANTS.WORKOUT.TABLE.ICONS.REPS,
            value: totalReps.toString(),
          });

          SpacerStat.create(summaryCell, {
            icon: CONSTANTS.WORKOUT.TABLE.ICONS.WEIGHT,
            value: `${totalWeight.toFixed(1)}kg`,
          });

          SpacerStat.create(summaryCell, {
            icon: CONSTANTS.WORKOUT.TABLE.ICONS.VOLUME,
            value: totalVolume.toFixed(0),
          });
        } else {
          // Non-strength exercise summary: show available metrics (compact)

          if (hasDuration) {
            // Format duration based on magnitude
            const durationDisplay =
              totalDuration >= 60
                ? `${Math.floor(totalDuration / 60)}m${Math.round(totalDuration % 60)}s`
                : `${Math.round(totalDuration)}s`;
            SpacerStat.create(summaryCell, {
              icon: CONSTANTS.WORKOUT.TABLE.ICONS.DURATION,
              value: durationDisplay,
            });
          }

          if (hasDistance) {
            SpacerStat.create(summaryCell, {
              icon: CONSTANTS.WORKOUT.TABLE.ICONS.DISTANCE,
              value: `${totalDistance.toFixed(2)}km`,
            });
          }

          if (hasHeartRate && heartRateCount > 0) {
            const avgHeartRate = Math.round(totalHeartRate / heartRateCount);
            SpacerStat.create(summaryCell, {
              icon: CONSTANTS.WORKOUT.TABLE.ICONS.HEART_RATE,
              value: `${avgHeartRate}bpm`,
            });
          }

          // If no metrics found at all, show a generic count
          if (!hasDuration && !hasDistance && !hasHeartRate) {
            SpacerStat.create(summaryCell, {
              value: `${groupRows.length} sets`,
            });
          }
        }
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
  private static renderProtocolBadge(
    cell: HTMLElement,
    protocol: string,
    plugin?: WorkoutChartsPlugin,
  ): void {
    // First check built-in protocols
    const builtInConfig = PROTOCOL_DISPLAY[protocol];

    if (builtInConfig) {
      // If it's standard (empty label), don't render a badge
      if (!builtInConfig.label) {
        return;
      }

      ProtocolBadge.create(cell, {
        text: builtInConfig.label,
        className: `workout-protocol-badge ${builtInConfig.className}`,
        tooltip: protocol.replace(/_/g, " "),
      });
      return;
    }

    // Check custom protocols from settings
    if (plugin?.settings?.customProtocols) {
      const customProtocol = plugin.settings.customProtocols.find(
        (p) => p.id === protocol,
      );

      if (customProtocol) {
        ProtocolBadge.create(cell, {
          text: customProtocol.abbreviation,
          className: "workout-protocol-badge workout-protocol-badge-custom",
          tooltip: customProtocol.name,
          color: customProtocol.color,
        });
      }
    }
  }
}
