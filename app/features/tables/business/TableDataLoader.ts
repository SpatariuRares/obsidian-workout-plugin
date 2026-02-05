import { WorkoutLogData } from "@app/types/WorkoutLogData";
import type WorkoutChartsPlugin from "main";
import { TableCallbacks, EmbeddedTableParams } from "@app/features/tables/types";

export class TableDataLoader {
  /**
   * Get optimized data for CSV mode with efficient filtering
   */
  static async getOptimizedCSVData(
    params: EmbeddedTableParams,
    plugin: WorkoutChartsPlugin,
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

