import { WorkoutLogData } from "@app/types/WorkoutLogData";
import { EmbeddedTableParams } from "@app/types";
import type WorkoutChartsPlugin from "main";
import { TableCallbacks } from "@app/features/tables/types/TableTypes";

export class TableDataLoader {
  /**
   * Get optimized data for CSV mode with efficient filtering
   */
  static async getOptimizedCSVData(
    params: EmbeddedTableParams,
    plugin: WorkoutChartsPlugin,
    callbacks?: TableCallbacks
  ): Promise<WorkoutLogData[]> {
    const filterOptions: {
      exercise?: string;
      workout?: string;
      exactMatch?: boolean;
    } = {};

    if (params.exercise) {
      filterOptions.exercise = params.exercise;
      filterOptions.exactMatch = params.exactMatch;
    }

    if (params.workout) {
      filterOptions.workout = params.workout;
    }

    callbacks?.onDebug?.("TableDataLoader", "CSV optimized filtering", {
      filterOptions,
    });

    return await plugin.getWorkoutLogData(filterOptions);
  }

  /**
   * Load fresh workout data and clear cache
   */
  static async loadFreshData(
    plugin: WorkoutChartsPlugin,
    callbacks?: TableCallbacks
  ): Promise<WorkoutLogData[]> {
    try {
      // Clear cache to ensure fresh data
      plugin.clearLogDataCache();

      callbacks?.onDebug?.("TableDataLoader", "Loading fresh workout data");

      return await plugin.getWorkoutLogData();
    } catch (error) {
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      callbacks?.onError?.(errorObj, "loading fresh workout data");
      throw errorObj;
    }
  }

  /**
   * Check if data has changed
   */
  static hasDataChanged(
    currentData: WorkoutLogData[] | undefined,
    freshData: WorkoutLogData[]
  ): boolean {
    return !currentData || freshData.length !== currentData.length;
  }
}

