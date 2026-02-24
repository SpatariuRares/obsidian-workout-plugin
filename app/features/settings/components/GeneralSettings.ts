import { App, Setting, normalizePath, Notice } from "obsidian";
import { t } from "@app/i18n";
import { FolderSuggest } from "@app/features/common/suggest/FolderSuggest";
import { ConfirmModal } from "@app/features/modals/common/ConfirmModal";
import WorkoutChartsPlugin from "main";
import { ParameterUtils } from "@app/utils/parameter/ParameterUtils";
import { ErrorUtils } from "@app/utils/ErrorUtils";

export class GeneralSettings {
  constructor(
    private app: App,
    private plugin: WorkoutChartsPlugin,
    private containerEl: HTMLElement,
  ) {}

  render(): void {
    const { containerEl } = this;

    // Top-level "Setup & data" heading for the path/unit fields
    new Setting(containerEl)
      .setName(t("settings.sections.setupAndData"))
      .setHeading();

    new Setting(containerEl)
      .setName(t("settings.labels.csvPath"))
      .setDesc(t("settings.descriptions.csvFolder"))
      .addText((text) => {
        new FolderSuggest(this.app, text.inputEl);
        const currentPath = this.plugin.settings.csvLogFilePath;
        const lastSlash = currentPath.lastIndexOf("/");
        const folderPath =
          lastSlash > 0 ? currentPath.substring(0, lastSlash) : "";

        text
          .setPlaceholder(t("forms.enterCsvPath"))
          .setValue(folderPath)
          .onChange(async (value) => {
            const folder = normalizePath(value);
            this.plugin.settings.csvLogFilePath = `${folder}/workout_logs.csv`;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName(t("settings.labels.exerciseFolder"))
      .setDesc(t("settings.descriptions.exerciseFolder"))
      .addText((text) => {
        new FolderSuggest(this.app, text.inputEl);
        text
          .setPlaceholder(t("forms.enterFolderPath"))
          .setValue(this.plugin.settings.exerciseFolderPath)
          .onChange(async (value) => {
            this.plugin.settings.exerciseFolderPath = normalizePath(value);
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName(t("settings.labels.weightUnit"))
      .setDesc(t("settings.descriptions.weightUnit"))
      .addDropdown((dropdown) =>
        dropdown
          .addOption("kg", t("settings.options.weightUnit.kg"))
          .addOption("lb", t("settings.options.weightUnit.lb"))
          .setValue(this.plugin.settings.weightUnit)
          .onChange(async (value) => {
            this.plugin.settings.weightUnit = value as "kg" | "lb";
            // Update ParameterUtils with new weight unit
            ParameterUtils.setWeightUnit(value);
            await this.plugin.saveSettings();
            // Trigger global refresh to update all views with new unit
            this.plugin.triggerWorkoutLogRefresh({});
          }),
      );

    // Filtering Section
    new Setting(containerEl)
      .setName(t("settings.sections.filtering"))
      .setHeading();

    new Setting(containerEl)
      .setName(t("settings.labels.defaultExactMatch"))
      .setDesc(t("settings.descriptions.defaultExactMatch"))
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
      .setName(t("settings.sections.csvManagement"))
      .setHeading();

    new Setting(containerEl)
      .setName(t("settings.labels.setupCSV"))
      .setDesc(t("settings.descriptions.setupCSV"))
      .addButton((button) =>
        button
          .setButtonText(t("settings.buttons.createFiles"))
          .onClick(async () => {
            try {
              // Create workout log CSV
              await this.plugin.createCSVLogFile();

              // Create muscle tags CSV
              await this.handleCreateMuscleTagsCsv();

              new Notice(t("settings.messages.csvFilesCreated"));
            } catch (error) {
              const errorMessage = ErrorUtils.getErrorMessage(error);
              new Notice(`Error creating CSV files: ${errorMessage}`);
            }
          }),
      );

    // Initial Setup Section
    new Setting(containerEl)
      .setName(t("settings.sections.exampleData"))
      .setHeading();

    new Setting(containerEl)
      .setName(t("settings.labels.generateExamples"))
      .setDesc(t("settings.descriptions.generateExamples"))
      .addButton((button) =>
        button
          .setButtonText(t("settings.buttons.createExamples"))
          .onClick(async () => {
            const { ExampleGeneratorService } =
              await import("@app/services/examples/ExampleGeneratorService");
            const generator = new ExampleGeneratorService(this.app);

            const folderExists = await this.app.vault.adapter.exists(
              normalizePath("The gym examples"),
            );

            if (folderExists) {
              new ConfirmModal(
                this.app,
                t("settings.messages.confirmOverwriteExamples"),
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
          t("settings.descriptions.confirmOverwriteMuscleTags"),
          async () => {
            // User confirmed, overwrite by saving default tags
            await this.createMuscleTagsCsvWithDefaults();
          },
        ).open();
      } else {
        // File doesn't exist, create it directly
        await muscleTagService.createDefaultCsv();
        this.plugin.triggerMuscleTagRefresh();
        new Notice(t("settings.messages.csvFilesCreated"));
      }
    } catch (error) {
      const errorMessage = ErrorUtils.getErrorMessage(error);
      new Notice(`Error creating muscle tags CSV: ${errorMessage}`);
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
      new Notice(t("settings.messages.csvFilesCreated"));
    } catch (error) {
      const errorMessage = ErrorUtils.getErrorMessage(error);
      new Notice(`Error creating muscle tags CSV: ${errorMessage}`);
    }
  }
}
