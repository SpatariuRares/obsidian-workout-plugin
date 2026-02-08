import { WorkoutLogData } from "@app/types/WorkoutLogData";
import type WorkoutChartsPlugin from "main";
import { MuscleTagMapper } from "@app/features/dashboard/widgets/muscle-heat-map/business/MuscleTagMapper";
import { DateUtils } from "@app/utils/DateUtils";
import type { BodyData } from "@app/features/dashboard/widgets/muscle-heat-map/body";

export interface MuscleGroupData {
  name: string;
  volume: number;
  exercises: string[];
  intensity: number; // 0-1 scale for heat map coloring
}

const VOLUME_DISTRIBUTION = {
  BILATERAL_SPLIT: 0.5,
  CHEST_UPPER: 0.4,
  CHEST_MIDDLE: 0.4,
  CHEST_LOWER: 0.2,
  BACK_LOWER_RATIO: 0.3,
  TRAPS_MIDDLE_RATIO: 0.5,
  OBLIQUES_RATIO: 0.5,
} as const;

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
    timeFrame: "week" | "month" | "year"
  ): WorkoutLogData[] {
    // Use DateUtils to filter by time frame
    return DateUtils.filterByTimeFrame(data, timeFrame);
  }

  /**
   * Calculate muscle group volumes from workout data
   */
  async calculateMuscleGroupVolumes(
    data: WorkoutLogData[],
    plugin: WorkoutChartsPlugin
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

    // Calculate volumes
    for (const entry of data) {
      const mappedMuscles = await this.tagMapper.findMuscleGroupsFromTags(
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
   * Calculate the maximum value across all body data fields.
   * Returns at least 1 to avoid division by zero.
   */
  static calculateMaxValue(bodyData: BodyData): number {
    const allValues = [
      bodyData.shoulders.frontLeft,
      bodyData.shoulders.frontRight,
      bodyData.shoulders.rearLeft,
      bodyData.shoulders.rearRight,
      bodyData.chest.upper,
      bodyData.chest.middle,
      bodyData.chest.lower,
      bodyData.back.traps,
      bodyData.back.lats,
      bodyData.back.lowerBack,
      bodyData.back.trapsMiddle,
      bodyData.arms.bicepsLeft,
      bodyData.arms.bicepsRight,
      bodyData.arms.tricepsLeft,
      bodyData.arms.tricepsRight,
      bodyData.arms.forearmsLeft,
      bodyData.arms.forearmsRight,
      bodyData.legs.quadsLeft,
      bodyData.legs.quadsRight,
      bodyData.legs.hamstringsLeft,
      bodyData.legs.hamstringsRight,
      bodyData.legs.glutesLeft,
      bodyData.legs.glutesRight,
      bodyData.legs.calvesLeft,
      bodyData.legs.calvesRight,
      bodyData.core.abs,
      bodyData.core.obliques,
    ];

    return Math.max(...allValues, 1);
  }

  /**
   * Convert muscle group data to body visualization data structure
   */
  static createBodyDataFromMuscleData(
    muscleData: Map<string, MuscleGroupData>
  ): BodyData {
    const getVolume = (muscleGroup: string): number => {
      return muscleData.get(muscleGroup)?.volume || 0;
    };

    const { BILATERAL_SPLIT, CHEST_UPPER, CHEST_MIDDLE, CHEST_LOWER, BACK_LOWER_RATIO, TRAPS_MIDDLE_RATIO, OBLIQUES_RATIO } = VOLUME_DISTRIBUTION;

    const bodyData = {
      shoulders: {
        frontLeft: getVolume("shoulders") * BILATERAL_SPLIT,
        frontRight: getVolume("shoulders") * BILATERAL_SPLIT,
        rearLeft: getVolume("rear_delts") * BILATERAL_SPLIT,
        rearRight: getVolume("rear_delts") * BILATERAL_SPLIT,
      },
      chest: {
        upper: getVolume("chest") * CHEST_UPPER,
        middle: getVolume("chest") * CHEST_MIDDLE,
        lower: getVolume("chest") * CHEST_LOWER,
      },
      back: {
        traps: getVolume("traps"),
        lats: getVolume("back"),
        lowerBack: getVolume("back") * BACK_LOWER_RATIO,
        trapsMiddle: getVolume("traps") * TRAPS_MIDDLE_RATIO,
      },
      arms: {
        bicepsLeft: getVolume("biceps") * BILATERAL_SPLIT,
        bicepsRight: getVolume("biceps") * BILATERAL_SPLIT,
        tricepsLeft: getVolume("triceps") * BILATERAL_SPLIT,
        tricepsRight: getVolume("triceps") * BILATERAL_SPLIT,
        forearmsLeft: getVolume("forearms") * BILATERAL_SPLIT,
        forearmsRight: getVolume("forearms") * BILATERAL_SPLIT,
      },
      legs: {
        quadsLeft: getVolume("quads") * BILATERAL_SPLIT,
        quadsRight: getVolume("quads") * BILATERAL_SPLIT,
        hamstringsLeft: getVolume("hamstrings") * BILATERAL_SPLIT,
        hamstringsRight: getVolume("hamstrings") * BILATERAL_SPLIT,
        glutesLeft: getVolume("glutes") * BILATERAL_SPLIT,
        glutesRight: getVolume("glutes") * BILATERAL_SPLIT,
        calvesLeft: getVolume("calves") * BILATERAL_SPLIT,
        calvesRight: getVolume("calves") * BILATERAL_SPLIT,
      },
      core: {
        abs: getVolume("abs"),
        obliques: getVolume("core") * OBLIQUES_RATIO,
      },
    };

    return bodyData;
  }
}
