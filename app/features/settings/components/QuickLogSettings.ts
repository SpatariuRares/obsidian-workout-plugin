import { Setting } from "obsidian";
import { t } from "@app/i18n";
import { getDynamicSettingsLabels } from "@app/constants";
import WorkoutChartsPlugin from "main";

export class QuickLogSettings {
  constructor(
    private plugin: WorkoutChartsPlugin,
    private containerEl: HTMLElement,
  ) {}

  render(): void {
    const { containerEl } = this;

    new Setting(containerEl)
      .setName(t("settings.sections.quickLog"))
      .setHeading();

    new Setting(containerEl)
      .setName(t("settings.labels.defaultExactMatch"))
      .setDesc(t("settings.descriptions.defaultExactMatch"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.defaultExactMatch)
          .onChange(async (value) => {
            this.plugin.settings.defaultExactMatch = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName(t("settings.labels.showRibbonIcon"))
      .setDesc(t("settings.descriptions.showRibbonIcon"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.showRibbonIcon)
          .onChange(async (value) => {
            this.plugin.settings.showRibbonIcon = value;
            await this.plugin.saveSettings();
            this.plugin.updateQuickLogRibbon();
          }),
      );

    // TODO: this will be default in future — add a system to control data from csv to decide what to show
    const quickWeightSetting = new Setting(containerEl)
      .setName(getDynamicSettingsLabels().QUICK_WEIGHT_INCREMENT)
      .setDesc(t("settings.descriptions.quickWeightIncrement"))
      .addText((text) => {
        text
          .setValue(String(this.plugin.settings.quickWeightIncrement))
          .onChange(async (value) => {
            const numValue = parseFloat(value);
            const isValid = !isNaN(numValue) && numValue > 0;
            quickWeightError.toggleClass("is-visible", !isValid);
            if (isValid) {
              this.plugin.settings.quickWeightIncrement = numValue;
              await this.plugin.saveSettings();
            }
          });
      });
    const quickWeightError = quickWeightSetting.controlEl.createEl(
      "div",
      {
        cls: "workout-setting-error",
        text: t("settings.validation.mustBePositive"),
      },
    );
    void quickWeightError;
  }
}
