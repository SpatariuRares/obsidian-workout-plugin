import { WorkoutLogData } from "../../../types/WorkoutLogData";
import type WorkoutChartsPlugin from "../../../../main";
import type { BodyData } from "../body";
import { MuscleTagMapper } from "./MuscleTagMapper";
import { DateUtils } from "../../../utils/DateUtils";

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
        frontLeft: getVolume("shoulders") * 0.5,
        frontRight: getVolume("shoulders") * 0.5,
        rearLeft: getVolume("rear_delts") * 0.5,
        rearRight: getVolume("rear_delts") * 0.5,
      },
      chest: {
        upper: getVolume("chest") * 0.4,
        middle: getVolume("chest") * 0.4,
        lower: getVolume("chest") * 0.2,
      },
      back: {
        traps: getVolume("traps"),
        lats: getVolume("back"),
        lowerBack: getVolume("back") * 0.3,
        trapsMiddle: getVolume("traps") * 0.5,
      },
      arms: {
        bicepsLeft: getVolume("biceps") * 0.5,
        bicepsRight: getVolume("biceps") * 0.5,
        tricepsLeft: getVolume("triceps") * 0.5,
        tricepsRight: getVolume("triceps") * 0.5,
        forearmsLeft: getVolume("forearms") * 0.5,
        forearmsRight: getVolume("forearms") * 0.5,
      },
      legs: {
        quadsLeft: getVolume("quads") * 0.5,
        quadsRight: getVolume("quads") * 0.5,
        hamstringsLeft: getVolume("hamstrings") * 0.5,
        hamstringsRight: getVolume("hamstrings") * 0.5,
        glutesLeft: getVolume("glutes") * 0.5,
        glutesRight: getVolume("glutes") * 0.5,
        calvesLeft: getVolume("calves") * 0.5,
        calvesRight: getVolume("calves") * 0.5,
      },
      core: {
        abs: getVolume("abs"),
        obliques: getVolume("core") * 0.5,
      },
    };

    return bodyData;
  }
}
