import { Setting } from "obsidian";
import { CONSTANTS } from "@app/constants";
import WorkoutChartsPlugin from "main";

export class QuickLogSettings {
  constructor(
    private plugin: WorkoutChartsPlugin,
    private containerEl: HTMLElement,
  ) {}

  render(): void {
    const { containerEl } = this;

    new Setting(containerEl)
      .setName(CONSTANTS.WORKOUT.SETTINGS.SECTIONS.QUICK_LOG)
      .setHeading();

    new Setting(containerEl)
      .setName(CONSTANTS.WORKOUT.SETTINGS.LABELS.SHOW_QUICK_LOG_RIBBON)
      .setDesc(CONSTANTS.WORKOUT.SETTINGS.DESCRIPTIONS.SHOW_QUICK_LOG_RIBBON)
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.showQuickLogRibbon)
          .onChange(async (value) => {
            this.plugin.settings.showQuickLogRibbon = value;
            await this.plugin.saveSettings();
            this.plugin.updateQuickLogRibbon();
          }),
      );

    new Setting(containerEl)
      .setName(CONSTANTS.WORKOUT.SETTINGS.LABELS.QUICK_WEIGHT_INCREMENT)
      .setDesc(CONSTANTS.WORKOUT.SETTINGS.DESCRIPTIONS.QUICK_WEIGHT_INCREMENT)
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
