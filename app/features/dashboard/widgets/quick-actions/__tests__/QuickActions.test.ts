/** @jest-environment jsdom */

import { QuickActions } from "@app/features/dashboard/widgets/quick-actions/QuickActions";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";
import { t } from "@app/i18n";

const plugin = {} as WorkoutPluginContext;
const buttons = (container: HTMLElement) =>
  [...container.querySelectorAll("button")].map((b) => b.textContent);

describe("QuickActions", () => {
  it("shows both buttons by default", () => {
    const container = createObsidianContainer();

    QuickActions.render(container, {}, plugin);

    expect(buttons(container)).toEqual([
      t("dashboard.quickActions.addWorkoutLog"),
      t("dashboard.quickActions.viewExercises"),
    ]);
  });

  it("shows only the buttons the block lists", () => {
    const container = createObsidianContainer();

    QuickActions.render(
      container,
      { quickActionsShown: ["viewExercises"] },
      plugin,
    );

    expect(buttons(container)).toEqual([
      t("dashboard.quickActions.viewExercises"),
    ]);
  });
});
