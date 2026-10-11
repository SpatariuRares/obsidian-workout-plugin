import { WorkoutLogData } from "@app/types/WorkoutLogData";
import type { MuscleTagService } from "@app/services/exercise/MuscleTagService";
import { CANONICAL_MUSCLE_GROUPS } from "@app/constants/muscles.constants";
import { DateUtils } from "@app/utils/DateUtils";
import {
  calculateZoneValues,
  type ZoneValues,
} from "@app/features/dashboard/widgets/muscle-heat-map/body/zones";
import type { HeatMapMetric } from "@app/features/dashboard/widgets/muscle-heat-map/types";

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
  constructor(
    private muscleTags: Pick<MuscleTagService, "musclesForExercise">,
  ) {}

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
    metric: HeatMapMetric = "volume",
  ): Promise<Map<string, MuscleGroupData>> {
    const muscleData = new Map<string, MuscleGroupData>();

    for (const muscle of CANONICAL_MUSCLE_GROUPS) {
      muscleData.set(muscle, {
        name: muscle,
        volume: 0,
        exercises: [],
        intensity: 0,
      });
    }

    // One lookup per exercise, not per logged set
    const musclesByExercise = new Map<string, string[]>();
    for (const entry of data) {
      const value = MuscleDataCalculator.getMetricValue(entry, metric);
      let mappedMuscles = musclesByExercise.get(entry.exercise);
      if (!mappedMuscles) {
        mappedMuscles = await this.muscleTags.musclesForExercise(
          entry.exercise,
        );
        musclesByExercise.set(entry.exercise, mappedMuscles);
      }

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
