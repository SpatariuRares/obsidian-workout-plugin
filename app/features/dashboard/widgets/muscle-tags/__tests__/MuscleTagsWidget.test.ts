/** @jest-environment jsdom */

import { MuscleTagsWidget } from "@app/features/dashboard/widgets/muscle-tags/MuscleTagsWidget";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";
import {
  MUSCLE_GROUP_EMOJI,
  OTHER_MUSCLE_EMOJI,
} from "@app/constants/muscles.constants";
import type { MuscleTagPort } from "@app/types/PluginPorts";

const plugin = {
  getMuscleTagService: () => ({
    tagMap: async () =>
      new Map([
        ["quads", "legs"],
        ["chest", "chest"],
        ["glutes", "legs"],
      ]),
  }),
} as unknown as MuscleTagPort;

const badges = (el: ParentNode) =>
  [...el.querySelectorAll(".workout-muscle-tag-badge")].map(
    (b) => (b as HTMLElement).dataset.muscle,
  );

describe("MuscleTagsWidget", () => {
  it("lists every tag in one grid, alphabetically", async () => {
    const container = createObsidianContainer();

    await MuscleTagsWidget.render(container, {}, plugin);

    expect(container.querySelectorAll(".workout-muscle-tags-grid")).toHaveLength(1);
    expect(badges(container)).toEqual(["chest", "glutes", "quads"]);
  });

  it("gives each muscle group a card holding its tags when asked", async () => {
    const container = createObsidianContainer();

    await MuscleTagsWidget.render(
      container,
      { muscleTagsGroupByMuscle: true },
      plugin,
    );

    expect(container.querySelector(".workout-muscle-tags-grid")).toBeNull();
    const cards = [...container.querySelectorAll(".workout-muscle-group-card")];
    expect(
      cards.map((card) => [
        card.querySelector(".workout-muscle-group-title")?.textContent,
        badges(card.querySelector(".workout-muscle-group-tags")!),
      ]),
    ).toEqual([
      [`${MUSCLE_GROUP_EMOJI.chest ?? OTHER_MUSCLE_EMOJI} Chest`, ["chest"]],
      [`${MUSCLE_GROUP_EMOJI.legs ?? OTHER_MUSCLE_EMOJI} Legs`, ["glutes", "quads"]],
    ]);
  });
});
