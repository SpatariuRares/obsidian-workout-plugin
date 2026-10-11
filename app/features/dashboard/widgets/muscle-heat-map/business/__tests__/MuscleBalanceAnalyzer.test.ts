import { MuscleBalanceAnalyzer } from "@app/features/dashboard/widgets/muscle-heat-map/business/MuscleBalanceAnalyzer";
import type { MuscleGroupData } from "@app/features/dashboard/widgets/muscle-heat-map/business/MuscleDataCalculator";
import { t } from "@app/i18n";

const data = (totals: Record<string, number>) =>
  new Map<string, MuscleGroupData>(
    Object.entries(totals).map(([name, total]) => [
      name,
      { name, total, exercises: [] },
    ]),
  );

describe("MuscleBalanceAnalyzer.analyze", () => {
  it("counts specific muscles toward their side of the body", () => {
    // Back work logged only as lats/rhomboids must balance the chest
    const analysis = MuscleBalanceAnalyzer.analyze(
      data({ chest: 1000, lats: 600, rhomboids: 400 }),
    );
    expect(analysis.imbalances).toEqual([]);
  });

  it("counts every back muscle, traps and calves included", () => {
    const analysis = MuscleBalanceAnalyzer.analyze(
      data({ chest: 1000, traps: 500, calves: 500 }),
    );
    expect(analysis.imbalances).toEqual([]);
  });

  it("leaves out muscles trained on both sides", () => {
    const analysis = MuscleBalanceAnalyzer.analyze(
      data({ chest: 1000, lats: 1000, side_delts: 5000, forearms: 5000 }),
    );
    expect(analysis.imbalances).toEqual([]);
  });

  it("names the dominant side of a real imbalance in the user's language", () => {
    expect(
      MuscleBalanceAnalyzer.analyze(data({ upper_chest: 1000, lats: 100 })).imbalances,
    ).toEqual([t("dashboard.muscleHeatMap.imbalance.frontDominant")]);
    expect(
      MuscleBalanceAnalyzer.analyze(data({ chest: 100, hamstrings: 1000 })).imbalances,
    ).toEqual([t("dashboard.muscleHeatMap.imbalance.backDominant")]);
  });
});
