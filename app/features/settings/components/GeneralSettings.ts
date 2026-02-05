import { App, Setting, normalizePath, Notice } from "obsidian";
import { CONSTANTS } from "@app/constants";
import { FolderSuggest } from "@app/features/common/suggest/FolderSuggest";
import { ConfirmModal } from "@app/features/modals/ConfirmModal";
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

    new Setting(containerEl)
      .setName(CONSTANTS.WORKOUT.SETTINGS.LABELS.CREATE_MUSCLE_TAGS_CSV)
      .setDesc(CONSTANTS.WORKOUT.SETTINGS.DESCRIPTIONS.CREATE_MUSCLE_TAGS_CSV)
      .addButton((button) =>
        button
          .setButtonText(CONSTANTS.WORKOUT.SETTINGS.BUTTONS.CREATE_MUSCLE_TAGS)
          .onClick(async () => {
            await this.handleCreateMuscleTagsCsv();
          }),
      );

    // Initial Setup Section
    new Setting(containerEl).setName("Example data").setHeading();

    new Setting(containerEl)
      .setName("Generate example data")
      .setDesc(
        "Create a folder with example exercises and workouts to help you get started.",
      )
      .addButton((button) =>
        button.setButtonText("Create examples").onClick(async () => {
          const { ExampleGeneratorService } =
            await import("@app/services/examples/ExampleGeneratorService");
          const generator = new ExampleGeneratorService(this.app);

          const folderExists = await this.app.vault.adapter.exists(
            normalizePath("The gym examples"),
          );

          if (folderExists) {
            new ConfirmModal(
              this.app,
              "The 'The gym examples' folder already exists. Do you want to overwrite it?",
              async () => {
                await generator.generateExampleFolder(true);
              },
            ).open();
          } else {
            await generator.generateExampleFolder(false);
          }
        }),
      );
  }

  /**
   * Handles the creation of the muscle tags CSV file.
   * If the file already exists, prompts for confirmation before overwriting.
   */
  private async handleCreateMuscleTagsCsv(): Promise<void> {
    const muscleTagService = this.plugin.getMuscleTagService();

    try {
      const exists = await muscleTagService.csvExists();

      if (exists) {
        // File exists, show confirmation modal
        new ConfirmModal(
          this.app,
          CONSTANTS.WORKOUT.SETTINGS.DESCRIPTIONS.CONFIRM_OVERWRITE_MUSCLE_TAGS,
          async () => {
            // User confirmed, overwrite by saving default tags
            await this.createMuscleTagsCsvWithDefaults();
          },
        ).open();
      } else {
        // File doesn't exist, create it directly
        await muscleTagService.createDefaultCsv();
        new Notice(CONSTANTS.WORKOUT.MESSAGES.SUCCESS.MUSCLE_TAGS_CSV_CREATED);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      new Notice(
        CONSTANTS.WORKOUT.MESSAGES.ERRORS.MUSCLE_TAGS_CSV_FAILED(errorMessage),
      );
    }
  }

  /**
   * Creates the muscle tags CSV file with default values, overwriting any existing file.
   */
  private async createMuscleTagsCsvWithDefaults(): Promise<void> {
    const muscleTagService = this.plugin.getMuscleTagService();
    const { MUSCLE_TAG_MAP } = await import("@app/constants/muscles.constants");
    const defaultTags = new Map(Object.entries(MUSCLE_TAG_MAP));

    try {
      await muscleTagService.saveTags(defaultTags);
      new Notice(CONSTANTS.WORKOUT.MESSAGES.SUCCESS.MUSCLE_TAGS_CSV_CREATED);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      new Notice(
        CONSTANTS.WORKOUT.MESSAGES.ERRORS.MUSCLE_TAGS_CSV_FAILED(errorMessage),
      );
    }
  }
}
