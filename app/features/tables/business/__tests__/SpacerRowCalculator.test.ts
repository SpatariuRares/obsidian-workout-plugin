import { SpacerRowCalculator } from "@app/features/tables/business/SpacerRowCalculator";
import { TableRow } from "@app/features/tables/types";
import { WorkoutLogData } from "@app/types/WorkoutLogData";

const createRow = (logOverrides: Partial<WorkoutLogData> = {}): TableRow => ({
  displayRow: [],
  originalDate: "2024-01-15",
  dateKey: "2024-01-15",
  originalLog: {
    date: "2024-01-15",
    exercise: "Bench Press",
    reps: 8,
    weight: 80,
    volume: 640,
    ...logOverrides,
  },
});

describe("SpacerRowCalculator", () => {
  describe("strength data", () => {
    it("aggregates reps, weight, and volume for strength rows", () => {
      const rows = [
        createRow({ reps: 8, weight: 80, volume: 640 }),
        createRow({ reps: 10, weight: 80, volume: 800 }),
      ];

      const result = SpacerRowCalculator.calculate(rows);

      expect(result.stats).toHaveLength(3);
      expect(result.stats[0]).toEqual(expect.objectContaining({ value: "18" }));
      expect(result.stats[1]).toEqual(
        expect.objectContaining({ value: "160.0kg" }),
      );
      expect(result.stats[2]).toEqual(
        expect.objectContaining({ value: "1440kg" }),
      );
    });

    it("includes icon references for strength stats", () => {
      const rows = [createRow({ reps: 5, weight: 100, volume: 500 })];

      const result = SpacerRowCalculator.calculate(rows);

      expect(result.stats[0].icon).toBeDefined();
      expect(result.stats[1].icon).toBeDefined();
      expect(result.stats[2].icon).toBeDefined();
    });
  });

  describe("cardio/timed data", () => {
    it("shows duration when present", () => {
      const rows = [
        createRow({
          reps: 0,
          weight: 0,
          volume: 0,
          customFields: { duration: 90 },
        }),
        createRow({
          reps: 0,
          weight: 0,
          volume: 0,
          customFields: { duration: 30 },
        }),
      ];

      const result = SpacerRowCalculator.calculate(rows);

      expect(result.stats).toHaveLength(1);
      expect(result.stats[0].value).toBe("2m0s");
    });

    it("formats duration under 60s without minutes", () => {
      const rows = [
        createRow({
          reps: 0,
          weight: 0,
          volume: 0,
          customFields: { duration: 45 },
        }),
      ];

      const result = SpacerRowCalculator.calculate(rows);

      expect(result.stats[0].value).toBe("45s");
    });

    it("shows distance when present", () => {
      const rows = [
        createRow({
          reps: 0,
          weight: 0,
          volume: 0,
          customFields: { distance: 5.5 },
        }),
      ];

      const result = SpacerRowCalculator.calculate(rows);

      expect(result.stats[0].value).toBe("5.50km");
    });

    it("shows average heart rate when present", () => {
      const rows = [
        createRow({
          reps: 0,
          weight: 0,
          volume: 0,
          customFields: { heartrate: 140 },
        }),
        createRow({
          reps: 0,
          weight: 0,
          volume: 0,
          customFields: { heartrate: 160 },
        }),
      ];

      const result = SpacerRowCalculator.calculate(rows);

      expect(result.stats[0].value).toBe("150bpm");
    });

    it("supports heartRate camelCase field name", () => {
      const rows = [
        createRow({
          reps: 0,
          weight: 0,
          volume: 0,
          customFields: { heartRate: 130 },
        }),
      ];

      const result = SpacerRowCalculator.calculate(rows);

      expect(result.stats[0].value).toBe("130bpm");
    });

    it("shows multiple cardio metrics together", () => {
      const rows = [
        createRow({
          reps: 0,
          weight: 0,
          volume: 0,
          customFields: { duration: 1800, distance: 5.0, heartrate: 155 },
        }),
      ];

      const result = SpacerRowCalculator.calculate(rows);

      expect(result.stats).toHaveLength(3);
    });
  });

  describe("fallback", () => {
    it("shows set count when no metrics are available", () => {
      const rows = [
        createRow({ reps: 0, weight: 0, volume: 0 }),
        createRow({ reps: 0, weight: 0, volume: 0 }),
        createRow({ reps: 0, weight: 0, volume: 0 }),
      ];

      const result = SpacerRowCalculator.calculate(rows);

      expect(result.stats).toHaveLength(1);
      expect(result.stats[0].value).toBe("3 sets");
      expect(result.stats[0].icon).toBeUndefined();
    });
  });

  describe("edge cases", () => {
    it("skips rows without originalLog", () => {
      const rows: TableRow[] = [
        {
          displayRow: [],
          originalDate: "2024-01-15",
          dateKey: "2024-01-15",
          originalLog: undefined,
        },
      ];

      const result = SpacerRowCalculator.calculate(rows);

      expect(result.stats).toHaveLength(1);
      expect(result.stats[0].value).toBe("1 sets");
    });

    it("strength data takes priority over cardio data", () => {
      const rows = [
        createRow({
          reps: 8,
          weight: 80,
          volume: 640,
          customFields: { duration: 120 },
        }),
      ];

      const result = SpacerRowCalculator.calculate(rows);

      // Should show strength stats, not duration
      expect(result.stats).toHaveLength(3);
      expect(result.stats[0].value).toBe("8");
    });
  });
});
