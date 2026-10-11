import { DataAggregation } from "@app/utils/data/DataAggregation";
import { WorkoutLogData } from "@app/types/WorkoutLogData";
import { t } from "@app/i18n";

describe("DataAggregation", () => {
  const mockData: WorkoutLogData[] = [
    {
      date: "2024-01-15T10:00:00",
      exercise: "Squat",
      reps: 10,
      weight: 100,
      volume: 1000,
      origine: "test",
      workout: "Lower A",
      timestamp: new Date("2024-01-15T10:00:00").getTime(),
    },
    {
      date: "2024-01-15T11:00:00",
      exercise: "Squat",
      reps: 8,
      weight: 120,
      volume: 960,
      origine: "test",
      workout: "Lower A",
      timestamp: new Date("2024-01-15T11:00:00").getTime(),
    },
    {
      date: "2024-01-16T10:00:00",
      exercise: "Bench Press",
      reps: 10,
      weight: 80,
      volume: 800,
      origine: "test",
      workout: "Upper A",
      timestamp: new Date("2024-01-16T10:00:00").getTime(),
    },
    {
      date: "2024-01-16T11:00:00",
      exercise: "Deadlift",
      reps: 5,
      weight: 150,
      volume: 750,
      origine: "test",
      workout: "Lower B",
      timestamp: new Date("2024-01-16T11:00:00").getTime(),
    },
  ];

  describe("aggregateByKey", () => {
    it("should aggregate values by custom key function", () => {
      const result = DataAggregation.aggregateByKey(
        mockData,
        (d) => d.exercise,
        (d) => d.volume,
      );

      expect(result.get("Squat")).toBe(1960); // 1000 + 960
      expect(result.get("Bench Press")).toBe(800);
      expect(result.get("Deadlift")).toBe(750);
    });

    it("should handle empty data", () => {
      const result = DataAggregation.aggregateByKey<WorkoutLogData>(
        [],
        (d) => d.exercise,
        (d) => d.volume,
      );

      expect(result.size).toBe(0);
    });
  });

  describe("aggregateExerciseVolumes", () => {
    it("should sum volumes by exercise", () => {
      const result =
        DataAggregation.aggregateExerciseVolumes(mockData);

      expect(result.get("Squat")).toBe(1960);
      expect(result.get("Bench Press")).toBe(800);
      expect(result.get("Deadlift")).toBe(750);
    });

    it("should return empty map for empty data", () => {
      const result = DataAggregation.aggregateExerciseVolumes([]);
      expect(result.size).toBe(0);
    });
  });

  describe("aggregateDailyVolumes", () => {
    it("should sum volumes by date", () => {
      const result = DataAggregation.aggregateDailyVolumes(mockData);

      expect(result.get("2024-01-15")).toBe(1960); // Squat + Squat
      expect(result.get("2024-01-16")).toBe(1550); // Bench Press + Deadlift
    });
  });

  describe("aggregateWorkoutVolumes", () => {
    it("should sum volumes by workout name", () => {
      const result =
        DataAggregation.aggregateWorkoutVolumes(mockData);

      expect(result.get("Lower A")).toBe(1960);
      expect(result.get("Upper A")).toBe(800);
      expect(result.get("Lower B")).toBe(750);
    });

    it("should handle undefined workout names", () => {
      const dataWithUndefined: WorkoutLogData[] = [
        {
          ...mockData[0],
          workout: undefined,
        },
      ];

      const result =
        DataAggregation.aggregateWorkoutVolumes(dataWithUndefined);
      expect(result.get(t("common.unknown"))).toBe(1000);
    });
  });

  describe("getTopN", () => {
    it("should return top N items sorted by value", () => {
      const data = new Map([
        ["A", 100],
        ["B", 500],
        ["C", 300],
        ["D", 200],
      ]);

      const result = DataAggregation.getTopN(data, 2);

      expect(result).toEqual([
        ["B", 500],
        ["C", 300],
      ]);
    });

    it("should return all items if N is larger than size", () => {
      const data = new Map([
        ["A", 100],
        ["B", 200],
      ]);

      const result = DataAggregation.getTopN(data, 10);
      expect(result).toHaveLength(2);
    });

    it("should handle empty map", () => {
      const result = DataAggregation.getTopN(new Map(), 5);
      expect(result).toEqual([]);
    });
  });

  describe("getTopExercisesByVolume", () => {
    it("should return top N exercises by volume", () => {
      const result = DataAggregation.getTopExercisesByVolume(
        mockData,
        2,
      );

      expect(result).toHaveLength(2);
      expect(result[0][0]).toBe("Squat");
      expect(result[0][1]).toBe(1960);
      expect(result[1][0]).toBe("Bench Press");
      expect(result[1][1]).toBe(800);
    });

    it("should limit results to N", () => {
      const result = DataAggregation.getTopExercisesByVolume(
        mockData,
        1,
      );
      expect(result).toHaveLength(1);
    });
  });

  describe("calculateTotalVolume", () => {
    it("should sum all volumes", () => {
      const result = DataAggregation.calculateTotalVolume(mockData);
      expect(result).toBe(3510); // 1000 + 960 + 800 + 750
    });

    it("should return 0 for empty data", () => {
      const result = DataAggregation.calculateTotalVolume([]);
      expect(result).toBe(0);
    });
  });

  describe("findMaxWeightsByExercise", () => {
    it("should find maximum weight for each exercise", () => {
      const result =
        DataAggregation.findMaxWeightsByExercise(mockData);

      expect(result.get("Squat")).toBe(120); // Max of 100 and 120
      expect(result.get("Bench Press")).toBe(80);
      expect(result.get("Deadlift")).toBe(150);
    });

    it("should handle single entry per exercise", () => {
      const singleData: WorkoutLogData[] = [mockData[2]];
      const result =
        DataAggregation.findMaxWeightsByExercise(singleData);

      expect(result.get("Bench Press")).toBe(80);
    });
  });
});
