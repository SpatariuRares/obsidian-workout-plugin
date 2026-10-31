import { t } from "@app/i18n";
import type { DefinitionItem } from "@app/features/settings/settingDefinitionTypes";
import { getDynamicSettingsLabels } from "@app/constants";
import type {
  QuickLogRibbonPort,
  WorkoutPluginContext,
} from "@app/types/PluginPorts";

export class QuickLogSettings {
  constructor(
    private plugin: WorkoutPluginContext & QuickLogRibbonPort,
  ) {}

  definitions(): DefinitionItem[] {
    return [
      {
        type: "group",
        heading: t("settings.sections.quickLog"),
        items: [
          {
            name: t("settings.labels.defaultExactMatch"),
            desc: t("settings.descriptions.defaultExactMatch"),
            render: (setting) => {
              setting.addToggle((toggle) =>
                toggle
                  .setValue(this.plugin.settings.defaultExactMatch)
                  .onChange(async (value) => {
                    this.plugin.settings.defaultExactMatch = value;
                    await this.plugin.saveSettings();
                  }),
              );
            },
          },
          {
            name: t("settings.labels.showRibbonIcon"),
            desc: t("settings.descriptions.showRibbonIcon"),
            render: (setting) => {
              setting.addToggle((toggle) =>
                toggle
                  .setValue(this.plugin.settings.showRibbonIcon)
                  .onChange(async (value) => {
                    this.plugin.settings.showRibbonIcon = value;
                    await this.plugin.saveSettings();
                    this.plugin.updateQuickLogRibbon();
                  }),
              );
            },
          },
          {
            // TODO: this will be default in future — add a system to control data from csv to decide what to show
            name: getDynamicSettingsLabels().QUICK_WEIGHT_INCREMENT,
            desc: t("settings.descriptions.quickWeightIncrement"),
            render: (setting) => {
              setting.addText((text) => {
                text
                  .setValue(
                    String(this.plugin.settings.quickWeightIncrement),
                  )
                  .onChange(async (value) => {
                    const numValue = parseFloat(value);
                    const isValid = !isNaN(numValue) && numValue > 0;
                    error.toggleClass("is-visible", !isValid);
                    if (isValid) {
                      this.plugin.settings.quickWeightIncrement =
                        numValue;
                      await this.plugin.saveSettings();
                    }
                  });
              });
              const error = setting.controlEl.createDiv({
                cls: "workout-setting-error",
                text: t("settings.validation.mustBePositive"),
              });
            },
          },
        ],
      },
    ];
  }
}
