import { TargetCalculator } from "@app/features/tables/business/TargetCalculator";
import { WorkoutLogData } from "@app/types/WorkoutLogData";

const createLog = (
  overrides: Partial<WorkoutLogData> = {},
): WorkoutLogData => ({
  date: "2024-01-15",
  exercise: "Bench Press",
  reps: 8,
  weight: 80,
  volume: 640,
  ...overrides,
});

describe("TargetCalculator", () => {
  describe("calculateBestRepsAtWeight", () => {
    it("returns the max reps at the target weight", () => {
      const data = [
        createLog({ weight: 80, reps: 6 }),
        createLog({ weight: 80, reps: 10 }),
        createLog({ weight: 80, reps: 8 }),
        createLog({ weight: 60, reps: 12 }),
      ];

      expect(TargetCalculator.calculateBestRepsAtWeight(80, data)).toBe(10);
    });

    it("returns 0 when no entries at target weight", () => {
      const data = [createLog({ weight: 60, reps: 12 })];

      expect(TargetCalculator.calculateBestRepsAtWeight(80, data)).toBe(0);
    });

    it("returns 0 for empty data", () => {
      expect(TargetCalculator.calculateBestRepsAtWeight(80, [])).toBe(0);
    });
  });

  describe("checkTargetAchieved", () => {
    it("returns true when latest entry meets target reps", () => {
      const data = [
        createLog({
          weight: 80,
          reps: 10,
          date: "2024-01-15",
          timestamp: 1705315200000,
        }),
        createLog({
          weight: 80,
          reps: 6,
          date: "2024-01-10",
          timestamp: 1704873600000,
        }),
      ];

      expect(TargetCalculator.checkTargetAchieved(80, 10, data)).toBe(true);
    });

    it("returns true when latest entry exceeds target reps", () => {
      const data = [
        createLog({
          weight: 80,
          reps: 12,
          date: "2024-01-15",
          timestamp: 1705315200000,
        }),
      ];

      expect(TargetCalculator.checkTargetAchieved(80, 10, data)).toBe(true);
    });

    it("returns false when latest entry is below target reps", () => {
      const data = [
        createLog({
          weight: 80,
          reps: 5,
          date: "2024-01-15",
          timestamp: 1705315200000,
        }),
      ];

      expect(TargetCalculator.checkTargetAchieved(80, 10, data)).toBe(false);
    });

    it("returns false for empty data", () => {
      expect(TargetCalculator.checkTargetAchieved(80, 10, [])).toBe(false);
    });

    it("returns false when no entries at target weight", () => {
      const data = [createLog({ weight: 60, reps: 12 })];

      expect(TargetCalculator.checkTargetAchieved(80, 10, data)).toBe(false);
    });

    it("uses timestamp for sorting when available", () => {
      const data = [
        createLog({
          weight: 80,
          reps: 5,
          date: "2024-01-10",
          timestamp: 1705315200000,
        }), // newer timestamp
        createLog({
          weight: 80,
          reps: 12,
          date: "2024-01-15",
          timestamp: 1704873600000,
        }), // older timestamp
      ];

      // Should use the entry with newer timestamp (reps: 5)
      expect(TargetCalculator.checkTargetAchieved(80, 10, data)).toBe(false);
    });

    it("falls back to date parsing when no timestamp", () => {
      const data = [
        createLog({ weight: 80, reps: 12, date: "2024-01-15" }),
        createLog({ weight: 80, reps: 5, date: "2024-01-10" }),
      ];

      expect(TargetCalculator.checkTargetAchieved(80, 10, data)).toBe(true);
    });
  });

  describe("calculateProgressPercent", () => {
    it("calculates correct percentage", () => {
      expect(TargetCalculator.calculateProgressPercent(5, 10)).toBe(50);
    });

    it("caps at 100%", () => {
      expect(TargetCalculator.calculateProgressPercent(15, 10)).toBe(100);
    });

    it("returns 0 for zero target reps", () => {
      expect(TargetCalculator.calculateProgressPercent(5, 0)).toBe(0);
    });

    it("returns 0 for negative target reps", () => {
      expect(TargetCalculator.calculateProgressPercent(5, -1)).toBe(0);
    });

    it("returns 0 for zero best reps", () => {
      expect(TargetCalculator.calculateProgressPercent(0, 10)).toBe(0);
    });

    it("returns 100 for exact match", () => {
      expect(TargetCalculator.calculateProgressPercent(10, 10)).toBe(100);
    });
  });

  describe("getProgressLevel", () => {
    it("returns 'complete' for 100%", () => {
      expect(TargetCalculator.getProgressLevel(100)).toBe("complete");
    });

    it("returns 'complete' for over 100%", () => {
      expect(TargetCalculator.getProgressLevel(110)).toBe("complete");
    });

    it("returns 'high' for 90-99%", () => {
      expect(TargetCalculator.getProgressLevel(90)).toBe("high");
      expect(TargetCalculator.getProgressLevel(99)).toBe("high");
    });

    it("returns 'medium' for 50-89%", () => {
      expect(TargetCalculator.getProgressLevel(50)).toBe("medium");
      expect(TargetCalculator.getProgressLevel(89)).toBe("medium");
    });

    it("returns 'low' for below 50%", () => {
      expect(TargetCalculator.getProgressLevel(0)).toBe("low");
      expect(TargetCalculator.getProgressLevel(49)).toBe("low");
    });
  });
});
