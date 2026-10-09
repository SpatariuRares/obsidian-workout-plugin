/** @jest-environment jsdom */

/**
 * Pins the color of every heat map zone for fixed muscle volumes, so the
 * rendering pipeline can be refactored without changing what users see.
 */
import { CANONICAL_MUSCLE_GROUPS } from "@app/constants/muscles.constants";
import {
  MuscleDataCalculator,
  type MuscleGroupData,
} from "@app/features/dashboard/widgets/muscle-heat-map/business/MuscleDataCalculator";
import {
  Body,
  VIEW_TYPE,
} from "@app/features/dashboard/widgets/muscle-heat-map/body";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";

const renderZoneColors = (
  volumes: Record<string, number>,
  view: VIEW_TYPE,
): Record<string, string> => {
  const muscleData = new Map<string, MuscleGroupData>(
    CANONICAL_MUSCLE_GROUPS.map((name) => [
      name,
      { name, volume: volumes[name] ?? 0, exercises: [], intensity: 0 },
    ]),
  );
  const container = createObsidianContainer();
  new Body(MuscleDataCalculator.calculateZoneValues(muscleData), {
    view,
  }).render(container);

  const colors: Record<string, string> = {};
  container.querySelectorAll("g[id]").forEach((g) => {
    const style = g.getAttribute("style");
    if (style) colors[g.id] = style;
  });
  return colors;
};

// A distinct volume for every muscle group, so each weight shows up
const everyMuscle = Object.fromEntries(
  CANONICAL_MUSCLE_GROUPS.map((name, i) => [name, 100 + i * 37]),
);

const fixtures: Record<string, Record<string, number>> = {
  everyMuscle,
  broadTagsOnly: { chest: 900, back: 700, shoulders: 500, core: 300, traps: 200 },
  specificOnly: {
    upper_chest: 400,
    lower_chest: 250,
    side_delts: 300,
    rhomboids: 150,
    serratus: 120,
    lower_back: 90,
  },
  limbsAndAbs: { biceps: 300, abs: 300, quads: 800, calves: 50 },
  empty: {},
};

describe("heat map zone colors", () => {
  for (const [name, volumes] of Object.entries(fixtures)) {
    for (const view of [VIEW_TYPE.FRONT, VIEW_TYPE.BACK]) {
      it(`${name} (${view})`, () => {
        expect(renderZoneColors(volumes, view)).toMatchSnapshot();
      });
    }
  }
});
