import { CONSTANTS } from "@app/constants/Constants";
import { WorkoutLogData } from "@app/types/WorkoutLogData";
import { EmbeddedTableParams } from "@app/types";
import type WorkoutChartsPlugin from "main";
import { TableState, TableCallbacks } from "@app/types/TableTypes";
import { TableDataLoader } from "@app/features/tables/business/TableDataLoader";

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
      return;
    }

    try {

      const freshLogData = await TableDataLoader.loadFreshData(plugin, callbacks);

      if (TableDataLoader.hasDataChanged(state.currentLogData, freshLogData)) {

        state.currentLogData = freshLogData;
        await renderCallback(
          state.currentContainer,
          freshLogData,
          state.currentParams
        );

        callbacks?.onSuccess?.(CONSTANTS.WORKOUT.TABLE.MESSAGES.REFRESH_SUCCESS);
      }
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      // Silent error - table refresh failed
      callbacks?.onError?.(errorObj, "refreshing table");

      // Fallback to current data if available
      if (state.currentLogData && state.currentContainer && state.currentParams) {
        await renderCallback(
          state.currentContainer,
          state.currentLogData,
          state.currentParams
        );
      }
    }
  }
}

