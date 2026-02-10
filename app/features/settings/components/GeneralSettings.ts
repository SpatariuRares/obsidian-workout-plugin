import { App, Setting, normalizePath, Notice } from "obsidian";
import { CONSTANTS } from "@app/constants";
import { FolderSuggest } from "@app/features/common/suggest/FolderSuggest";
import { ConfirmModal } from "@app/features/modals/common/ConfirmModal";
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
      .setDesc(CONSTANTS.WORKOUT.SETTINGS.DESCRIPTIONS.CSV_FOLDER)
      .addText((text) => {
        new FolderSuggest(this.app, text.inputEl);
        const currentPath = this.plugin.settings.csvLogFilePath;
        const lastSlash = currentPath.lastIndexOf("/");
        const folderPath = lastSlash > 0 ? currentPath.substring(0, lastSlash) : "";

        text
          .setPlaceholder(CONSTANTS.WORKOUT.FORMS.PLACEHOLDERS.ENTER_CSV_PATH)
          .setValue(folderPath)
          .onChange(async (value) => {
             const folder = normalizePath(value);
             this.plugin.settings.csvLogFilePath = `${folder}/workout_logs.csv`;
             await this.plugin.saveSettings();
          });
      });

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
      .setName(CONSTANTS.WORKOUT.SETTINGS.LABELS.SETUP_CSV)
      .setDesc(CONSTANTS.WORKOUT.SETTINGS.DESCRIPTIONS.SETUP_CSV)
      .addButton((button) =>
        button
          .setButtonText(CONSTANTS.WORKOUT.SETTINGS.BUTTONS.CREATE_FILES)
          .onClick(async () => {
            try {
              // Create workout log CSV
              await this.plugin.createCSVLogFile();
              
              // Create muscle tags CSV
              await this.handleCreateMuscleTagsCsv();

              new Notice(CONSTANTS.WORKOUT.SETTINGS.MESSAGES.CSV_FILES_CREATED);
            } catch (error) {
              const errorMessage =
                error instanceof Error ? error.message : String(error);
              new Notice(CONSTANTS.WORKOUT.SETTINGS.MESSAGES.CSV_FILES_ERROR(errorMessage));
            }
          }),
      );

    // Initial Setup Section
    new Setting(containerEl).setName(CONSTANTS.WORKOUT.SETTINGS.SECTIONS.EXAMPLE_DATA).setHeading();

    new Setting(containerEl)
      .setName(CONSTANTS.WORKOUT.SETTINGS.LABELS.GENERATE_EXAMPLES)
      .setDesc(CONSTANTS.WORKOUT.SETTINGS.DESCRIPTIONS.GENERATE_EXAMPLES)
      .addButton((button) =>
        button.setButtonText(CONSTANTS.WORKOUT.SETTINGS.BUTTONS.CREATE_EXAMPLES).onClick(async () => {
          const { ExampleGeneratorService } =
            await import("@app/services/examples/ExampleGeneratorService");
          const generator = new ExampleGeneratorService(this.app);

          const folderExists = await this.app.vault.adapter.exists(
            normalizePath("The gym examples"),
          );

          if (folderExists) {
            new ConfirmModal(
              this.app,
              CONSTANTS.WORKOUT.SETTINGS.MESSAGES.CONFIRM_OVERWRITE_EXAMPLES,
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
        this.plugin.triggerMuscleTagRefresh();
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
      this.plugin.triggerMuscleTagRefresh();
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
