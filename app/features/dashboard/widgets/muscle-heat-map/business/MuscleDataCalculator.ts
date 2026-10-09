import { WorkoutLogData } from "@app/types/WorkoutLogData";
import type { AppPort, SettingsPort } from "@app/types/PluginPorts";
import { MuscleTagMapper } from "@app/features/dashboard/widgets/muscle-heat-map/business/MuscleTagMapper";
import { DateUtils } from "@app/utils/DateUtils";
import {
  calculateZoneValues,
  type ZoneValues,
} from "@app/features/dashboard/widgets/muscle-heat-map/body/zones";
import type { HeatMapMetric } from "@app/features/dashboard/widgets/muscle-heat-map/types";

type MuscleDataContext = AppPort & SettingsPort;

export interface MuscleGroupData {
  name: string;
  /** Total of the selected heat map metric (volume by default) */
  volume: number;
  exercises: string[];
  intensity: number; // 0-1 scale for heat map coloring
}


/**
 * Handles data processing and calculations for muscle heat maps
 */
export class MuscleDataCalculator {
  private tagMapper: MuscleTagMapper;

  constructor(tagMapper: MuscleTagMapper) {
    this.tagMapper = tagMapper;
  }

  /**
   * Filter workout data by time frame
   */
  static filterDataByTimeFrame(
    data: WorkoutLogData[],
    timeFrame: "week" | "month" | "year",
  ): WorkoutLogData[] {
    // Use DateUtils to filter by time frame
    return DateUtils.filterByTimeFrame(data, timeFrame);
  }

  /**
   * Value one log entry contributes to its muscles for the given metric
   */
  static getMetricValue(
    entry: WorkoutLogData,
    metric: HeatMapMetric,
  ): number {
    switch (metric) {
      case "sets":
        return 1;
      case "reps":
        return entry.reps || 0;
      default:
        return entry.volume || 0;
    }
  }

  /**
   * Calculate per-muscle totals of the selected metric from workout data
   */
  async calculateMuscleGroupVolumes(
    data: WorkoutLogData[],
    plugin: MuscleDataContext,
    metric: HeatMapMetric = "volume",
  ): Promise<Map<string, MuscleGroupData>> {
    const muscleData = new Map<string, MuscleGroupData>();

    // Initialize all muscle groups
    const allMuscleGroups = this.tagMapper.getAllMuscleGroups();
    allMuscleGroups.forEach((muscle) => {
      muscleData.set(muscle, {
        name: muscle,
        volume: 0,
        exercises: [],
        intensity: 0,
      });
    });

    for (const entry of data) {
      const value = MuscleDataCalculator.getMetricValue(entry, metric);
      const mappedMuscles =
        await this.tagMapper.findMuscleGroupsFromTags(
          entry.exercise,
          plugin,
        );

      mappedMuscles.forEach((muscle) => {
        const current = muscleData.get(muscle);
        if (current) {
          current.volume += value;
          if (!current.exercises.includes(entry.exercise)) {
            current.exercises.push(entry.exercise);
          }
        }
      });
    }

    // Calculate intensities (normalize to 0-1 scale)
    const maxVolume = Math.max(
      ...Array.from(muscleData.values()).map((m) => m.volume),
    );
    if (maxVolume > 0) {
      muscleData.forEach((muscle) => {
        muscle.intensity = muscle.volume / maxVolume;
      });
    }

    return muscleData;
  }

  /**
   * Value of every heat map zone (see HEAT_MAP_ZONES) for these totals
   */
  static calculateZoneValues(
    muscleData: Map<string, MuscleGroupData>,
  ): ZoneValues {
    return calculateZoneValues(
      (group) => muscleData.get(group)?.volume || 0,
    );
  }
}
