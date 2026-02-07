import { WorkoutLogData } from "@app/types/WorkoutLogData";
import type WorkoutChartsPlugin from "main";
import { EmbeddedTableParams } from "@app/features/tables/types";

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
}
