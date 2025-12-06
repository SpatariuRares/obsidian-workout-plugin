import { WorkoutLogData } from "@app/types/WorkoutLogData";
import type WorkoutChartsPlugin from "main";
import { MuscleTagMapper } from "@app/features/dashboard/business/muscleHeatMap";
import { DateUtils } from "@app/utils/DateUtils";
import type { BodyData } from "@app/features/dashboard/body";
import { TAG_MUSCLE_MAP } from "@app/constants";

export interface MuscleGroupData {
  name: string;
  volume: number;
  exercises: string[];
  intensity: number; // 0-1 scale for heat map coloring
}

/**
 * Handles data processing and calculations for muscle heat maps
 */
export class MuscleDataCalculator {
  /**
   * Filter workout data by time frame
   */
  static filterDataByTimeFrame(
    data: WorkoutLogData[],
    timeFrame: "week" | "month" | "year"
  ): WorkoutLogData[] {
    // Use DateUtils to filter by time frame
    return DateUtils.filterByTimeFrame(data, timeFrame);
  }

  /**
   * Calculate muscle group volumes from workout data
   */
  static async calculateMuscleGroupVolumes(
    data: WorkoutLogData[],
    plugin: WorkoutChartsPlugin
  ): Promise<Map<string, MuscleGroupData>> {
    const muscleData = new Map<string, MuscleGroupData>();

    // Initialize all muscle groups
    const allMuscleGroups = MuscleTagMapper.getAllMuscleGroups();
    allMuscleGroups.forEach((muscle) => {
      muscleData.set(muscle, {
        name: muscle,
        volume: 0,
        exercises: [],
        intensity: 0,
      });
    });

    // Calculate volumes
    for (const entry of data) {
      const mappedMuscles = await MuscleTagMapper.findMuscleGroupsFromTags(
        entry.exercise,
        plugin
      );

      mappedMuscles.forEach((muscle) => {
        const current = muscleData.get(muscle);
        if (current) {
          current.volume += entry.volume;
          if (!current.exercises.includes(entry.exercise)) {
            current.exercises.push(entry.exercise);
          }
        }
      });
    }

    // Calculate intensities (normalize to 0-1 scale)
    const maxVolume = Math.max(
      ...Array.from(muscleData.values()).map((m) => m.volume)
    );
    if (maxVolume > 0) {
      muscleData.forEach((muscle) => {
        muscle.intensity = muscle.volume / maxVolume;
      });
    }

    return muscleData;
  }

  /**
   * Convert muscle group data to body visualization data structure
   */
  static createBodyDataFromMuscleData(
    muscleData: Map<string, MuscleGroupData>
  ): BodyData {
    const getVolume = (muscleId: string): number => {
      return muscleData.get(muscleId)?.volume || 0;
    };

    const bodyData = {
      shoulders: {
        frontLeft: getVolume(TAG_MUSCLE_MAP.shoulders) * 0.5,
        frontRight: getVolume(TAG_MUSCLE_MAP.shoulders) * 0.5,
        rearLeft: getVolume(TAG_MUSCLE_MAP.rear_delts) * 0.5,
        rearRight: getVolume(TAG_MUSCLE_MAP.rear_delts) * 0.5,
      },
      chest: {
        upper: getVolume(TAG_MUSCLE_MAP.chest) * 0.4,
        middle: getVolume(TAG_MUSCLE_MAP.chest) * 0.4,
        lower: getVolume(TAG_MUSCLE_MAP.chest) * 0.2,
      },
      back: {
        traps: getVolume(TAG_MUSCLE_MAP.traps),
        lats: getVolume(TAG_MUSCLE_MAP.back),
        lowerBack: getVolume(TAG_MUSCLE_MAP.back) * 0.3,
        trapsMiddle: getVolume(TAG_MUSCLE_MAP.traps) * 0.5,
      },
      arms: {
        bicepsLeft: getVolume(TAG_MUSCLE_MAP.biceps) * 0.5,
        bicepsRight: getVolume(TAG_MUSCLE_MAP.biceps) * 0.5,
        tricepsLeft: getVolume(TAG_MUSCLE_MAP.triceps) * 0.5,
        tricepsRight: getVolume(TAG_MUSCLE_MAP.triceps) * 0.5,
        forearmsLeft: getVolume(TAG_MUSCLE_MAP.forearms) * 0.5,
        forearmsRight: getVolume(TAG_MUSCLE_MAP.forearms) * 0.5,
      },
      legs: {
        quadsLeft: getVolume(TAG_MUSCLE_MAP.legs) * 0.5,
        quadsRight: getVolume(TAG_MUSCLE_MAP.legs) * 0.5,
        hamstringsLeft: getVolume(TAG_MUSCLE_MAP.hamstrings) * 0.5,
        hamstringsRight: getVolume(TAG_MUSCLE_MAP.hamstrings) * 0.5,
        glutesLeft: getVolume(TAG_MUSCLE_MAP.glutes) * 0.5,
        glutesRight: getVolume(TAG_MUSCLE_MAP.glutes) * 0.5,
        calvesLeft: getVolume(TAG_MUSCLE_MAP.calves) * 0.5,
        calvesRight: getVolume(TAG_MUSCLE_MAP.calves) * 0.5,
      },
      core: {
        abs: getVolume(TAG_MUSCLE_MAP.abs),
        obliques: getVolume(TAG_MUSCLE_MAP.core) * 0.5,
      },
    };

    return bodyData;
  }
}

