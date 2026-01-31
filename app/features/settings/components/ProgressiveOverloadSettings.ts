import { Setting } from "obsidian";
import { CONSTANTS } from "@app/constants";
import WorkoutChartsPlugin from "main";

export class ProgressiveOverloadSettings {
  constructor(
    private plugin: WorkoutChartsPlugin,
    private containerEl: HTMLElement,
  ) {}

  render(): void {
    const { containerEl } = this;

    new Setting(containerEl)
      .setName(CONSTANTS.WORKOUT.SETTINGS.SECTIONS.PROGRESSIVE_OVERLOAD)
      .setHeading();

    new Setting(containerEl)
      .setName(CONSTANTS.WORKOUT.SETTINGS.LABELS.WEIGHT_INCREMENT)
      .setDesc(CONSTANTS.WORKOUT.SETTINGS.DESCRIPTIONS.WEIGHT_INCREMENT)
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
