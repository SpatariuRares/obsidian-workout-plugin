/** @jest-environment jsdom */

import { DurationRenderer } from "@app/features/duration/renderers/DurationRenderer";
import type { DurationAnalysisResult } from "@app/features/duration/types";
import { LocalizationService, t } from "@app/i18n";
import { FormatUtils } from "@app/utils/FormatUtils";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";

const analysis = (
  overrides: Partial<DurationAnalysisResult> = {},
): DurationAnalysisResult => ({
  totalRestTime: 2430,
  restPeriodCount: 18,
  setCount: 19,
  totalSetTime: 1167,
  totalDuration: 3597,
  workoutPath: "Workouts/Leg Day.md",
  success: true,
  ...overrides,
});

describe("DurationRenderer", () => {
  beforeAll(() => LocalizationService.initialize({} as never));

  const render = (result: DurationAnalysisResult, workoutName?: string) => {
    const container = createObsidianContainer();
    new DurationRenderer().renderDurationCard(container, result, workoutName);
    return container;
  };

  const stats = (container: HTMLElement) =>
    [...container.querySelectorAll(".stat-card-row .stat-card")].map((card) => ({
      label: card.querySelector(".stat-card-label")?.textContent,
      value: card.querySelector(".stat-card-value")?.textContent,
      detail: card.querySelector(".stat-card-detail")?.textContent,
    }));

  it("is a block card with the estimate and its breakdown", () => {
    const container = render(analysis());

    const card = container.querySelector(".workout-block-card.workout-duration");
    expect(card?.querySelector(".workout-block-title")?.textContent).toBe(
      t("duration.estimatedDuration"),
    );
    expect(card?.querySelector(".workout-block-meta")).toBeNull();
    expect(card?.querySelector(".workout-duration-total")?.textContent).toBe(
      FormatUtils.formatDuration(3597),
    );
    expect(stats(container)).toEqual([
      { label: t("duration.restTime"), value: FormatUtils.formatDuration(2430), detail: undefined },
      {
        label: t("duration.setTime"),
        value: FormatUtils.formatDuration(1167),
        detail: t("duration.setCount", { count: 19 }),
      },
    ]);
  });

  it("adds the last session with its day", () => {
    const [, , last] = stats(
      render(analysis({ historicalDuration: 2973, lastSessionDate: "2026-11-03" })),
    );

    expect(last).toEqual({
      label: t("duration.lastSession"),
      value: FormatUtils.formatDuration(2973),
      detail: "2026-11-03",
    });
  });

  it("names the analyzed note when it is another one", () => {
    const container = render(analysis(), "Leg Day");

    expect(container.querySelector(".workout-block-meta")?.textContent).toBe("Leg Day");
  });

  it("shows the error in the card, without figures", () => {
    const container = render(analysis({ success: false, error: "File not found" }));

    expect(container.querySelector(".workout-duration-error")?.textContent).toBe(
      "File not found",
    );
    expect(container.querySelector(".workout-duration-total")).toBeNull();
    expect(container.querySelector(".stat-card-row")).toBeNull();
  });
});
