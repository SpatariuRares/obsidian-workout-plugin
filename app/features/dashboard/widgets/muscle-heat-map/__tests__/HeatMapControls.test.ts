/** @jest-environment jsdom */

import { HeatMapControls } from "@app/features/dashboard/widgets/muscle-heat-map/HeatMapControls";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";
import { t } from "@app/i18n";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";
import { DASHBOARD_WIDGETS } from "@app/features/dashboard/widgets/dashboardWidgets";
import { dashboardBlock } from "@app/features/dashboard/dashboardBlock";

describe("HeatMapControls choices", () => {
  it("offers the choices the widget's menu offers, starting on the block's defaults", () => {
    const container = createObsidianContainer();
    const options = HeatMapControls.create(
      container,
      [],
      document.createElement("div"),
      document.createElement("div"),
      {} as WorkoutPluginContext,
      jest.fn().mockResolvedValue(undefined),
    );

    const menuChoices = (DASHBOARD_WIDGETS.heatMap.settings ?? []).flatMap(
      (s) => (s.kind === "choice" ? [s.options.map((o) => o.label())] : []),
    );
    const groups = [...container.querySelectorAll(".workout-chip-group")].map(
      (group) => [...group.querySelectorAll("button")].map((b) => b.textContent),
    );
    expect(groups).toEqual(menuChoices);
    expect(options).toEqual({
      timeFrame: dashboardBlock.defaults.heatMapTimeFrame,
      view: dashboardBlock.defaults.heatMapView,
      metric: dashboardBlock.defaults.heatMapMetric,
    });
  });
});

describe("HeatMapControls metric toggle", () => {
  const setup = () => {
    const container = createObsidianContainer();
    const renderCallback = jest.fn().mockResolvedValue(undefined);
    const options = HeatMapControls.create(
      container,
      [],
      document.createElement("div"),
      document.createElement("div"),
      {} as WorkoutPluginContext,
      renderCallback,
    );
    const button = (key: string) =>
      Array.from(container.querySelectorAll("button")).find(
        (b) => b.textContent === t(`dashboard.muscleHeatMap.metrics.${key}`),
      )!;
    return { options, renderCallback, button };
  };

  it("starts on the volume metric", () => {
    const { options, button } = setup();

    expect(options.metric).toBe("volume");
    expect(button("volume").getAttribute("aria-pressed") === "true").toBe(true);
  });

  it.each(["sets", "reps"] as const)(
    "re-renders with the %s metric when its button is clicked",
    (metric) => {
      const { renderCallback, button } = setup();

      button(metric).click();

      expect(renderCallback).toHaveBeenCalledWith(
        expect.anything(),
        [],
        expect.objectContaining({ metric }),
        expect.anything(),
        expect.anything(),
      );
      expect(button(metric).getAttribute("aria-pressed") === "true").toBe(true);
      expect(button("volume").getAttribute("aria-pressed") === "true").toBe(false);
    },
  );
});

describe("HeatMapControls starting options", () => {
  it("starts on the options it is given", () => {
    const container = createObsidianContainer();
    const options = HeatMapControls.create(
      container,
      [],
      document.createElement("div"),
      document.createElement("div"),
      {} as WorkoutPluginContext,
      jest.fn().mockResolvedValue(undefined),
      { timeFrame: "year", view: "back", metric: "sets" },
    );

    expect(options).toEqual({ timeFrame: "year", view: "back", metric: "sets" });
    const active = [...container.querySelectorAll('button[aria-pressed="true"]')].map(
      (b) => b.textContent,
    );
    expect(active).toEqual([
      t("timeperiods.year"),
      t("general.back"),
      t("dashboard.muscleHeatMap.metrics.sets"),
    ]);
  });
});
