import { App, Setting, normalizePath, Notice } from "obsidian";
import { CONSTANTS } from "@app/constants";
import { FolderSuggest } from "@app/services/suggest/FolderSuggest";
import WorkoutChartsPlugin from "main";

export class GeneralSettings {
  constructor(
    private app: App,
    private plugin: WorkoutChartsPlugin,
    private containerEl: HTMLElement,
  ) {}

  render(): void {
    const { containerEl } = this;

    new Setting(containerEl)
      .setName(CONSTANTS.WORKOUT.SETTINGS.LABELS.CSV_PATH)
      .setDesc(CONSTANTS.WORKOUT.SETTINGS.DESCRIPTIONS.CSV_PATH)
      .addText((text) =>
        text
          .setPlaceholder(CONSTANTS.WORKOUT.FORMS.PLACEHOLDERS.ENTER_CSV_PATH)
          .setValue(this.plugin.settings.csvLogFilePath)
          .onChange(async (value) => {
            this.plugin.settings.csvLogFilePath = normalizePath(value);
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName(CONSTANTS.WORKOUT.SETTINGS.LABELS.EXERCISE_FOLDER)
      .setDesc(CONSTANTS.WORKOUT.SETTINGS.DESCRIPTIONS.EXERCISE_FOLDER)
      .addText((text) => {
        new FolderSuggest(this.app, text.inputEl);
        text
          .setPlaceholder(
            CONSTANTS.WORKOUT.FORMS.PLACEHOLDERS.ENTER_FOLDER_PATH,
          )
          .setValue(this.plugin.settings.exerciseFolderPath)
          .onChange(async (value) => {
            this.plugin.settings.exerciseFolderPath = normalizePath(value);
            await this.plugin.saveSettings();
          });
      });

    // Filtering Section
    new Setting(containerEl)
      .setName(CONSTANTS.WORKOUT.SETTINGS.SECTIONS.FILTERING)
      .setHeading();

    new Setting(containerEl)
      .setName(CONSTANTS.WORKOUT.SETTINGS.LABELS.DEFAULT_EXACT_MATCH)
      .setDesc(CONSTANTS.WORKOUT.SETTINGS.DESCRIPTIONS.DEFAULT_EXACT_MATCH)
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.defaultExactMatch)
          .onChange(async (value) => {
            this.plugin.settings.defaultExactMatch = value;
            await this.plugin.saveSettings();
          }),
      );

    // CSV Management Section
    new Setting(containerEl)
      .setName(CONSTANTS.WORKOUT.SETTINGS.SECTIONS.CSV_MANAGEMENT)
      .setHeading();

    new Setting(containerEl)
      .setName(CONSTANTS.WORKOUT.COMMANDS.CREATE_CSV)
      .setDesc(CONSTANTS.WORKOUT.SETTINGS.DESCRIPTIONS.CREATE_CSV)
      .addButton((button) =>
        button
          .setButtonText(CONSTANTS.WORKOUT.UI.BUTTONS.CREATE_FILE)
          .onClick(async () => {
            try {
              await this.plugin.createCSVLogFile();
              new Notice(CONSTANTS.WORKOUT.MESSAGES.SUCCESS.CSV_CREATED);
            } catch (error) {
              const errorMessage =
                error instanceof Error ? error.message : String(error);
              new Notice(`Error creating CSV file: ${errorMessage}`);
            }
          }),
      );
  }
}
