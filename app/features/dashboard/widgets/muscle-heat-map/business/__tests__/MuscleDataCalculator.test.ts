import { MuscleDataCalculator } from "@app/features/dashboard/widgets/muscle-heat-map/business/MuscleDataCalculator";
import type { MuscleTagMapper } from "@app/features/dashboard/widgets/muscle-heat-map/business/MuscleTagMapper";
import type { WorkoutLogData } from "@app/types/WorkoutLogData";

const tagMapper = {
  getAllMuscleGroups: () => new Set(["chest", "abs"]),
  findMuscleGroupsFromTags: async (exercise: string) =>
    exercise === "Bench Press" ? ["chest"] : ["abs"],
} as unknown as MuscleTagMapper;

const log = (exercise: string, reps: number, weight: number) =>
  ({
    date: "2026-10-01",
    exercise,
    reps,
    weight,
    volume: reps * weight,
  }) as WorkoutLogData;

// Bench: 2 sets of 10 × 50kg; Crunches: 3 bodyweight sets of 20
const data = [
  log("Bench Press", 10, 50),
  log("Bench Press", 10, 50),
  log("Crunches", 20, 0),
  log("Crunches", 20, 0),
  log("Crunches", 20, 0),
];

const valuesFor = async (
  metric?: "volume" | "sets" | "reps",
): Promise<Record<string, number>> => {
  const calculator = new MuscleDataCalculator(tagMapper);
  const result = await calculator.calculateMuscleGroupVolumes(
    data,
    {} as never,
    metric,
  );
  return {
    chest: result.get("chest")!.volume,
    abs: result.get("abs")!.volume,
  };
};

describe("MuscleDataCalculator.calculateMuscleGroupVolumes", () => {
  it("sums reps × weight volume by default", async () => {
    expect(await valuesFor()).toEqual({ chest: 1000, abs: 0 });
  });

  it("counts one per logged set with the sets metric", async () => {
    expect(await valuesFor("sets")).toEqual({ chest: 2, abs: 3 });
  });

  it("sums reps with the reps metric, so bodyweight work registers", async () => {
    expect(await valuesFor("reps")).toEqual({ chest: 20, abs: 60 });
  });

  it("normalizes intensity against the busiest muscle for the metric", async () => {
    const calculator = new MuscleDataCalculator(tagMapper);
    const result = await calculator.calculateMuscleGroupVolumes(
      data,
      {} as never,
      "sets",
    );
    expect(result.get("abs")!.intensity).toBe(1);
    expect(result.get("chest")!.intensity).toBeCloseTo(2 / 3);
  });
});
