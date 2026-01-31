import { Setting } from "obsidian";
import { CONSTANTS } from "@app/constants";
import WorkoutChartsPlugin from "main";

export class TemplatesSettings {
  constructor(
    private plugin: WorkoutChartsPlugin,
    private containerEl: HTMLElement,
  ) {}

  render(): void {
    const { containerEl } = this;

    new Setting(containerEl)
      .setName(CONSTANTS.WORKOUT.SETTINGS.SECTIONS.TEMPLATES)
      .setHeading();

    new Setting(containerEl)
      .setName(CONSTANTS.WORKOUT.SETTINGS.LABELS.EXERCISE_BLOCK_TEMPLATE)
      .setDesc(CONSTANTS.WORKOUT.SETTINGS.DESCRIPTIONS.EXERCISE_BLOCK_TEMPLATE)
      .addTextArea((text) => {
        text
          .setValue(this.plugin.settings.exerciseBlockTemplate)
          .setPlaceholder(this.plugin.settings.exerciseBlockTemplate)
          .onChange(async (value) => {
            this.plugin.settings.exerciseBlockTemplate = value;
            await this.plugin.saveSettings();
          });
        text.inputEl.rows = 10;
        text.inputEl.cols = 50;
      });
  }
}
