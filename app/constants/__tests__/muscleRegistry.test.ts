import {
  CANONICAL_MUSCLE_GROUPS,
  MUSCLE_GROUPS,
  MUSCLE_PARENT_GROUPS,
  MUSCLE_TAG_ENTRIES,
} from "@app/constants/muscles.constants";
import { HEAT_MAP_ZONES } from "@app/features/dashboard/widgets/muscle-heat-map/body/zones";

describe("muscle registry", () => {
  const ids = MUSCLE_GROUPS.map((g) => g.id);

  it("should list each muscle once", () => {
    expect(new Set(ids).size).toBe(ids.length);
    expect([...CANONICAL_MUSCLE_GROUPS]).toEqual(ids);
  });

  it("should give every specific muscle a broad group that has no parent itself", () => {
    for (const [muscle, parent] of Object.entries(MUSCLE_PARENT_GROUPS)) {
      const group = MUSCLE_GROUPS.find((g) => g.id === parent);
      expect({ muscle, parentKnown: !!group, parentIsBroad: !!group && !("parent" in group) }).toEqual({
        muscle,
        parentKnown: true,
        parentIsBroad: true,
      });
    }
  });

  it("should draw every muscle in at least one heat map zone", () => {
    const drawn = new Set(Object.values(HEAT_MAP_ZONES).flatMap((zone) => Object.keys(zone)));
    expect(ids.filter((id) => !drawn.has(id))).toEqual([]);
  });

  it("should map every default tag to a known muscle", () => {
    const unknown = MUSCLE_TAG_ENTRIES.filter(
      (entry) => !ids.includes(entry.muscleGroup as (typeof ids)[number]),
    ).map((entry) => `${entry.tag} → ${entry.muscleGroup}`);
    expect(unknown).toEqual([]);
  });
});
