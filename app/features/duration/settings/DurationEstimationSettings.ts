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

    // 1. Duration per Rep
    new Setting(containerEl)
      .setName(CONSTANTS.WORKOUT.SETTINGS.LABELS.REP_DURATION)
      .setDesc(CONSTANTS.WORKOUT.SETTINGS.DESCRIPTIONS.REP_DURATION)
      .addText((text) =>
        text
          .setValue(String(this.plugin.settings.repDuration))
          .onChange(async (value) => {
            const numValue = parseFloat(value);
            if (!isNaN(numValue) && numValue > 0) {
              this.plugin.settings.repDuration = numValue;
              await this.plugin.saveSettings();
            }
          }),
      );

    // 2. Default Reps per Set
    new Setting(containerEl)
      .setName(CONSTANTS.WORKOUT.SETTINGS.LABELS.DEFAULT_REPS_PER_SET)
      .setDesc(CONSTANTS.WORKOUT.SETTINGS.DESCRIPTIONS.DEFAULT_REPS_PER_SET)
      .addText((text) =>
        text
          .setValue(String(this.plugin.settings.defaultRepsPerSet))
          .onChange(async (value) => {
            const numValue = parseInt(value, 10);
            if (!isNaN(numValue) && numValue >= 0) {
              this.plugin.settings.defaultRepsPerSet = numValue;
              await this.plugin.saveSettings();
            }
          }),
      );

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
