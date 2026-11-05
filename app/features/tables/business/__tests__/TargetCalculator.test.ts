import { TargetCalculator } from "@app/features/tables/business/TargetCalculator";
import { logRow } from "@app/types/__tests__/logRow";

describe("TargetCalculator", () => {
  describe("calculateBestRepsAtWeight", () => {
    it("returns the max reps at the target weight", () => {
      const data = [
        logRow({ weight: 80, reps: 6 }),
        logRow({ weight: 80, reps: 10 }),
        logRow({ weight: 80, reps: 8 }),
        logRow({ weight: 60, reps: 12 }),
      ];

      expect(
        TargetCalculator.calculateBestRepsAtWeight(80, data),
      ).toBe(10);
    });

    it("returns 0 when no entries at target weight", () => {
      const data = [logRow({ weight: 60, reps: 12 })];

      expect(
        TargetCalculator.calculateBestRepsAtWeight(80, data),
      ).toBe(0);
    });

    it("returns 0 for empty data", () => {
      expect(TargetCalculator.calculateBestRepsAtWeight(80, [])).toBe(
        0,
      );
    });
  });

  describe("calculateBestRepsAtWeight: which sets count", () => {
    it("counts a heavier set: 90kg × 8 also beats 85kg × 8", () => {
      const data = [
        logRow({ weight: 102.5, reps: 8 }),
        logRow({ weight: 70, reps: 12 }),
      ];

      expect(TargetCalculator.calculateBestRepsAtWeight(85, data)).toBe(8);
    });

    it("leaves out warm-ups and drop sets, like PRs", () => {
      const data = [
        logRow({ weight: 80, reps: 12, protocol: "warmup" }),
        logRow({ weight: 80, reps: 11, protocol: "drop_set" }),
        logRow({ weight: 80, reps: 7, protocol: "myo_reps" }),
      ];

      expect(TargetCalculator.calculateBestRepsAtWeight(80, data)).toBe(7);
    });

    it("matches a weight converted from lb, kept to 2 decimals", () => {
      const data = [logRow({ weight: 84.99, reps: 8 })];

      expect(TargetCalculator.calculateBestRepsAtWeight(85, data)).toBe(8);
    });
  });

  describe("checkTargetAchieved", () => {
    it("is reached when the best set meets the target reps, as the progress says", () => {
      const data = [
        logRow({ weight: 80, reps: 10, timestamp: 1704873600000 }),
        logRow({ weight: 80, reps: 6, timestamp: 1705315200000 }),
      ];

      expect(TargetCalculator.checkTargetAchieved(80, 10, data)).toBe(true);
    });

    it("is reached with a heavier set", () => {
      const data = [logRow({ weight: 102.5, reps: 8 })];

      expect(TargetCalculator.checkTargetAchieved(85, 8, data)).toBe(true);
    });

    it("is not reached below the target reps", () => {
      const data = [logRow({ weight: 80, reps: 5 })];

      expect(TargetCalculator.checkTargetAchieved(80, 10, data)).toBe(false);
    });

    it("is not reached by a warm-up", () => {
      const data = [logRow({ weight: 80, reps: 12, protocol: "warmup" })];

      expect(TargetCalculator.checkTargetAchieved(80, 10, data)).toBe(false);
    });

    it("is not reached with no sets, or only lighter ones", () => {
      expect(TargetCalculator.checkTargetAchieved(80, 10, [])).toBe(false);
      expect(
        TargetCalculator.checkTargetAchieved(80, 10, [logRow({ weight: 60, reps: 12 })]),
      ).toBe(false);
    });
  });
});
