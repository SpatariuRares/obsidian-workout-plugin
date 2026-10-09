import { MuscleBalanceAnalyzer } from "@app/features/dashboard/widgets/muscle-heat-map/business/MuscleBalanceAnalyzer";
import type { MuscleGroupData } from "@app/features/dashboard/widgets/muscle-heat-map/business/MuscleDataCalculator";

const data = (volumes: Record<string, number>) =>
  new Map<string, MuscleGroupData>(
    Object.entries(volumes).map(([name, volume]) => [
      name,
      { name, volume, exercises: [], intensity: 0 },
    ]),
  );

describe("MuscleBalanceAnalyzer.analyze", () => {
  it("counts specific muscles toward their parent group", () => {
    // Back work logged only as lats/rhomboids must balance the chest
    const analysis = MuscleBalanceAnalyzer.analyze(
      data({ chest: 1000, lats: 600, rhomboids: 400 }),
    );
    expect(analysis.imbalances).toEqual([]);
  });

  it("still flags a real front-back imbalance", () => {
    const analysis = MuscleBalanceAnalyzer.analyze(
      data({ upper_chest: 1000, lats: 100 }),
    );
    expect(analysis.imbalances).toHaveLength(1);
  });
});
