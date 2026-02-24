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

    // TODO: this will be default in future — add a system to control data from csv to decide what to show
    new Setting(containerEl)
      .setName(getDynamicSettingsLabels().QUICK_WEIGHT_INCREMENT)
      .setDesc(t("settings.descriptions.quickWeightIncrement"))
      .addText((text) =>
        text
          .setValue(String(this.plugin.settings.quickWeightIncrement))
          .onChange(async (value) => {
            const numValue = parseFloat(value);
            if (!isNaN(numValue) && numValue > 0) {
              this.plugin.settings.quickWeightIncrement = numValue;
              await this.plugin.saveSettings();
            }
          }),
      );
  }
}
