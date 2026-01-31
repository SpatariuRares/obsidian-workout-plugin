import { Setting } from "obsidian";
import { CONSTANTS } from "@app/constants";
import WorkoutChartsPlugin from "main";

export class DurationEstimationSettings {
  constructor(
    private plugin: WorkoutChartsPlugin,
    private containerEl: HTMLElement,
  ) {}

  render(): void {
    const { containerEl } = this;

    new Setting(containerEl)
      .setName(CONSTANTS.WORKOUT.SETTINGS.SECTIONS.DURATION_ESTIMATION)
      .setHeading();

    new Setting(containerEl)
      .setName(CONSTANTS.WORKOUT.SETTINGS.LABELS.SET_DURATION)
      .setDesc(CONSTANTS.WORKOUT.SETTINGS.DESCRIPTIONS.SET_DURATION)
      .addText((text) =>
        text
          .setValue(String(this.plugin.settings.setDuration))
          .onChange(async (value) => {
            const numValue = parseInt(value, 10);
            if (!isNaN(numValue) && numValue > 0) {
              this.plugin.settings.setDuration = numValue;
              await this.plugin.saveSettings();
            }
          }),
      );
  }
}
