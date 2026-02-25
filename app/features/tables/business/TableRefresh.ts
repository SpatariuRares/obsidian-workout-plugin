import { WorkoutLogData } from "@app/types/WorkoutLogData";
import type WorkoutChartsPlugin from "main";
import {
  TableCallbacks,
  EmbeddedTableParams,
} from "@app/features/tables/types";
import { t } from "@app/i18n";

export class TableRefresh {
  /**
   * Refresh table by clearing cache, loading fresh data, and re-rendering.
   * @param plugin - Plugin instance for data access
   * @param container - The HTML container to render into
   * @param params - Current table parameters
   * @param renderCallback - Function that renders the table with fresh data
   * @param callbacks - Optional callbacks for success/error reporting
   */
  static async refreshTable(
    plugin: WorkoutChartsPlugin,
    container: HTMLElement,
    params: EmbeddedTableParams,
    renderCallback: (
      _container: HTMLElement,
      _logData: WorkoutLogData[],
      _params: EmbeddedTableParams,
    ) => Promise<void>,
    callbacks?: TableCallbacks,
  ): Promise<void> {
    try {
      const freshLogData = await plugin.getWorkoutLogData();

      await renderCallback(container, freshLogData, params);

      callbacks?.onSuccess?.(t("table.refreshSuccess"));
    } catch (error) {
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      callbacks?.onError?.(errorObj, "refreshing table");
    }
  }
}
