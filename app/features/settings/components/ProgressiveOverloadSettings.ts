import { Setting } from "obsidian";
import { t } from "@app/i18n";
import { getDynamicSettingsLabels } from "@app/constants";
import WorkoutChartsPlugin from "main";

/**
 * @deprecated Content merged into DurationEstimationSettings under "Training parameters" section.
 * This class is kept for backwards compatibility but its render() is no longer called.
 */
export class ProgressiveOverloadSettings {
  constructor(
    private plugin: WorkoutChartsPlugin,
    private containerEl: HTMLElement,
  ) {}

  /** @deprecated Use DurationEstimationSettings.render() which now includes weightIncrement. */
  render(): void {
    const { containerEl } = this;

    new Setting(containerEl)
      .setName(t("settings.sections.trainingParameters"))
      .setHeading();

    new Setting(containerEl)
      .setName(getDynamicSettingsLabels().WEIGHT_INCREMENT)
      .setDesc(t("settings.descriptions.weightIncrement"))
      .addText((text) =>
        text
          .setValue(String(this.plugin.settings.weightIncrement))
          .onChange(async (value) => {
            const numValue = parseFloat(value);
            if (!isNaN(numValue) && numValue > 0) {
              this.plugin.settings.weightIncrement = numValue;
              await this.plugin.saveSettings();
            }
          }),
      );
  }
}
