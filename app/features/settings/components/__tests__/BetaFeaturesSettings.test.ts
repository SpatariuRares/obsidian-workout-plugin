/** @jest-environment jsdom */
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
  it("shows no section while no feature is in beta", () => {
    const { container } = setup();

    expect(container.textContent).not.toContain(t("settings.sections.beta"));
  });
});
