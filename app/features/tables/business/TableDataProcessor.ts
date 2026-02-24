import { CONSTANTS } from "@app/constants";
import { WorkoutLogData } from "@app/types/WorkoutLogData";
import { EmbeddedTableParams, TableData } from "@app/features/tables/types";
import type WorkoutChartsPlugin from "main";
import { TableDataCheckers } from "@app/features/tables/business/TableDataCheckers";
import { TableColumnResolver } from "@app/features/tables/business/TableColumnResolver";
import { TableRowProcessor } from "@app/features/tables/business/TableRowProcessor";
import { t } from "@app/i18n";

/**
 * Orchestrates the processing of workout log data for table display.
 * Delegates specific responsibilities to specialized classes:
 * - TableDataCheckers: Checks for presence of optional data fields
 * - TableColumnResolver: Determines and formats column headers
 * - TableRowProcessor: Processes and formats table rows
 */
export class TableDataProcessor {
  /**
   * Processes workout log data into a format suitable for table display.
   * @param logData - Array of workout log data to process
   * @param params - Table parameters including columns, limit, and display options
   * @param plugin - Optional plugin instance for accessing exercise definitions
   * @returns Processed table data with headers, rows, and metadata
   */
  static async processTableData(
    logData: WorkoutLogData[],
    params: EmbeddedTableParams,
    plugin?: WorkoutChartsPlugin,
  ): Promise<TableData> {
    // Determine if we're showing all logs (no exercise filter)
    const isShowingAllLogs = !params.exercise;
    const limit = params.limit || 50;

    // Sort and limit data FIRST, then check for optional columns in visible rows only
    const sortedAndLimitedData = TableRowProcessor.sortAndLimitData(
      logData,
      limit,
    );

    // Check which optional data columns should be shown (based on visible data)
    const showDuration = TableDataCheckers.hasCustomField(
      sortedAndLimitedData,
      "duration",
    );
    const showDistance = TableDataCheckers.hasCustomField(
      sortedAndLimitedData,
      "distance",
    );
    const showHeartRate = TableDataCheckers.hasCustomField(
      sortedAndLimitedData,
      "heartRate",
    );

    // Get default columns based on mode
    const defaultVisibleColumns = TableColumnResolver.getDefaultColumns(
      isShowingAllLogs,
      showDuration,
      showDistance,
      showHeartRate,
    );

    // Check if notes/protocol columns should be shown (based on visible data)
    const showNotes = TableDataCheckers.hasNotes(sortedAndLimitedData);
    const showProtocol =
      params.showProtocol !== false &&
      TableDataCheckers.hasNonStandardProtocol(sortedAndLimitedData);

    // Determine final headers
    const headers = await this.resolveHeaders(
      params,
      plugin,
      defaultVisibleColumns,
      showNotes,
      showProtocol,
    );

    // Process rows with determined headers
    const rows = TableRowProcessor.processRows(sortedAndLimitedData, headers);

    return {
      headers,
      rows,
      totalRows: sortedAndLimitedData.length,
      filterResult: {
        filteredData: sortedAndLimitedData,
        filterMethodUsed: "table processing",
        titlePrefix: t("general.workoutLog"),
      },
      params,
    };
  }

  /**
   * Resolves the final column headers based on priority:
   * 1. Explicit columns parameter (highest priority - user override)
   * 2. Dynamic columns from exercise type (if single exercise filter)
   * 3. Default columns (backward compatible)
   */
  private static async resolveHeaders(
    params: EmbeddedTableParams,
    plugin: WorkoutChartsPlugin | undefined,
    defaultVisibleColumns: string[],
    showNotes: boolean,
    showProtocol: boolean,
  ): Promise<string[]> {
    // Priority 1: Explicit columns parameter (highest priority - user override)
    if (params.columns) {
      if (Array.isArray(params.columns)) {
        return TableColumnResolver.addOptionalColumns(
          params.columns,
          showNotes,
          showProtocol,
        );
      } else if (typeof params.columns === "string") {
        try {
          const parsedColumns = JSON.parse(params.columns);
          return TableColumnResolver.addOptionalColumns(
            parsedColumns,
            showNotes,
            showProtocol,
          );
        } catch {
          // Invalid columns parameter, fall through to default
        }
      }
    }

    // Priority 2: Dynamic columns from exercise type (if single exercise filter)
    if (params.exercise && plugin) {
      const dynamicHeaders =
        await TableColumnResolver.determineColumnsForExercise(
          params.exercise,
          plugin,
        );
      if (dynamicHeaders && dynamicHeaders.length > 0) {
        return TableColumnResolver.addOptionalColumns(
          dynamicHeaders,
          showNotes,
          showProtocol,
        );
      }
    }

    // Priority 3: Default columns (backward compatible)
    return TableColumnResolver.addOptionalColumns(
      defaultVisibleColumns,
      showNotes,
      showProtocol,
    );
  }
}
