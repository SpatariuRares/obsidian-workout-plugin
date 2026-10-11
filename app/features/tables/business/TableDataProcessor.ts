import { WorkoutLogData } from "@app/types/WorkoutLogData";
import {
  EmbeddedTableParams,
  TableData,
  TableRow,
} from "@app/features/tables/types";
import {
  durationSeconds,
  fieldKey,
} from "@app/services/exercise/ExerciseFields";
import type { ExerciseDefinitionPort } from "@app/types/PluginPorts";
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
    plugin?: ExerciseDefinitionPort,
  ): Promise<TableData> {
    // Determine if we're showing all logs (no exercise filter)
    const isShowingAllLogs = !params.exercise;
    const limit = params.limit || 50;

    // Sort and limit already-filtered data, then check optional columns in visible rows only
    const sortedAndLimitedData = TableRowProcessor.sortAndLimitData(
      logData,
      limit,
      params.sortBy,
      params.sortOrder,
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
    const defaultVisibleColumns =
      TableColumnResolver.getDefaultColumns(
        isShowingAllLogs,
        showDuration,
        showDistance,
        showHeartRate,
      );

    // Check if notes/protocol columns should be shown (based on visible data)
    const showNotes = TableDataCheckers.hasNotes(
      sortedAndLimitedData,
    );
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
    const rows = TableRowProcessor.processRows(
      sortedAndLimitedData,
      headers,
    );
    await this.addDurationSeconds(rows, plugin);

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
   * Each row's duration in seconds, read in the unit of its exercise's
   * `duration` field (minutes for cardio and distance, seconds for timed).
   */
  private static async addDurationSeconds(
    rows: TableRow[],
    plugin: ExerciseDefinitionPort | undefined,
  ): Promise<void> {
    const units = new Map<string, string | undefined>();
    for (const row of rows) {
      const log = row.originalLog;
      const duration = log?.customFields?.duration;
      if (!log || typeof duration !== "number") continue;
      if (!units.has(log.exercise)) {
        const params = await plugin
          ?.getExerciseDefinitionService()
          ?.getParametersForExercise(log.exercise)
          .catch(() => undefined);
        units.set(
          log.exercise,
          params?.find((p) => fieldKey(p.key) === fieldKey("duration"))?.unit,
        );
      }
      row.durationSeconds = durationSeconds(units.get(log.exercise), duration);
    }
  }

  /**
   * Resolves the final column headers based on priority:
   * 1. Explicit columns parameter (highest priority - user override)
   * 2. Dynamic columns from exercise type (if single exercise filter)
   * 3. Default columns (backward compatible)
   */
  private static async resolveHeaders(
    params: EmbeddedTableParams,
    plugin: ExerciseDefinitionPort | undefined,
    defaultVisibleColumns: string[],
    showNotes: boolean,
    showProtocol: boolean,
  ): Promise<string[]> {
    // Priority 1: Explicit columns parameter (highest priority - user override)
    if (params.columns) {
      if (Array.isArray(params.columns)) {
        return TableColumnResolver.addOptionalColumns(
          TableColumnResolver.userColumns(params.columns),
          showNotes,
          showProtocol,
        );
      } else if (typeof params.columns === "string") {
        try {
          const parsedColumns: unknown = JSON.parse(params.columns);
          if (!Array.isArray(parsedColumns)) throw new Error();
          return TableColumnResolver.addOptionalColumns(
            TableColumnResolver.userColumns(parsedColumns.map(String)),
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
