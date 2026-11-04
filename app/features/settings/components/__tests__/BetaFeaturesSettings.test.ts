/** @jest-environment jsdom */
import { mockSettingNamed } from "obsidian";
import { BetaFeaturesSettings } from "@app/features/settings/components/BetaFeaturesSettings";
import { renderSettingDefinitions } from "@app/features/settings/renderSettingDefinitions";
import { WorkoutEventBus } from "@app/services/events/WorkoutEventBus";
import { t } from "@app/i18n";
import type WorkoutChartsPlugin from "main";

function setup(betaFeatures: Record<string, boolean> = {}) {
  const eventBus = new WorkoutEventBus();
  const events: unknown[] = [];
  eventBus.on("settings:changed", (payload) => events.push(payload));
  const plugin = {
    settings: { betaFeatures },
    saveSettings: jest.fn().mockResolvedValue(undefined),
    eventBus,
  };
  const container = document.createElement("div");
  renderSettingDefinitions(
    container,
    new BetaFeaturesSettings(plugin as unknown as WorkoutChartsPlugin).definitions(),
  );
  return { plugin, container, events };
}

describe("BetaFeaturesSettings", () => {
  it("shows each beta feature off until it is turned on", () => {
    const { container } = setup();
    const toggle = mockSettingNamed(container, t("settings.beta.setSheet.name")).component("toggle");

    expect(toggle.value).toBe(false);
  });

  it("turns a feature on, saves and tells the blocks to draw again", async () => {
    const { plugin, container, events } = setup();

    await mockSettingNamed(container, t("settings.beta.setSheet.name"))
      .component("toggle")
      .change(true as never);

    expect(plugin.settings.betaFeatures).toEqual({ setSheet: true });
    expect(plugin.saveSettings).toHaveBeenCalled();
    expect(events).toEqual([
      { key: "betaFeatures", previousValue: {}, newValue: { setSheet: true } },
    ]);
  });
});

describe("BetaFeaturesSettings with no feature in beta", () => {
  it("hides the section", () => {
    jest.isolateModules(() => {
      jest.doMock("@app/services/features/BetaFeatures", () => ({
        ...jest.requireActual("@app/services/features/BetaFeatures"),
        betaFeatures: () => [],
      }));
      const { BetaFeaturesSettings: Section } = jest.requireActual(
        "@app/features/settings/components/BetaFeaturesSettings",
      ) as typeof import("@app/features/settings/components/BetaFeaturesSettings");
      const [group] = new Section({ settings: { betaFeatures: {} } } as never).definitions();
      expect(group).toMatchObject({ visible: false });
    });
  });
});
