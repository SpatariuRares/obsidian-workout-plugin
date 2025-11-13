import { WorkoutLogData } from "@app/types/WorkoutLogData";
import { EmbeddedTableParams } from "@app/types";
import type WorkoutChartsPlugin from "main";
import { TableState, TableCallbacks } from "@app/components/table/TableTypes";
import { TableDataLoader } from "@app/components/table/TableDataLoader";
import { TABLE_MESSAGES } from "@app/constants/TableConstats";

export class TableRefresh {
  /**
   * Refresh table data and re-render if necessary
   */
  static async refreshTable(
    state: TableState,
    plugin: WorkoutChartsPlugin,
    renderCallback: (_container: HTMLElement, _logData: WorkoutLogData[], _params: EmbeddedTableParams) => Promise<void>,
    callbacks?: TableCallbacks
  ): Promise<void> {
    if (!state.currentContainer || !state.currentParams) {
      callbacks?.onDebug?.("TableRefresh", "Cannot refresh - missing container or params");
      return;
    }

    try {
      callbacks?.onDebug?.("TableRefresh", "Starting table refresh");

      const freshLogData = await TableDataLoader.loadFreshData(plugin, callbacks);

      if (TableDataLoader.hasDataChanged(state.currentLogData, freshLogData)) {
        callbacks?.onDebug?.("TableRefresh", "Data changed, re-rendering table", {
          oldLength: state.currentLogData?.length,
          newLength: freshLogData.length,
        });

        state.currentLogData = freshLogData;
        await renderCallback(
          state.currentContainer,
          freshLogData,
          state.currentParams
        );

        callbacks?.onSuccess?.(TABLE_MESSAGES.REFRESH_SUCCESS);
      } else {
        callbacks?.onDebug?.("TableRefresh", "No data changes detected, skipping refresh");
      }
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      // Silent error - table refresh failed
      callbacks?.onError?.(errorObj, "refreshing table");

      // Fallback to current data if available
      if (state.currentLogData && state.currentContainer && state.currentParams) {
        callbacks?.onDebug?.("TableRefresh", "Using fallback data after error");
        await renderCallback(
          state.currentContainer,
          state.currentLogData,
          state.currentParams
        );
      }
    }
  }
}