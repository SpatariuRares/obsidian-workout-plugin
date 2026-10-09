import { WorkoutLogData } from "@app/types/WorkoutLogData";
import type { AppPort, SettingsPort } from "@app/types/PluginPorts";
import { MuscleTagMapper } from "@app/features/dashboard/widgets/muscle-heat-map/business/MuscleTagMapper";
import { DateUtils } from "@app/utils/DateUtils";
import type { BodyData } from "@app/features/dashboard/widgets/muscle-heat-map/body";
import type { HeatMapMetric } from "@app/features/dashboard/widgets/muscle-heat-map/types";

type MuscleDataContext = AppPort & SettingsPort;

export interface MuscleGroupData {
  name: string;
  /** Total of the selected heat map metric (volume by default) */
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
   * Calculate the maximum value across all body data fields.
   * Returns at least 1 to avoid division by zero.
   */
  static calculateMaxValue(bodyData: BodyData): number {
    const allValues = [
      bodyData.shoulders.frontLeft,
      bodyData.shoulders.frontRight,
      bodyData.shoulders.lateralLeft ?? 0,
      bodyData.shoulders.lateralRight ?? 0,
      bodyData.shoulders.rearLeft,
      bodyData.shoulders.rearRight,
      bodyData.chest.upper,
      bodyData.chest.middle,
      bodyData.chest.lower,
      bodyData.back.traps,
      bodyData.back.lats,
      bodyData.back.lowerBack,
      bodyData.back.trapsMiddle,
      bodyData.back.rhomboids ?? 0,
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
      bodyData.core.serratus ?? 0,
    ];

    return Math.max(...allValues, 1);
  }

  /**
   * Convert muscle group data to body visualization data structure
   */
  static createBodyDataFromMuscleData(
    muscleData: Map<string, MuscleGroupData>,
  ): BodyData {
    const getVolume = (muscleGroup: string): number => {
      return muscleData.get(muscleGroup)?.volume || 0;
    };

    const {
      BILATERAL_SPLIT,
      CHEST_UPPER,
      CHEST_MIDDLE,
      CHEST_LOWER,
      BACK_LOWER_RATIO,
      TRAPS_MIDDLE_RATIO,
      OBLIQUES_RATIO,
    } = VOLUME_DISTRIBUTION;

    // A generic shoulders tag lights the front and lateral deltoid
    const frontDelts = getVolume("shoulders") + getVolume("front_delts");
    const sideDelts = getVolume("shoulders") + getVolume("side_delts");
    const rearDelts = getVolume("rear_delts");

    const bodyData = {
      shoulders: {
        frontLeft: frontDelts * BILATERAL_SPLIT,
        frontRight: frontDelts * BILATERAL_SPLIT,
        lateralLeft: sideDelts * BILATERAL_SPLIT,
        lateralRight: sideDelts * BILATERAL_SPLIT,
        rearLeft: rearDelts * BILATERAL_SPLIT,
        rearRight: rearDelts * BILATERAL_SPLIT,
      },
      chest: {
        upper:
          getVolume("chest") * CHEST_UPPER + getVolume("upper_chest"),
        middle:
          getVolume("chest") * CHEST_MIDDLE + getVolume("mid_chest"),
        lower:
          getVolume("chest") * CHEST_LOWER + getVolume("lower_chest"),
      },
      back: {
        traps: getVolume("traps"),
        lats: getVolume("back") + getVolume("lats"),
        lowerBack:
          getVolume("back") * BACK_LOWER_RATIO + getVolume("lower_back"),
        trapsMiddle: getVolume("traps") * TRAPS_MIDDLE_RATIO,
        rhomboids: getVolume("rhomboids"),
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
        obliques: getVolume("core") * OBLIQUES_RATIO + getVolume("obliques"),
        serratus: getVolume("serratus"),
      },
    };

    return bodyData;
  }
}
