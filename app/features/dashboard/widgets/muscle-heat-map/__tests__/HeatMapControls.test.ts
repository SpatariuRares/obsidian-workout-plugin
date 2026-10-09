/** @jest-environment jsdom */

import { HeatMapControls } from "@app/features/dashboard/widgets/muscle-heat-map/HeatMapControls";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";
import { t } from "@app/i18n";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";

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
    expect(button("volume").classList.contains("active")).toBe(true);
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
      expect(button(metric).classList.contains("active")).toBe(true);
      expect(button("volume").classList.contains("active")).toBe(false);
    },
  );
});
