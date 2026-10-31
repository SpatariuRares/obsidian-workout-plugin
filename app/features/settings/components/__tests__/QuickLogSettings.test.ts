/** @jest-environment jsdom */
import { mockSettingNamed } from "obsidian";
import { QuickLogSettings } from "@app/features/settings/components/QuickLogSettings";
import { renderSettingDefinitions } from "@app/features/settings/renderSettingDefinitions";
import { t } from "@app/i18n";
import { getDynamicSettingsLabels } from "@app/constants";
import type WorkoutChartsPlugin from "main";

function setup() {
  const plugin = {
    settings: {
      defaultExactMatch: false,
      showRibbonIcon: true,
      quickWeightIncrement: 2.5,
    },
    saveSettings: jest.fn().mockResolvedValue(undefined),
    updateQuickLogRibbon: jest.fn(),
  };
  const container = document.createElement("div");
  renderSettingDefinitions(
    container,
    new QuickLogSettings(
      plugin as unknown as WorkoutChartsPlugin,
    ).definitions(),
  );
  return { plugin, container };
}

describe("QuickLogSettings", () => {
  it("saves showRibbonIcon and refreshes the ribbon", async () => {
    const { plugin, container } = setup();

    await mockSettingNamed(
      container,
      t("settings.labels.showRibbonIcon"),
    )
      .component("toggle")
      .change(false as never);

    expect(plugin.settings.showRibbonIcon).toBe(false);
    expect(plugin.saveSettings).toHaveBeenCalled();
    expect(plugin.updateQuickLogRibbon).toHaveBeenCalled();
  });

  it("saves the exact-match default", async () => {
    const { plugin, container } = setup();

    await mockSettingNamed(
      container,
      t("settings.labels.defaultExactMatch"),
    )
      .component("toggle")
      .change(true as never);

    expect(plugin.settings.defaultExactMatch).toBe(true);
    expect(plugin.saveSettings).toHaveBeenCalled();
  });

  it("keeps a valid weight increment and shows an error for an invalid one", async () => {
    const { plugin, container } = setup();
    const row = mockSettingNamed(
      container,
      getDynamicSettingsLabels().QUICK_WEIGHT_INCREMENT,
    );
    const text = row.component("text");
    const error = row.controlEl.querySelector(
      ".workout-setting-error",
    )!;

    await text.change("5" as never);
    expect(plugin.settings.quickWeightIncrement).toBe(5);
    expect(error.classList.contains("is-visible")).toBe(false);

    await text.change("-1" as never);
    expect(plugin.settings.quickWeightIncrement).toBe(5);
    expect(error.classList.contains("is-visible")).toBe(true);
  });
});
