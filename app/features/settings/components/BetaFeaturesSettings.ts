import type { Setting } from "obsidian";
import { t } from "@app/i18n";
import type { DefinitionItem } from "@app/features/settings/settingDefinitionTypes";
import {
  betaFeatures,
  featureEnabled,
  type Feature,
} from "@app/services/features/BetaFeatures";
import type { EventBusPort, WorkoutPluginContext } from "@app/types/PluginPorts";

/**
 * Settings → Beta features: one toggle per feature still in beta, all off by
 * default. A stable feature has none (it is on); with none in beta the
 * section is hidden.
 */
export class BetaFeaturesSettings {
  constructor(private plugin: WorkoutPluginContext & EventBusPort) {}

  definitions(): DefinitionItem[] {
    const features = betaFeatures();
    return [
      {
        type: "group",
        heading: t("settings.sections.beta"),
        visible: features.length > 0,
        items: [
          { name: t("settings.sections.beta"), desc: t("settings.beta.intro") },
          ...features.map((feature) => ({
            name: t(`settings.beta.${feature}.name`),
            desc: t(`settings.beta.${feature}.desc`),
            render: (setting: Setting) =>
              setting.addToggle((toggle) =>
                toggle
                  .setValue(featureEnabled(this.plugin.settings, feature))
                  .onChange((value) => this.toggle(feature, value)),
              ),
          })),
        ],
      },
    ];
  }

  private async toggle(feature: Feature, on: boolean): Promise<void> {
    const previousValue = { ...this.plugin.settings.betaFeatures };
    const newValue = { ...previousValue, [feature]: on };
    this.plugin.settings.betaFeatures = newValue;
    await this.plugin.saveSettings();
    // Blocks of the feature draw themselves (or their notice) again
    this.plugin.eventBus.emit({
      type: "settings:changed",
      payload: { key: "betaFeatures", previousValue, newValue },
    });
  }
}
